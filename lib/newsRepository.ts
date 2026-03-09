import { dbQuery, isDatabaseConfigured } from "@/lib/db";
import { ensureDatabaseReady } from "@/lib/db/ready";
import { invalidateNewsCache } from "@/lib/cacheInvalidation";
import {
  newsBlockSchema,
  newsCtaSchema,
  newsFaqItemSchema,
  newsSeoOverrideSchema,
} from "@/lib/schemas/news";
import type {
  NewsBlock,
  NewsCreateRequest,
  NewsCta,
  NewsFacets,
  NewsFaqItem,
  NewsListQuery,
  NewsListResult,
  NewsMediaRef,
  NewsPost,
  NewsSeoOverride,
  NewsStatus,
  NewsStatusPatchRequest,
  NewsUpdateRequest,
} from "@/types/news";

interface NewsPostRow {
  id: string;
  slug: string;
  title: string;
  lead: string;
  excerpt: string;
  status: NewsStatus;
  published_at: string | null;
  is_pinned: boolean;
  category: string;
  tags: string[] | null;
  cover: unknown;
  blocks: unknown;
  faq: unknown;
  cta: unknown;
  seo_override: unknown;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

function requireDbForWrites() {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is not configured. News write operations require Postgres.");
  }
}

const RECOVERABLE_DB_READ_ERRORS = new Set([
  "ENOTFOUND",
  "EAI_AGAIN",
  "ECONNREFUSED",
  "ECONNRESET",
  "ETIMEDOUT",
  "08000",
  "08001",
  "08003",
  "08004",
  "08006",
  "08007",
  "08P01",
  "57P03",
  "53300",
  "3D000",
]);

function isRecoverableDbReadError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = typeof (error as { code?: unknown }).code === "string" ? (error as { code: string }).code : "";
  return RECOVERABLE_DB_READ_ERRORS.has(code);
}

