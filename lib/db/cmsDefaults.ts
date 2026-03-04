import siteContentJson from "@/data/site.json";
import contentPagesJson from "@/data/content-pages.json";
import type { ContentPage, ContentPageSlug } from "@/types/content-pages";
import type { CmsDocumentKey, CmsSnapshot, HomeBlockKey } from "@/types/cms";
import {
  cmsCatalogDetailSeoTemplateSchema,
  cmsCatalogLabelsSchema,
  cmsCatalogListSeoSchema,
  cmsContentPageSchema,
  cmsFooterSchema,
  cmsGlobalSeoSchema,
  cmsHomeContentSchema,
  cmsHomeLayoutSchema,
  cmsNavigationSchema,
} from "@/lib/schemas/cms";

const HOME_BLOCKS: HomeBlockKey[] = ["hero", "promo", "market", "calculator", "team"];
const PAGE_SLUGS: ContentPageSlug[] = ["o-kompanii", "uslugi", "servisy", "poleznoe", "kontakty"];

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function readPagesFromJson(): Record<ContentPageSlug, ContentPage> {
  const raw = contentPagesJson as Record<string, unknown>;
  const result = {} as Record<ContentPageSlug, ContentPage>;

  for (const slug of PAGE_SLUGS) {
    const parsed = cmsContentPageSchema.parse(raw[slug]);
    result[slug] = parsed;
  }

  return result;
}

function normalizeHomeContentInput(raw: Record<string, unknown>) {
  const clone = deepClone(raw);
  const calculator = (clone.calculator ?? {}) as Record<string, unknown>;
  const form = (calculator.form ?? {}) as Record<string, unknown>;
  const options = (form.options ?? {}) as Record<string, unknown>;
  const platformDefault = (options.platformDefault ?? {}) as Record<string, unknown>;

  const key = typeof platformDefault.key === "string" ? platformDefault.key.trim() : "";
  const name = typeof platformDefault.name === "string" ? platformDefault.name.trim() : "";

  options.platformDefault = {
    ...platformDefault,
    key: key || "default",
    name: name || "Выберите площадку",
  };
  form.options = options;
  calculator.form = form;
  clone.calculator = calculator;

  return clone;
}

function buildSnapshot(): CmsSnapshot {
  const siteContent = normalizeHomeContentInput(siteContentJson as Record<string, unknown>);

  const homeLayout = cmsHomeLayoutSchema.parse({
    blocks: HOME_BLOCKS.map((key) => ({ key, enabled: true })),
  });

  const homeContent = cmsHomeContentSchema.parse({
    hero: siteContent.hero,
    promoBanners: siteContent.promoBanners,
    marketSection: siteContent.marketSection,
    calculator: siteContent.calculator,
    teamSection: siteContent.teamSection,
  });

  const navigation = cmsNavigationSchema.parse(siteContent.navbar);
  const footer = cmsFooterSchema.parse(siteContent.footer);
  const globalSeo = cmsGlobalSeoSchema.parse(siteContent.seo);
  const catalogLabels = cmsCatalogLabelsSchema.parse({
    catalogSection: siteContent.catalogSection,
    carDetail: siteContent.carDetail,
  });

  const catalogListSeo = cmsCatalogListSeoSchema.parse({
    title: `${globalSeo.title} | Каталог`,
    description: globalSeo.description,
    canonical: "/catalog",
    ogImage: globalSeo.ogImage,
    keywords: globalSeo.keywords,
    schemaName: "Каталог автомобилей",
    schemaDescription: "Актуальный каталог автомобилей с фильтрами по рынкам и параметрам.",
  });

  const catalogDetailSeoTemplate = cmsCatalogDetailSeoTemplateSchema.parse({
    titleTemplate: "{brand} {model} {year} | Каталог",
    descriptionTemplate: "{brand} {model} {year}. Цена: {price}. {description}",
    canonicalTemplate: "/catalog/{id}",
    ogImage: globalSeo.ogImage,
    schemaTemplate: "{brand} {model} {year}",
    robots: "index,follow",
  });

  const pages = readPagesFromJson();

  return {
    homeLayout,
    homeContent,
    navigation,
    footer,
    globalSeo,
    catalogListSeo,
    catalogDetailSeoTemplate,
    catalogLabels,
    pages,
  };
}

function snapshotToDocuments(snapshot: CmsSnapshot): Record<CmsDocumentKey, unknown> {
  return {
    home_layout: snapshot.homeLayout,
    home_content: snapshot.homeContent,
    navigation: snapshot.navigation,
    footer: snapshot.footer,
    "seo:global": snapshot.globalSeo,
    "seo:catalog-list": snapshot.catalogListSeo,
    "seo:catalog-detail-template": snapshot.catalogDetailSeoTemplate,
    "catalog:labels": snapshot.catalogLabels,
    "page:o-kompanii": snapshot.pages["o-kompanii"],
    "page:uslugi": snapshot.pages.uslugi,
    "page:servisy": snapshot.pages.servisy,
    "page:poleznoe": snapshot.pages.poleznoe,
    "page:kontakty": snapshot.pages.kontakty,
  };
}

export async function exportCmsSnapshot(): Promise<CmsSnapshot> {
  return deepClone(buildSnapshot());
}

export async function buildCmsDefaults(): Promise<Record<CmsDocumentKey, unknown>> {
  const snapshot = await exportCmsSnapshot();
  return snapshotToDocuments(snapshot);
}
