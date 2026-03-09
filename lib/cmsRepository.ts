import type { ZodType } from "zod";
import { z } from "zod";
import type { PoolClient } from "pg";
import { dbQuery, isDatabaseConfigured, withDbClient } from "@/lib/db";
import { ensureDatabaseReady } from "@/lib/db/ready";
import { exportCmsSnapshot } from "@/lib/db/cmsDefaults";
import type {
  CmsCatalogDetailSeoTemplateDocument,
  CmsCatalogLabelsDocument,
  CmsCatalogListSeoDocument,
  CmsDocumentKey,
  CmsFooterDocument,
  CmsGlobalSeoDocument,
  CmsHomeContentDocument,
  CmsHomeLayoutDocument,
  CmsNewsSettingsDocument,
  CmsNavigationDocument,
  CmsRevisionRecord,
  CmsSeoDocument,
  CmsSnapshot,
} from "@/types/cms";
import type { ContentPage, ContentPageSlug } from "@/types/content-pages";
import {
  cmsCatalogDetailSeoTemplateSchema,
  cmsCatalogLabelsSchema,
  cmsCatalogListSeoSchema,
  cmsContentPageSchema,
  cmsFooterSchema,
  cmsGlobalSeoSchema,
  cmsHomeContentSchema,
  cmsHomeLayoutSchema,
  cmsNewsSettingsSchema,
  cmsNavigationSchema,
  cmsSeoBundleSchema,
  homeBlockKeySchema,
} from "@/lib/schemas/cms";

const HOME_BLOCK_ORDER = ["hero", "promo", "market", "calculator", "team"] as const;
const HOME_BLOCK_SET = new Set(HOME_BLOCK_ORDER);

const cmsRevisionRowSchema = z.object({
  id: z.number(),
  key: z.string(),
  content: z.unknown(),
  created_at: z.string(),
  created_by: z.string().nullable(),
});

let fallbackSnapshotPromise: Promise<CmsSnapshot> | null = null;

async function getFallbackSnapshot(): Promise<CmsSnapshot> {
  if (!fallbackSnapshotPromise) {
    fallbackSnapshotPromise = exportCmsSnapshot();
  }
  return fallbackSnapshotPromise;
}

function parseCmsDocument<T>(key: CmsDocumentKey, schema: ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new Error(`CMS document ${key} has invalid shape: ${parsed.error.message}`);
  }
  return parsed.data;
}

async function readCmsDocumentFromDb<T>(key: CmsDocumentKey, schema: ZodType<T>): Promise<T | null> {
  const response = await dbQuery<{ content: unknown }>(`SELECT content FROM cms_documents WHERE key = $1`, [key]);
  const raw = response.rows[0]?.content;
  if (raw === undefined) {
    return null;
  }
  return parseCmsDocument(key, schema, raw);
}

async function readCmsDocumentWithFallback<T>(
  key: CmsDocumentKey,
  schema: ZodType<T>,
  fallbackResolver: (snapshot: CmsSnapshot) => unknown,
): Promise<T> {
  const fallbackSnapshot = await getFallbackSnapshot();
  const fallbackValue = parseCmsDocument(key, schema, fallbackResolver(fallbackSnapshot));

  if (!isDatabaseConfigured()) {
    return fallbackValue;
  }

  try {
    await ensureDatabaseReady();
    const dbValue = await readCmsDocumentFromDb(key, schema);
    return dbValue ?? fallbackValue;
  } catch (error) {
    console.error(`[cmsRepository] Falling back to file defaults for ${key}:`, error);
    return fallbackValue;
  }
}

function normalizeHomeLayout(layout: CmsHomeLayoutDocument): CmsHomeLayoutDocument {
  const seen = new Set<string>();
  const blocks = layout.blocks
    .filter((block) => HOME_BLOCK_SET.has(block.key))
    .filter((block) => {
      if (seen.has(block.key)) return false;
      seen.add(block.key);
      return true;
    });

  for (const key of HOME_BLOCK_ORDER) {
    if (!seen.has(key)) {
      blocks.push({ key, enabled: true });
    }
  }

  return { blocks };
}