function logReadFallback(scope: string, error: unknown) {
  console.warn(`[newsRepository] Falling back to safe read for ${scope}:`, error);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeMediaRef(value: unknown): NewsMediaRef | null {
  if (!isRecord(value)) return null;
  const url = typeof value.url === "string" ? value.url.trim() : "";
  if (!url) return null;

  return {
    mediaAssetId: typeof value.mediaAssetId === "string" ? value.mediaAssetId : null,
    url,
    alt: typeof value.alt === "string" ? value.alt : "",
  };
}

function normalizeBlocks(value: unknown): NewsBlock[] {
  if (!Array.isArray(value)) return [];
  const blocks: NewsBlock[] = [];

  for (const item of value) {
    const parsed = newsBlockSchema.safeParse(item);
    if (parsed.success) {
      blocks.push(parsed.data);
    }
  }

  return blocks;
}

function normalizeFaq(value: unknown): NewsFaqItem[] {
  if (!Array.isArray(value)) return [];
  const result: NewsFaqItem[] = [];

  for (const item of value) {
    const parsed = newsFaqItemSchema.safeParse(item);
    if (parsed.success) {
      result.push(parsed.data);
    }
  }

  return result;
}

function normalizeCta(value: unknown): NewsCta | null {
  if (value === null || value === undefined) return null;
  const parsed = newsCtaSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function normalizeSeoOverride(value: unknown): NewsSeoOverride {
  const parsed = newsSeoOverrideSchema.safeParse(value);
  return parsed.success ? parsed.data : {};
}

function rowToNewsPost(row: NewsPostRow): NewsPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    lead: row.lead,
    excerpt: row.excerpt,
    status: row.status,
    publishedAt: row.published_at,
    isPinned: Boolean(row.is_pinned),
    category: row.category || "",
    tags: Array.isArray(row.tags) ? row.tags : [],
    cover: normalizeMediaRef(row.cover),
    blocks: normalizeBlocks(row.blocks),
    faq: normalizeFaq(row.faq),
    cta: normalizeCta(row.cta),
    seoOverride: normalizeSeoOverride(row.seo_override),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

function normalizeTags(tags: string[] | undefined): string[] {
  if (!Array.isArray(tags)) return [];
  const normalized = tags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 50);

  return Array.from(new Set(normalized));
}

function normalizeForWrite(input: NewsCreateRequest) {
  const status = input.status;
  const nowIso = new Date().toISOString();
  const publishedAt = input.publishedAt ?? null;
  const normalizedPublishedAt = status === "published" ? publishedAt || nowIso : publishedAt;

  const normalized = {
    slug: input.slug.trim().toLowerCase(),
    title: input.title.trim(),
    lead: input.lead.trim(),
    excerpt: input.excerpt.trim(),
    status,
    publishedAt: normalizedPublishedAt,
    isPinned: Boolean(input.isPinned),
    category: (input.category || "").trim(),
    tags: normalizeTags(input.tags),
    cover: input.cover ?? null,
    blocks: input.blocks || [],
    faq: input.faq || [],
    cta: input.cta ?? null,
    seoOverride: input.seoOverride || {},
    archivedAt: status === "archived" ? nowIso : null,
  };

  assertPublishability(normalized);
  return normalized;
}

function assertPublishability(input: {
  title: string;
  lead: string;
  excerpt: string;
  status: NewsStatus;
  publishedAt: string | null;
  cover: NewsMediaRef | null;
  blocks: NewsBlock[];
}) {
  if (input.status !== "published" && input.status !== "scheduled") {
    return;
  }

  if (!input.title || !input.lead || !input.excerpt) {
    throw new Error("Для публикации заполните title, lead и excerpt");
  }

  if (!input.cover?.url) {
    throw new Error("Для публикации требуется обложка");
  }

  if (!Array.isArray(input.blocks) || input.blocks.length === 0) {
    throw new Error("Для публикации добавьте хотя бы один контент-блок");
  }

  if (!input.publishedAt) {
    throw new Error("Для публикации требуется дата/время публикации");
  }
}

function buildWhere(query: NewsListQuery) {
  const clauses: string[] = [];
  const values: unknown[] = [];

  if (query.onlyPublished) {
    clauses.push(`c.status IN ('published', 'scheduled')`);
    clauses.push(`c.published_at IS NOT NULL`);
    clauses.push(`c.published_at <= NOW()`);
    clauses.push(`c.archived_at IS NULL`);
    clauses.push(`c.status <> 'archived'`);
  } else if (!query.includeArchived) {
    clauses.push(`c.status <> 'archived'`);
    clauses.push(`c.archived_at IS NULL`);
  }

  if (query.status) {
    values.push(query.status);
    clauses.push(`c.status = $${values.length}`);
  }

  if (query.category) {
    values.push(query.category.trim());
    clauses.push(`c.category = $${values.length}`);
  }

  if (query.tag) {
    values.push(query.tag.trim());
    clauses.push(`$${values.length} = ANY(c.tags)`);
  }

  if (query.search && query.search.trim()) {
    values.push(`%${query.search.trim()}%`);
    clauses.push(`(c.title ILIKE $${values.length} OR c.lead ILIKE $${values.length} OR c.excerpt ILIKE $${values.length})`);
  }

  return {
    whereSql: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    values,
  };
}

export async function listNews(query: NewsListQuery): Promise<NewsListResult> {
  const page = Math.max(1, query.page || 1);
  const pageSize = Math.max(1, Math.min(100, query.pageSize || 12));
  const normalized: NewsListQuery = {
    ...query,
    page,
    pageSize,
  };

  if (!isDatabaseConfigured()) {
    return {
      items: [],
      total: 0,
      page,
      pageSize,
    };
  }

  try {
    await ensureDatabaseReady();

    const { whereSql, values } = buildWhere(normalized);
    const countRes = await dbQuery<{ count: string }>(`SELECT COUNT(*)::text AS count FROM news_posts c ${whereSql}`, values);
    const total = Number(countRes.rows[0]?.count || "0");

    const offset = (page - 1) * pageSize;
    const listValues = [...values, pageSize, offset];
    const limitPlaceholder = `$${listValues.length - 1}`;
    const offsetPlaceholder = `$${listValues.length}`;

    const rows = await dbQuery<NewsPostRow>(
      `
        SELECT
          c.id,
          c.slug,
          c.title,
          c.lead,
          c.excerpt,
          c.status,
          c.published_at,
          c.is_pinned,
          c.category,
          c.tags,
          c.cover,
          c.blocks,
          c.faq,
          c.cta,
          c.seo_override,
          c.created_at,
          c.updated_at,
          c.archived_at
        FROM news_posts c
        ${whereSql}
        ORDER BY c.is_pinned DESC, COALESCE(c.published_at, c.created_at) DESC, c.created_at DESC
        LIMIT ${limitPlaceholder}
        OFFSET ${offsetPlaceholder}
      `,
      listValues,
    );

    return {
      items: rows.rows.map(rowToNewsPost),
      total,
      page,
      pageSize,
    };
  } catch (error) {
    if (normalized.onlyPublished && isRecoverableDbReadError(error)) {
      logReadFallback("listNews", error);
      return {
        items: [],
        total: 0,
        page,
        pageSize,
      };
    }

    throw error;
  }
}

export async function findNewsById(id: string): Promise<NewsPost | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  await ensureDatabaseReady();
  const result = await dbQuery<NewsPostRow>(
    `
      SELECT
        c.id,
        c.slug,
        c.title,
        c.lead,
        c.excerpt,
        c.status,
        c.published_at,
        c.is_pinned,
        c.category,
        c.tags,
        c.cover,
        c.blocks,
        c.faq,
        c.cta,
        c.seo_override,
        c.created_at,
        c.updated_at,
        c.archived_at
      FROM news_posts c
      WHERE c.id = $1
      LIMIT 1
    `,
    [id],
  );

  const row = result.rows[0];
  return row ? rowToNewsPost(row) : null;
}

