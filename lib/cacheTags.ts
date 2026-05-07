export const CONTENT_REVALIDATE_SECONDS = Number.parseInt(process.env.CONTENT_REVALIDATE_SEC || "300", 10) || 300;

export const CACHE_TAGS = {
  siteContent: "site-content",
  homeLayout: "home-layout",
  contentPages: "content-pages",
  news: "news",
  newsSettings: "news-settings",
  catalog: "catalog",
  catalogSeo: "catalog-seo",
  globalSeo: "global-seo",
  analytics: "analytics-counters",
} as const;

export const SITE_CONTENT_TAGS = [
  CACHE_TAGS.siteContent,
  CACHE_TAGS.globalSeo,
  CACHE_TAGS.catalogSeo,
] as const;