export function enforceNavigationStructure(
  previous: CmsNavigationDocument,
  next: CmsNavigationDocument,
): CmsNavigationDocument {
  if (previous.links.length !== next.links.length) {
    throw new Error("Структура верхнего меню фиксирована: нельзя добавлять или удалять пункты");
  }

  const prevSecondaryMenus = previous.secondaryMenus || [];
  const nextSecondaryMenus = next.secondaryMenus || [];
  if (prevSecondaryMenus.length !== nextSecondaryMenus.length) {
    throw new Error("Структура подменю фиксирована: нельзя добавлять или удалять разделы");
  }

  for (let i = 0; i < prevSecondaryMenus.length; i += 1) {
    if (prevSecondaryMenus[i].items.length !== nextSecondaryMenus[i].items.length) {
      throw new Error(`Структура подменю «${prevSecondaryMenus[i].label}» фиксирована`);
    }
  }

  const prevSecondaryLinks = previous.secondaryLinks || [];
  const nextSecondaryLinks = next.secondaryLinks || [];
  if (prevSecondaryLinks.length !== nextSecondaryLinks.length) {
    throw new Error("Структура дополнительных ссылок фиксирована");
  }

  return next;
}

async function saveCmsDocument(client: PoolClient, key: CmsDocumentKey, content: unknown, userId: string | null) {
  await client.query(
    `
      INSERT INTO cms_documents (key, content, updated_by, updated_at)
      VALUES ($1, $2::jsonb, $3, NOW())
      ON CONFLICT (key)
      DO UPDATE SET content = EXCLUDED.content, updated_by = EXCLUDED.updated_by, updated_at = NOW()
    `,
    [key, JSON.stringify(content), userId],
  );

  await client.query(
    `INSERT INTO cms_revisions (key, content, created_by) VALUES ($1, $2::jsonb, $3)`,
    [key, JSON.stringify(content), userId],
  );
}

export async function readHomeLayout(): Promise<CmsHomeLayoutDocument> {
  const layout = await readCmsDocumentWithFallback("home_layout", cmsHomeLayoutSchema, (snapshot) => snapshot.homeLayout);
  return normalizeHomeLayout(layout);
}

export async function readHomeContent(): Promise<CmsHomeContentDocument> {
  return readCmsDocumentWithFallback("home_content", cmsHomeContentSchema, (snapshot) => snapshot.homeContent);
}

export async function readNavigation(): Promise<CmsNavigationDocument> {
  return readCmsDocumentWithFallback("navigation", cmsNavigationSchema, (snapshot) => snapshot.navigation);
}

export async function readFooter(): Promise<CmsFooterDocument> {
  return readCmsDocumentWithFallback("footer", cmsFooterSchema, (snapshot) => snapshot.footer);
}

export async function readNewsSettings(): Promise<CmsNewsSettingsDocument> {
  return readCmsDocumentWithFallback("news:settings", cmsNewsSettingsSchema, (snapshot) => snapshot.newsSettings);
}

export async function readGlobalSeo(): Promise<CmsGlobalSeoDocument> {
  return readCmsDocumentWithFallback("seo:global", cmsGlobalSeoSchema, (snapshot) => snapshot.globalSeo);
}

export async function readCatalogListSeo(): Promise<CmsCatalogListSeoDocument> {
  return readCmsDocumentWithFallback("seo:catalog-list", cmsCatalogListSeoSchema, (snapshot) => snapshot.catalogListSeo);
}

export async function readCatalogDetailSeoTemplate(): Promise<CmsCatalogDetailSeoTemplateDocument> {
  return readCmsDocumentWithFallback(
    "seo:catalog-detail-template",
    cmsCatalogDetailSeoTemplateSchema,
    (snapshot) => snapshot.catalogDetailSeoTemplate,
  );
}

