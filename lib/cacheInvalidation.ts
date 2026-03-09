import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";
import { CACHE_TAGS, SITE_CONTENT_TAGS } from "@/lib/cacheTags";

function safeRevalidateTag(tag: string) {
  try {
    revalidateTag(tag, "max");
  } catch (error) {
    console.error(`[cacheInvalidation] failed to revalidate tag ${tag}:`, error);
  }
}

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch (error) {
    console.error(`[cacheInvalidation] failed to revalidate path ${path}:`, error);
  }
}

export function invalidateSiteContentCache() {
  for (const tag of SITE_CONTENT_TAGS) {
    safeRevalidateTag(tag);
  }

  safeRevalidateTag(CACHE_TAGS.homeLayout);
  safeRevalidateTag(CACHE_TAGS.contentPages);
  safeRevalidatePath("/");
}

export function invalidateContentPagesCache() {
  safeRevalidateTag(CACHE_TAGS.contentPages);
  safeRevalidateTag(CACHE_TAGS.globalSeo);
  safeRevalidatePath("/o-kompanii");
  safeRevalidatePath("/uslugi");
  safeRevalidatePath("/servisy");
  safeRevalidatePath("/kontakty");
}

export function invalidateNewsCache() {
  safeRevalidateTag(CACHE_TAGS.news);
  safeRevalidateTag(CACHE_TAGS.newsSettings);
  safeRevalidatePath("/novosti");
  safeRevalidatePath("/sitemap.xml");
}

export function invalidateCatalogCache() {
  safeRevalidateTag(CACHE_TAGS.catalog);
  safeRevalidateTag(CACHE_TAGS.catalogSeo);
  safeRevalidatePath("/catalog");
  safeRevalidatePath("/sitemap.xml");
}

export function invalidateCatalogSeoCache() {
  safeRevalidateTag(CACHE_TAGS.catalogSeo);
  safeRevalidatePath("/catalog");
}

export function invalidateGlobalSeoCache() {
  safeRevalidateTag(CACHE_TAGS.globalSeo);
  safeRevalidatePath("/");
}
