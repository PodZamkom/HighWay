import "server-only";

import { listNewsForSitemap } from "@/lib/newsRepository";
import {
  getPublicNewsBySlug as getCachedNewsBySlug,
  getPublicNewsFacets as getCachedNewsFacets,
  getPublicNewsList as getCachedNewsList,
  getPublicNewsSettings as getCachedNewsSettings,
  getPublicRelatedNews as getCachedRelatedNews,
} from "@/lib/publicSiteService";

export { listNewsForSitemap };

export async function getPublicNewsSettings() {
  return getCachedNewsSettings();
}

export async function getPublicNewsList(
  page: number,
  pageSize: number,
  search?: string,
  category?: string,
  tag?: string,
) {
  return getCachedNewsList(page, pageSize, search, category, tag);
}

export async function getPublicNewsBySlug(slug: string) {
  return getCachedNewsBySlug(slug);
}

export async function getPublicNewsFacets() {
  return getCachedNewsFacets();
}

export async function getPublicRelatedNews(slug: string, category: string, limit = 3) {
  return getCachedRelatedNews(slug, category, limit);
}
