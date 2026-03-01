import fs from "fs/promises";
import path from "path";
import type {
  AdminContentPagesUpdateRequest,
  ContentPageSlug,
  ContentPagesMap,
} from "@/types/content-pages";
import type { SeoContent, SiteContent } from "@/types/site";
import { getSiteContentFilePath, readSiteContent } from "@/lib/siteContentStore";

const CONTENT_PAGES_FILE = path.join(process.cwd(), "data", "content-pages.json");
const SITE_CONTENT_FILE = getSiteContentFilePath();
const PAGE_SLUGS: ContentPageSlug[] = ["o-kompanii", "uslugi", "servisy", "poleznoe", "kontakty"];

type ValidationResult<T> = { ok: true; value: T } | { ok: false; errors: string[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pushError(errors: string[], pathKey: string, message: string) {
  errors.push(`${pathKey}: ${message}`);
}

function validateRequiredString(value: unknown, pathKey: string, errors: string[], allowEmpty = false) {
  if (typeof value !== "string") {
    pushError(errors, pathKey, "должно быть строкой");
    return;
  }
  if (!allowEmpty && value.trim().length === 0) {
    pushError(errors, pathKey, "обязательное поле не может быть пустым");
  }
}

function validateOptionalString(value: unknown, pathKey: string, errors: string[]) {
  if (value === undefined) return;
  if (typeof value !== "string") {
    pushError(errors, pathKey, "должно быть строкой");
  }
}

function validateLink(value: unknown, pathKey: string, errors: string[], required: boolean) {
  if (value === undefined) {
    if (required) pushError(errors, pathKey, "обязательный объект ссылки отсутствует");
    return;
  }
  if (!isRecord(value)) {
    pushError(errors, pathKey, "должен быть объектом");
    return;
  }
  validateRequiredString(value.label, `${pathKey}.label`, errors);
  validateRequiredString(value.href, `${pathKey}.href`, errors);
}

function validateStringArray(value: unknown, pathKey: string, errors: string[], required = true) {
  if (value === undefined) {
    if (required) pushError(errors, pathKey, "обязательный список отсутствует");
    return;
  }
  if (!Array.isArray(value)) {
    pushError(errors, pathKey, "должен быть массивом");
    return;
  }
  if (required && value.length === 0) {
    pushError(errors, pathKey, "должен содержать минимум 1 элемент");
  }
  value.forEach((item, index) => validateRequiredString(item, `${pathKey}[${index}]`, errors));
}

function validateMetricsSection(value: unknown, pathKey: string, errors: string[]) {
  if (value === undefined) return;
  if (!isRecord(value)) {
    pushError(errors, pathKey, "должен быть объектом");
    return;
  }
  validateRequiredString(value.title, `${pathKey}.title`, errors);
  validateOptionalString(value.description, `${pathKey}.description`, errors);

  if (!Array.isArray(value.items)) {
    pushError(errors, `${pathKey}.items`, "должен быть массивом");
    return;
  }
  if (value.items.length === 0) {
    pushError(errors, `${pathKey}.items`, "должен содержать минимум 1 элемент");
  }
  value.items.forEach((item, index) => {
    const itemPath = `${pathKey}.items[${index}]`;
    if (!isRecord(item)) {
      pushError(errors, itemPath, "должен быть объектом");
      return;
    }
    validateRequiredString(item.label, `${itemPath}.label`, errors);
    validateRequiredString(item.value, `${itemPath}.value`, errors);
    validateOptionalString(item.note, `${itemPath}.note`, errors);
  });
}

function validateBulletSections(value: unknown, pathKey: string, errors: string[]) {
  if (value === undefined) return;
  if (!Array.isArray(value)) {
    pushError(errors, pathKey, "должен быть массивом");
    return;
  }

  value.forEach((section, index) => {
    const sectionPath = `${pathKey}[${index}]`;
    if (!isRecord(section)) {
      pushError(errors, sectionPath, "должен быть объектом");
      return;
    }
    validateRequiredString(section.id, `${sectionPath}.id`, errors);
    validateRequiredString(section.title, `${sectionPath}.title`, errors);
    validateOptionalString(section.description, `${sectionPath}.description`, errors);
    validateStringArray(section.items, `${sectionPath}.items`, errors, true);
  });
}

function validateStepsSections(value: unknown, pathKey: string, errors: string[]) {
  if (value === undefined) return;
  if (!Array.isArray(value)) {
    pushError(errors, pathKey, "должен быть массивом");
    return;
  }

  value.forEach((section, index) => {
    const sectionPath = `${pathKey}[${index}]`;
    if (!isRecord(section)) {
      pushError(errors, sectionPath, "должен быть объектом");
      return;
    }
    validateRequiredString(section.id, `${sectionPath}.id`, errors);
    validateRequiredString(section.title, `${sectionPath}.title`, errors);
    validateOptionalString(section.description, `${sectionPath}.description`, errors);

    if (!Array.isArray(section.items)) {
      pushError(errors, `${sectionPath}.items`, "должен быть массивом");
      return;
    }
    if (section.items.length === 0) {
      pushError(errors, `${sectionPath}.items`, "должен содержать минимум 1 элемент");
    }

    section.items.forEach((item, itemIndex) => {
      const itemPath = `${sectionPath}.items[${itemIndex}]`;
      if (!isRecord(item)) {
        pushError(errors, itemPath, "должен быть объектом");
        return;
      }
      validateRequiredString(item.title, `${itemPath}.title`, errors);
      validateRequiredString(item.description, `${itemPath}.description`, errors);
    });
  });
}

function validateCasesSection(value: unknown, pathKey: string, errors: string[]) {
  if (value === undefined) return;
  if (!isRecord(value)) {
    pushError(errors, pathKey, "должен быть объектом");
    return;
  }
  validateRequiredString(value.id, `${pathKey}.id`, errors);
  validateRequiredString(value.title, `${pathKey}.title`, errors);
  validateOptionalString(value.description, `${pathKey}.description`, errors);

  if (!Array.isArray(value.items)) {
    pushError(errors, `${pathKey}.items`, "должен быть массивом");
    return;
  }
  if (value.items.length === 0) {
    pushError(errors, `${pathKey}.items`, "должен содержать минимум 1 элемент");
  }

  value.items.forEach((item, index) => {
    const itemPath = `${pathKey}.items[${index}]`;
    if (!isRecord(item)) {
      pushError(errors, itemPath, "должен быть объектом");
      return;
    }
    validateRequiredString(item.title, `${itemPath}.title`, errors);
    validateRequiredString(item.description, `${itemPath}.description`, errors);
    validateOptionalString(item.meta, `${itemPath}.meta`, errors);
  });
}

function validateFaqSection(value: unknown, pathKey: string, errors: string[]) {
  if (value === undefined) return;
  if (!isRecord(value)) {
    pushError(errors, pathKey, "должен быть объектом");
    return;
  }
  validateRequiredString(value.id, `${pathKey}.id`, errors);
  validateRequiredString(value.title, `${pathKey}.title`, errors);
  validateOptionalString(value.description, `${pathKey}.description`, errors);

  if (!Array.isArray(value.items)) {
    pushError(errors, `${pathKey}.items`, "должен быть массивом");
    return;
  }
  if (value.items.length === 0) {
    pushError(errors, `${pathKey}.items`, "должен содержать минимум 1 элемент");
  }

  value.items.forEach((item, index) => {
    const itemPath = `${pathKey}.items[${index}]`;
    if (!isRecord(item)) {
      pushError(errors, itemPath, "должен быть объектом");
      return;
    }
    validateRequiredString(item.question, `${itemPath}.question`, errors);
    validateRequiredString(item.answer, `${itemPath}.answer`, errors);
  });
}

function validateContactItemsArray(value: unknown, pathKey: string, errors: string[]) {
  if (!Array.isArray(value)) {
    pushError(errors, pathKey, "должен быть массивом");
    return;
  }
  if (value.length === 0) {
    pushError(errors, pathKey, "должен содержать минимум 1 элемент");
  }
  value.forEach((item, index) => {
    const itemPath = `${pathKey}[${index}]`;
    if (!isRecord(item)) {
      pushError(errors, itemPath, "должен быть объектом");
      return;
    }
    validateRequiredString(item.label, `${itemPath}.label`, errors);
    validateRequiredString(item.value, `${itemPath}.value`, errors);
    validateOptionalString(item.href, `${itemPath}.href`, errors);
    validateOptionalString(item.note, `${itemPath}.note`, errors);
  });
}

function validateContactsSection(value: unknown, pathKey: string, errors: string[]) {
  if (value === undefined) return;
  if (!isRecord(value)) {
    pushError(errors, pathKey, "должен быть объектом");
    return;
  }
  validateRequiredString(value.id, `${pathKey}.id`, errors);
  validateRequiredString(value.title, `${pathKey}.title`, errors);
  validateOptionalString(value.description, `${pathKey}.description`, errors);
  validateContactItemsArray(value.methods, `${pathKey}.methods`, errors);

  if (value.links !== undefined) {
    if (!Array.isArray(value.links)) {
      pushError(errors, `${pathKey}.links`, "должен быть массивом");
    } else {
      value.links.forEach((item, index) => {
        const itemPath = `${pathKey}.links[${index}]`;
        if (!isRecord(item)) {
          pushError(errors, itemPath, "должен быть объектом");
          return;
        }
        validateRequiredString(item.label, `${itemPath}.label`, errors);
        validateRequiredString(item.value, `${itemPath}.value`, errors);
        validateOptionalString(item.href, `${itemPath}.href`, errors);
        validateOptionalString(item.note, `${itemPath}.note`, errors);
      });
    }
  }

  if (value.offices !== undefined) {
    if (!Array.isArray(value.offices)) {
      pushError(errors, `${pathKey}.offices`, "должен быть массивом");
    } else {
      value.offices.forEach((office, index) => {
        const officePath = `${pathKey}.offices[${index}]`;
        if (!isRecord(office)) {
          pushError(errors, officePath, "должен быть объектом");
          return;
        }
        validateRequiredString(office.city, `${officePath}.city`, errors);
        validateRequiredString(office.address, `${officePath}.address`, errors);
      });
    }
  }
}

function validatePageSeo(value: unknown, pathKey: string, errors: string[]) {
  if (!isRecord(value)) {
    pushError(errors, pathKey, "должен быть объектом");
    return;
  }
  validateRequiredString(value.title, `${pathKey}.title`, errors);
  validateRequiredString(value.description, `${pathKey}.description`, errors);
}

function validatePageHero(value: unknown, pathKey: string, errors: string[]) {
  if (!isRecord(value)) {
    pushError(errors, pathKey, "должен быть объектом");
    return;
  }
  validateRequiredString(value.eyebrow, `${pathKey}.eyebrow`, errors);
  validateRequiredString(value.title, `${pathKey}.title`, errors);
  validateOptionalString(value.subtitle, `${pathKey}.subtitle`, errors);
  validateRequiredString(value.description, `${pathKey}.description`, errors);

  if (value.tags !== undefined) {
    validateStringArray(value.tags, `${pathKey}.tags`, errors, false);
  }

  validateLink(value.primaryCta, `${pathKey}.primaryCta`, errors, true);
  validateLink(value.secondaryCta, `${pathKey}.secondaryCta`, errors, false);
}

function validatePageCta(value: unknown, pathKey: string, errors: string[]) {
  if (!isRecord(value)) {
    pushError(errors, pathKey, "должен быть объектом");
    return;
  }
  validateRequiredString(value.title, `${pathKey}.title`, errors);
  validateRequiredString(value.description, `${pathKey}.description`, errors);
  validateLink(value.primary, `${pathKey}.primary`, errors, true);
  validateLink(value.secondary, `${pathKey}.secondary`, errors, false);
}

function validateContentPage(value: unknown, slug: ContentPageSlug, pathKey: string, errors: string[]) {
  if (!isRecord(value)) {
    pushError(errors, pathKey, "должен быть объектом");
    return;
  }
  validateRequiredString(value.slug, `${pathKey}.slug`, errors);
  if (value.slug !== undefined && value.slug !== slug) {
    pushError(errors, `${pathKey}.slug`, `должен быть равен "${slug}"`);
  }

  validatePageSeo(value.seo, `${pathKey}.seo`, errors);
  validatePageHero(value.hero, `${pathKey}.hero`, errors);
  validateRequiredString(value.sourceNote, `${pathKey}.sourceNote`, errors);
  validateMetricsSection(value.metricsSection, `${pathKey}.metricsSection`, errors);
  validateBulletSections(value.bulletSections, `${pathKey}.bulletSections`, errors);
  validateStepsSections(value.stepsSections, `${pathKey}.stepsSections`, errors);
  validateCasesSection(value.casesSection, `${pathKey}.casesSection`, errors);
  validateFaqSection(value.faqSection, `${pathKey}.faqSection`, errors);
  validateContactsSection(value.contactsSection, `${pathKey}.contactsSection`, errors);
  validatePageCta(value.cta, `${pathKey}.cta`, errors);
}

function validateContentPagesMap(pages: unknown): ValidationResult<ContentPagesMap> {
  const errors: string[] = [];
  if (!isRecord(pages)) {
    pushError(errors, "pages", "должен быть объектом");
    return { ok: false, errors };
  }

  PAGE_SLUGS.forEach((slug) => {
    if (!(slug in pages)) {
      pushError(errors, `pages.${slug}`, "обязательная страница отсутствует");
      return;
    }
    validateContentPage(pages[slug], slug, `pages.${slug}`, errors);
  });

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: pages as ContentPagesMap };
}

function validateGlobalSeo(globalSeo: unknown): ValidationResult<SeoContent> {
  const errors: string[] = [];
  if (!isRecord(globalSeo)) {
    pushError(errors, "globalSeo", "должен быть объектом");
    return { ok: false, errors };
  }
  validateRequiredString(globalSeo.title, "globalSeo.title", errors);
  validateRequiredString(globalSeo.description, "globalSeo.description", errors);
  validateRequiredString(globalSeo.keywords, "globalSeo.keywords", errors);
  validateRequiredString(globalSeo.ogImage, "globalSeo.ogImage", errors);
  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      title: String(globalSeo.title),
      description: String(globalSeo.description),
      keywords: String(globalSeo.keywords),
      ogImage: String(globalSeo.ogImage),
    },
  };
}

