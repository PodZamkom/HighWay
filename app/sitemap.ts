import type { MetadataRoute } from "next";
import { resolveSiteUrl } from "@/lib/breadcrumbs";
import { listCatalogCarsLegacy } from "@/lib/catalogRepository";

const CONTENT_ROUTES = [
  "/",
  "/o-kompanii",
  "/uslugi",
  "/servisy",
  "/poleznoe",
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

  const cars = await listCatalogCarsLegacy({ page: 1, pageSize: 10_000, includeArchived: false });
  const carItems: MetadataRoute.Sitemap = cars.map((car) => ({
    url: `${siteUrl}/catalog/${encodeURIComponent(car.id)}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  return [...baseItems, ...carItems];
}