export async function readCatalogLabels(): Promise<CmsCatalogLabelsDocument> {
  return readCmsDocumentWithFallback("catalog:labels", cmsCatalogLabelsSchema, (snapshot) => snapshot.catalogLabels);
}

export async function readContentPage(slug: ContentPageSlug): Promise<ContentPage> {
  const key = `page:${slug}` as CmsDocumentKey;
  return readCmsDocumentWithFallback(key, cmsContentPageSchema, (snapshot) => snapshot.pages[slug]);
}

export async function readAllContentPages(): Promise<Record<ContentPageSlug, ContentPage>> {
  const [about, services, tools, useful, contacts] = await Promise.all([
    readContentPage("o-kompanii"),
    readContentPage("uslugi"),
    readContentPage("servisy"),
    readContentPage("poleznoe"),
    readContentPage("kontakty"),
  ]);

  return {
    "o-kompanii": about,
    uslugi: services,
    servisy: tools,
    poleznoe: useful,
    kontakty: contacts,
  };
}

export async function readCmsSnapshot(): Promise<CmsSnapshot> {
  const [
    homeLayout,
    homeContent,
    navigation,
    footer,
    newsSettings,
    globalSeo,
    catalogListSeo,
    catalogDetailSeoTemplate,
    catalogLabels,
    pages,
  ] = await Promise.all([
    readHomeLayout(),
    readHomeContent(),
    readNavigation(),
    readFooter(),
    readNewsSettings(),
    readGlobalSeo(),
    readCatalogListSeo(),
    readCatalogDetailSeoTemplate(),
    readCatalogLabels(),
    readAllContentPages(),
  ]);

  return {
    homeLayout,
    homeContent,
    navigation,
    footer,
    newsSettings,
    globalSeo,
    catalogListSeo,
    catalogDetailSeoTemplate,
    catalogLabels,
    pages,
  };
}

function requireDatabaseForWrite() {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is not configured. CMS write operations require Postgres.");
  }
}