export function validateContentPagesUpdateRequest(payload: unknown): ValidationResult<AdminContentPagesUpdateRequest> {
  if (!isRecord(payload)) {
    return { ok: false, errors: ["payload: должен быть объектом"] };
  }

  const pagesValidation = validateContentPagesMap(payload.pages);
  if (pagesValidation.ok === false) {
    return { ok: false, errors: pagesValidation.errors };
  }

  const seoValidation = validateGlobalSeo(payload.globalSeo);
  if (seoValidation.ok === false) {
    return { ok: false, errors: seoValidation.errors };
  }

  return {
    ok: true,
    value: {
      pages: pagesValidation.value,
      globalSeo: seoValidation.value,
    },
  };
}

async function atomicWrite(filePath: string, content: string) {
  const dirPath = path.dirname(filePath);
  const tmpPath = path.join(
    dirPath,
    `${path.basename(filePath)}.${Date.now()}.${Math.random().toString(16).slice(2)}.tmp`,
  );
  await fs.writeFile(tmpPath, content, "utf-8");
  await fs.rename(tmpPath, filePath);
}

export async function readContentPages(): Promise<ContentPagesMap> {
  const raw = await fs.readFile(CONTENT_PAGES_FILE, "utf-8");
  const parsed = JSON.parse(raw) as unknown;
  const validation = validateContentPagesMap(parsed);
  if (validation.ok === false) {
    throw new Error(`Invalid content-pages.json: ${validation.errors.join("; ")}`);
  }
  return validation.value;
}

