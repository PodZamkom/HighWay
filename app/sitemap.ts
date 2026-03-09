import type { MetadataRoute } from "next";
import { resolveSiteUrl } from "@/lib/breadcrumbs";
import { listCatalogCarsLegacy } from "@/lib/catalog/catalogPublicReadService";
import { listNewsForSitemap } from "@/lib/news/newsPublicReadService";

const CONTENT_ROUTES = [
  "/",
  "/o-kompanii",
  "/uslugi",
  "/servisy",
  "/novosti",
  "/kontakty",
  "/calculator",
  "/catalog",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = resolveSiteUrl();
  const now = new Date();

  const baseItems: MetadataRoute.Sitemap = CONTENT_ROUTES.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1 : route === "/catalog" ? 0.9 : 0.8,
  }));

  let cars = [] as Awaited<ReturnType<typeof listCatalogCarsLegacy>>;
  try {
    cars = await listCatalogCarsLegacy({ page: 1, pageSize: 10_000, includeArchived: false });
  } catch (error) {
    // Sitemap should still render even if catalog storage is temporarily unavailable.
    console.error("[sitemap] Failed to load catalog cars, continuing with static routes only", error);
  }

  const carItems: MetadataRoute.Sitemap = cars.map((car) => ({
    url: `${siteUrl}/catalog/${encodeURIComponent(car.id)}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  let newsItems: MetadataRoute.Sitemap = [];
  try {
    const news = await listNewsForSitemap();
    newsItems = news.map((item) => ({
      url: `${siteUrl}/novosti/${encodeURIComponent(item.slug)}`,
      lastModified: item.updatedAt ? new Date(item.updatedAt) : now,
      changeFrequency: "daily",
      priority: 0.7,
    }));
  } catch (error) {
    console.error("[sitemap] Failed to load news items, continuing without news routes", error);
  }

  return [...baseItems, ...carItems, ...newsItems];
}