export async function writeHomeCms(
  payload: { layout: CmsHomeLayoutDocument; content: CmsHomeContentDocument },
  userId: string | null,
): Promise<void> {
  requireDatabaseForWrite();
  await ensureDatabaseReady();

  const layout = normalizeHomeLayout(cmsHomeLayoutSchema.parse(payload.layout));
  const content = cmsHomeContentSchema.parse(payload.content);

  await withDbClient(async (client) => {
    await client.query("BEGIN");
    try {
      await saveCmsDocument(client, "home_layout", layout, userId);
      await saveCmsDocument(client, "home_content", content, userId);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}

export async function writeNavigation(nextNavigation: CmsNavigationDocument, userId: string | null): Promise<void> {
  requireDatabaseForWrite();
  await ensureDatabaseReady();

  const parsed = cmsNavigationSchema.parse(nextNavigation);
  const previous = await readNavigation();
  const constrained = enforceNavigationStructure(previous, parsed);

  await withDbClient(async (client) => {
    await saveCmsDocument(client, "navigation", constrained, userId);
  });
}

export async function writeFooter(nextFooter: CmsFooterDocument, userId: string | null): Promise<void> {
  requireDatabaseForWrite();
  await ensureDatabaseReady();
  const parsed = cmsFooterSchema.parse(nextFooter);

  await withDbClient(async (client) => {
    await saveCmsDocument(client, "footer", parsed, userId);
  });
}

export async function writeNewsSettings(nextSettings: CmsNewsSettingsDocument, userId: string | null): Promise<void> {
  requireDatabaseForWrite();
  await ensureDatabaseReady();
  const parsed = cmsNewsSettingsSchema.parse(nextSettings);

  await withDbClient(async (client) => {
    await saveCmsDocument(client, "news:settings", parsed, userId);
  });
}

export async function writeContentPageDoc(
  slug: ContentPageSlug,
  page: ContentPage,
  userId: string | null,
): Promise<void> {
  requireDatabaseForWrite();
  await ensureDatabaseReady();

  const parsed = cmsContentPageSchema.parse(page);
  if (parsed.slug !== slug) {
    throw new Error(`Slug mismatch: expected ${slug}, got ${parsed.slug}`);
  }

  const key = `page:${slug}` as CmsDocumentKey;
  await withDbClient(async (client) => {
    await saveCmsDocument(client, key, parsed, userId);
  });
}

export async function writeSeoBundle(nextSeo: CmsSeoDocument, userId: string | null): Promise<void> {
  requireDatabaseForWrite();
  await ensureDatabaseReady();

  const parsed = cmsSeoBundleSchema.parse(nextSeo);

  await withDbClient(async (client) => {
    await client.query("BEGIN");
    try {
      await saveCmsDocument(client, "seo:global", parsed.global, userId);
      await saveCmsDocument(client, "seo:catalog-list", parsed.catalogList, userId);
      await saveCmsDocument(client, "seo:catalog-detail-template", parsed.catalogDetailTemplate, userId);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}

export async function writeContentPagesAndGlobalSeo(params: {
  pages: Record<ContentPageSlug, ContentPage>;
  globalSeo: CmsGlobalSeoDocument;
}, userId: string | null): Promise<void> {
  requireDatabaseForWrite();
  await ensureDatabaseReady();

  const pageAbout = cmsContentPageSchema.parse(params.pages["o-kompanii"]);
  const pageServices = cmsContentPageSchema.parse(params.pages.uslugi);
  const pageTools = cmsContentPageSchema.parse(params.pages.servisy);
  const pageUseful = cmsContentPageSchema.parse(params.pages.poleznoe);
  const pageContacts = cmsContentPageSchema.parse(params.pages.kontakty);
  const globalSeo = cmsGlobalSeoSchema.parse(params.globalSeo);

  await withDbClient(async (client) => {
    await client.query("BEGIN");
    try {
      await saveCmsDocument(client, "page:o-kompanii", pageAbout, userId);
      await saveCmsDocument(client, "page:uslugi", pageServices, userId);
      await saveCmsDocument(client, "page:servisy", pageTools, userId);
      await saveCmsDocument(client, "page:poleznoe", pageUseful, userId);
      await saveCmsDocument(client, "page:kontakty", pageContacts, userId);
      await saveCmsDocument(client, "seo:global", globalSeo, userId);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}

export async function writeCatalogLabels(nextLabels: CmsCatalogLabelsDocument, userId: string | null): Promise<void> {
  requireDatabaseForWrite();
  await ensureDatabaseReady();

  const parsed = cmsCatalogLabelsSchema.parse(nextLabels);
  await withDbClient(async (client) => {
    await saveCmsDocument(client, "catalog:labels", parsed, userId);
  });
}

export async function readCmsRevisions(options?: {
  key?: CmsDocumentKey;
  limit?: number;
}): Promise<CmsRevisionRecord[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  await ensureDatabaseReady();

  const limit = Math.max(1, Math.min(200, options?.limit ?? 50));
  const values: unknown[] = [];
  const where: string[] = [];

  if (options?.key) {
    values.push(options.key);
    where.push(`key = $${values.length}`);
  }

  values.push(limit);
  const query = `
    SELECT id, key, content, created_at, created_by
    FROM cms_revisions
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY created_at DESC, id DESC
    LIMIT $${values.length}
  `;

  const response = await dbQuery(query, values);

  return response.rows.map((row) => {
    const parsed = cmsRevisionRowSchema.parse(row as unknown);
    return {
      id: parsed.id,
      key: parsed.key as CmsDocumentKey,
      content: parsed.content,
      createdAt: parsed.created_at,
      createdBy: parsed.created_by,
    };
  });
}

export function sanitizeHomeLayoutInput(value: unknown): CmsHomeLayoutDocument {
  const parsed = cmsHomeLayoutSchema.parse(value);
  return normalizeHomeLayout(parsed);
}

export function isValidHomeBlockKey(value: string): value is z.infer<typeof homeBlockKeySchema> {
  return homeBlockKeySchema.safeParse(value).success;
}