export async function findNewsBySlug(slug: string, onlyPublished: boolean): Promise<NewsPost | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  try {
    await ensureDatabaseReady();

    const values: unknown[] = [slug.trim().toLowerCase()];
    const clauses = [`LOWER(c.slug) = $1`];

    if (onlyPublished) {
      clauses.push(`c.status IN ('published', 'scheduled')`);
      clauses.push(`c.published_at IS NOT NULL`);
      clauses.push(`c.published_at <= NOW()`);
      clauses.push(`c.archived_at IS NULL`);
      clauses.push(`c.status <> 'archived'`);
    }

    const result = await dbQuery<NewsPostRow>(
      `
        SELECT
          c.id,
          c.slug,
          c.title,
          c.lead,
          c.excerpt,
          c.status,
          c.published_at,
          c.is_pinned,
          c.category,
          c.tags,
          c.cover,
          c.blocks,
          c.faq,
          c.cta,
          c.seo_override,
          c.created_at,
          c.updated_at,
          c.archived_at
        FROM news_posts c
        WHERE ${clauses.join(" AND ")}
        LIMIT 1
      `,
      values,
    );

    const row = result.rows[0];
    return row ? rowToNewsPost(row) : null;
  } catch (error) {
    if (onlyPublished && isRecoverableDbReadError(error)) {
      logReadFallback("findNewsBySlug", error);
      return null;
    }

    throw error;
  }
}