export async function writeContentPages(pages: ContentPagesMap): Promise<void> {
  const validation = validateContentPagesMap(pages);
  if (validation.ok === false) {
    throw new Error(`Validation failed: ${validation.errors.join("; ")}`);
  }
  await atomicWrite(CONTENT_PAGES_FILE, `${JSON.stringify(validation.value, null, 2)}\n`);
}

export async function readSiteSeo(): Promise<SeoContent> {
  const siteContent = await readSiteContent();
  return siteContent.seo;
}

export async function writeSiteSeo(nextSeo: SeoContent): Promise<void> {
  const validation = validateGlobalSeo(nextSeo);
  if (validation.ok === false) {
    throw new Error(`Validation failed: ${validation.errors.join("; ")}`);
  }
  const currentSite = await readSiteContent();
  const nextSite: SiteContent = {
    ...currentSite,
    seo: validation.value,
  };
  await atomicWrite(SITE_CONTENT_FILE, `${JSON.stringify(nextSite, null, 2)}\n`);
}

export async function writeContentPagesAndSeo(pages: ContentPagesMap, globalSeo: SeoContent): Promise<void> {
  const payloadValidation = validateContentPagesUpdateRequest({ pages, globalSeo });
  if (payloadValidation.ok === false) {
    throw new Error(`Validation failed: ${payloadValidation.errors.join("; ")}`);
  }

  const previousPagesRaw = await fs.readFile(CONTENT_PAGES_FILE, "utf-8");
  const previousSiteRaw = await fs.readFile(SITE_CONTENT_FILE, "utf-8");

  try {
    const siteContent = JSON.parse(previousSiteRaw) as SiteContent;
    const nextSiteContent: SiteContent = {
      ...siteContent,
      seo: payloadValidation.value.globalSeo,
    };

    await atomicWrite(CONTENT_PAGES_FILE, `${JSON.stringify(payloadValidation.value.pages, null, 2)}\n`);
    await atomicWrite(SITE_CONTENT_FILE, `${JSON.stringify(nextSiteContent, null, 2)}\n`);
  } catch (error) {
    try {
      await atomicWrite(CONTENT_PAGES_FILE, previousPagesRaw);
      await atomicWrite(SITE_CONTENT_FILE, previousSiteRaw);
    } catch (rollbackError) {
      console.error("Rollback after content pages write failure failed:", rollbackError);
    }
    throw error;
  }
}

export function getContentPagesFilePath() {
  return CONTENT_PAGES_FILE;
}
