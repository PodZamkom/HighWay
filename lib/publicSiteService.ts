import "server-only";

import { unstable_cache } from "next/cache";
import type { SiteContent } from "@/types/site";
import { CACHE_TAGS, CONTENT_REVALIDATE_SECONDS, SITE_CONTENT_TAGS } from "@/lib/cacheTags";
import {
  readAnalyticsCounters,
  readCatalogDetailSeoTemplate,
  readCatalogLabels,
  readCatalogListSeo,
  readContentPage,
  readGlobalSeo,
  readHomeContent,
  readHomeLayout,
  readNavigation,
  readNewsSettings,
  readFooter,
} from "@/lib/cmsRepository";
import { findCatalogCarByIdOrSlug, listCatalogCarsLegacy } from "@/lib/catalogRepository";
import { findNewsBySlug, listNews, listNewsFacets, listRelatedNews } from "@/lib/newsRepository";
import type { ContentPageSlug } from "@/types/content-pages";
import type { NewsListResult, NewsPost } from "@/types/news";

const getSiteContentCached = unstable_cache(
  async (): Promise<SiteContent> => {
    const [homeContent, navigation, footer, globalSeo, catalogLabels] = await Promise.all([
      readHomeContent(),
      readNavigation(),
      readFooter(),
      readGlobalSeo(),
      readCatalogLabels(),
    ]);

    return {
      seo: globalSeo,
      navbar: navigation,
      hero: homeContent.hero,
      promoBanners: homeContent.promoBanners,
      calculator: homeContent.calculator,
      marketSection: homeContent.marketSection,
      teamSection: homeContent.teamSection,
      catalogSection: catalogLabels.catalogSection,
      carDetail: catalogLabels.carDetail,
      footer,
    };
  },
  ["public-site-content"],
  {
    revalidate: CONTENT_REVALIDATE_SECONDS,
    tags: [...SITE_CONTENT_TAGS],
  },
);

const getHomeLayoutCached = unstable_cache(
  async () => readHomeLayout(),
  ["public-home-layout"],
  {
    revalidate: CONTENT_REVALIDATE_SECONDS,
    tags: [CACHE_TAGS.homeLayout],
  },
);

const getGlobalSeoCached = unstable_cache(
  async () => readGlobalSeo(),
  ["public-global-seo"],
  {
    revalidate: CONTENT_REVALIDATE_SECONDS,
    tags: [CACHE_TAGS.globalSeo],
  },
);

const getCatalogListSeoCached = unstable_cache(
  async () => readCatalogListSeo(),
  ["public-catalog-list-seo"],
  {
    revalidate: CONTENT_REVALIDATE_SECONDS,
    tags: [CACHE_TAGS.catalogSeo],
  },
);

const getCatalogDetailSeoTemplateCached = unstable_cache(
  async () => readCatalogDetailSeoTemplate(),
  ["public-catalog-detail-seo-template"],
  {
    revalidate: CONTENT_REVALIDATE_SECONDS,
    tags: [CACHE_TAGS.catalogSeo],
  },
);

const getNewsSettingsCached = unstable_cache(
  async () => readNewsSettings(),
  ["public-news-settings"],
  {
    revalidate: CONTENT_REVALIDATE_SECONDS,
    tags: [CACHE_TAGS.newsSettings],
  },
);

const getContentPageCached = unstable_cache(
  async (slug: ContentPageSlug) => readContentPage(slug),
  ["public-content-page"],
  {
    revalidate: CONTENT_REVALIDATE_SECONDS,
    tags: [CACHE_TAGS.contentPages, CACHE_TAGS.globalSeo],
  },
);

const getCatalogCarsCached = unstable_cache(
  async () => listCatalogCarsLegacy({ page: 1, pageSize: 5000 }),
  ["public-catalog-list"],
  {
    revalidate: CONTENT_REVALIDATE_SECONDS,
    tags: [CACHE_TAGS.catalog],
  },
);

const getCatalogCarCached = unstable_cache(
  async (idOrSlug: string) => findCatalogCarByIdOrSlug(idOrSlug),
  ["public-catalog-detail"],
  {
    revalidate: CONTENT_REVALIDATE_SECONDS,
    tags: [CACHE_TAGS.catalog],
  },
);

const getNewsListCached = unstable_cache(
  async (
    page: number,
    pageSize: number,
    search?: string,
    category?: string,
    tag?: string,
  ): Promise<NewsListResult> =>
    listNews({
      page,
      pageSize,
      search,
      category,
      tag,
      onlyPublished: true,
      includeArchived: false,
    }),
  ["public-news-list"],
  {
    revalidate: CONTENT_REVALIDATE_SECONDS,
    tags: [CACHE_TAGS.news, CACHE_TAGS.newsSettings],
  },
);

const getNewsBySlugCached = unstable_cache(
  async (slug: string): Promise<NewsPost | null> => findNewsBySlug(slug, true),
  ["public-news-detail"],
  {
    revalidate: CONTENT_REVALIDATE_SECONDS,
    tags: [CACHE_TAGS.news, CACHE_TAGS.newsSettings],
  },
);

const getNewsFacetsCached = unstable_cache(
  async () => listNewsFacets(true),
  ["public-news-facets"],
  {
    revalidate: CONTENT_REVALIDATE_SECONDS,
    tags: [CACHE_TAGS.news],
  },
);

const getRelatedNewsCached = unstable_cache(
  async (slug: string, category: string, limit: number) => listRelatedNews(slug, category, limit),
  ["public-related-news"],
  {
    revalidate: CONTENT_REVALIDATE_SECONDS,
    tags: [CACHE_TAGS.news],
  },
);

export async function getSiteContent(): Promise<SiteContent> {
  return getSiteContentCached();
}

export async function getPublicHomeLayout() {
  return getHomeLayoutCached();
}

export async function getPublicGlobalSeo() {
  return getGlobalSeoCached();
}

export async function getPublicCatalogListSeo() {
  return getCatalogListSeoCached();
}

export async function getPublicCatalogDetailSeoTemplate() {
  return getCatalogDetailSeoTemplateCached();
}

export async function getPublicNewsSettings() {
  return getNewsSettingsCached();
}

export async function getPublicContentPage(slug: ContentPageSlug) {
  return getContentPageCached(slug);
}

export async function getPublicCatalogCars() {
  return getCatalogCarsCached();
}

export async function getPublicCatalogCar(idOrSlug: string) {
  return getCatalogCarCached(idOrSlug);
}

export async function getPublicNewsList(
  page: number,
  pageSize: number,
  search?: string,
  category?: string,
  tag?: string,
) {
  return getNewsListCached(page, pageSize, search, category, tag);
}

export async function getPublicNewsBySlug(slug: string) {
  return getNewsBySlugCached(slug);
}

export async function getPublicNewsFacets() {
  return getNewsFacetsCached();
}

export async function getPublicRelatedNews(slug: string, category: string, limit = 3) {
  return getRelatedNewsCached(slug, category, limit);
}

const getAnalyticsCountersCached = unstable_cache(
  async () => readAnalyticsCounters(),
  ["public-analytics-counters"],
  {
    revalidate: CONTENT_REVALIDATE_SECONDS,
    tags: [CACHE_TAGS.analytics],
  },
);

export async function getPublicAnalyticsCounters() {
  return getAnalyticsCountersCached();
}