export async function createNewsPost(input: NewsCreateRequest, userId: string | null): Promise<NewsPost> {
  requireDbForWrites();
  await ensureDatabaseReady();

  const normalized = normalizeForWrite(input);

  const response = await dbQuery<{ id: string }>(
    `
      INSERT INTO news_posts (
        slug,
        title,
        lead,
        excerpt,
        status,
        published_at,
        is_pinned,
        category,
        tags,
        cover,
        blocks,
        faq,
        cta,
        seo_override,
        archived_at,
        created_by,
        updated_by
      ) VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9::text[],
        $10::jsonb,
        $11::jsonb,
        $12::jsonb,
        $13::jsonb,
        $14::jsonb,
        $15,
        $16,
        $16
      )
      RETURNING id
    `,
    [
      normalized.slug,
      normalized.title,
      normalized.lead,
      normalized.excerpt,
      normalized.status,
      normalized.publishedAt,
      normalized.isPinned,
      normalized.category,
      normalized.tags,
      JSON.stringify(normalized.cover),
      JSON.stringify(normalized.blocks),
      JSON.stringify(normalized.faq),
      JSON.stringify(normalized.cta),
      JSON.stringify(normalized.seoOverride),
      normalized.archivedAt,
      userId,
    ],
  );

  const id = response.rows[0]?.id;
  const created = id ? await findNewsById(id) : null;
  if (!created) {
    throw new Error("Не удалось загрузить созданную новость");
  }

  invalidateNewsCache();
  return created;
}

export async function updateNewsPost(id: string, patch: NewsUpdateRequest, userId: string | null): Promise<NewsPost> {
  requireDbForWrites();
  await ensureDatabaseReady();

  const existing = await findNewsById(id);
  if (!existing) {
    throw new Error("Новость не найдена");
  }

  const merged: NewsCreateRequest = {
    slug: patch.slug ?? existing.slug,
    title: patch.title ?? existing.title,
    lead: patch.lead ?? existing.lead,
    excerpt: patch.excerpt ?? existing.excerpt,
    status: patch.status ?? existing.status,
    publishedAt: patch.publishedAt !== undefined ? patch.publishedAt : existing.publishedAt,
    isPinned: patch.isPinned ?? existing.isPinned,
    category: patch.category ?? existing.category,
    tags: patch.tags ?? existing.tags,
    cover: patch.cover !== undefined ? patch.cover : existing.cover,
    blocks: patch.blocks ?? existing.blocks,
    faq: patch.faq ?? existing.faq,
    cta: patch.cta !== undefined ? patch.cta : existing.cta,
    seoOverride: patch.seoOverride ?? existing.seoOverride,
  };

  const normalized = normalizeForWrite(merged);

  await dbQuery(
    `
      UPDATE news_posts
      SET
        slug = $2,
        title = $3,
        lead = $4,
        excerpt = $5,
        status = $6,
        published_at = $7,
        is_pinned = $8,
        category = $9,
        tags = $10::text[],
        cover = $11::jsonb,
        blocks = $12::jsonb,
        faq = $13::jsonb,
        cta = $14::jsonb,
        seo_override = $15::jsonb,
        archived_at = $16,
        updated_by = $17,
        updated_at = NOW()
      WHERE id = $1
    `,
    [
      id,
      normalized.slug,
      normalized.title,
      normalized.lead,
      normalized.excerpt,
      normalized.status,
      normalized.publishedAt,
      normalized.isPinned,
      normalized.category,
      normalized.tags,
      JSON.stringify(normalized.cover),
      JSON.stringify(normalized.blocks),
      JSON.stringify(normalized.faq),
      JSON.stringify(normalized.cta),
      JSON.stringify(normalized.seoOverride),
      normalized.archivedAt,
      userId,
    ],
  );

  const updated = await findNewsById(id);
  if (!updated) {
    throw new Error("Не удалось загрузить обновленную новость");
  }

  invalidateNewsCache();
  return updated;
}

export async function patchNewsStatus(id: string, patch: NewsStatusPatchRequest, userId: string | null): Promise<NewsPost> {
  requireDbForWrites();
  await ensureDatabaseReady();

  const existing = await findNewsById(id);
  if (!existing) {
    throw new Error("Новость не найдена");
  }

  const updated = await updateNewsPost(
    id,
    {
      status: patch.status,
      publishedAt: patch.publishedAt !== undefined ? patch.publishedAt : existing.publishedAt,
    },
    userId,
  );

  return updated;
}

export async function deleteNewsPost(id: string): Promise<void> {
  requireDbForWrites();
  await ensureDatabaseReady();
  await dbQuery(`DELETE FROM news_posts WHERE id = $1`, [id]);
  invalidateNewsCache();
}

export async function listNewsFacets(onlyPublished: boolean): Promise<NewsFacets> {
  if (!isDatabaseConfigured()) {
    return { categories: [], tags: [] };
  }

  try {
    await ensureDatabaseReady();

    const filter = onlyPublished
      ? `
        WHERE c.status IN ('published', 'scheduled')
        AND c.published_at IS NOT NULL
        AND c.published_at <= NOW()
        AND c.archived_at IS NULL
        AND c.status <> 'archived'
      `
      : "WHERE c.archived_at IS NULL";

    const categoriesRes = await dbQuery<{ category: string }>(
      `
        SELECT DISTINCT c.category
        FROM news_posts c
        ${filter}
        AND c.category <> ''
        ORDER BY c.category ASC
      `,
    );

    const tagsRes = await dbQuery<{ tag: string }>(
      `
        SELECT DISTINCT unnest(c.tags) AS tag
        FROM news_posts c
        ${filter}
        ORDER BY tag ASC
      `,
    );

    return {
      categories: categoriesRes.rows.map((row) => row.category).filter(Boolean),
      tags: tagsRes.rows.map((row) => row.tag).filter(Boolean),
    };
  } catch (error) {
    if (isRecoverableDbReadError(error)) {
      logReadFallback("listNewsFacets", error);
      return { categories: [], tags: [] };
    }

    throw error;
  }
}

export async function listRelatedNews(slug: string, category: string, limit = 3): Promise<NewsPost[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  try {
    await ensureDatabaseReady();

    const values: unknown[] = [slug.trim().toLowerCase(), Math.max(1, Math.min(12, limit))];
    const categoryCondition = category ? `AND c.category = $3` : "";
    if (category) {
      values.push(category);
    }

    const result = await dbQuery<NewsPostRow>(
      `
        SELECT
          c.id,
          c.slug,
          c.title,
          c.lead,
          c.excerpt,
          c.status,
          c.published_at,
          c.is_pinned,
          c.category,
          c.tags,
          c.cover,
          c.blocks,
          c.faq,
          c.cta,
          c.seo_override,
          c.created_at,
          c.updated_at,
          c.archived_at
        FROM news_posts c
        WHERE LOWER(c.slug) <> $1
          AND c.status IN ('published', 'scheduled')
          AND c.published_at IS NOT NULL
          AND c.published_at <= NOW()
          AND c.archived_at IS NULL
          AND c.status <> 'archived'
          ${categoryCondition}
        ORDER BY c.is_pinned DESC, COALESCE(c.published_at, c.created_at) DESC
        LIMIT $2
      `,
      values,
    );

    return result.rows.map(rowToNewsPost);
  } catch (error) {
    if (isRecoverableDbReadError(error)) {
      logReadFallback("listRelatedNews", error);
      return [];
    }

    throw error;
  }
}

export async function listNewsForSitemap(): Promise<Array<{ slug: string; updatedAt: string }>> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  try {
    await ensureDatabaseReady();

    const result = await dbQuery<{ slug: string; updated_at: string }>(
      `
        SELECT c.slug, c.updated_at
        FROM news_posts c
        WHERE c.status IN ('published', 'scheduled')
          AND c.published_at IS NOT NULL
          AND c.published_at <= NOW()
          AND c.archived_at IS NULL
          AND c.status <> 'archived'
        ORDER BY c.updated_at DESC
      `,
    );

    return result.rows.map((row) => ({ slug: row.slug, updatedAt: row.updated_at }));
  } catch (error) {
    if (isRecoverableDbReadError(error)) {
      logReadFallback("listNewsForSitemap", error);
      return [];
    }

    throw error;
  }
}
