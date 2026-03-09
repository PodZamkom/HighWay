import "server-only";

import {
  entityToLegacyCar,
  findCatalogCarByIdOrSlug,
  listCatalogCars,
  listCatalogCarsLegacy,
} from "@/lib/catalogRepository";
import {
  getPublicCatalogCar as getCachedCatalogCar,
  getPublicCatalogCars as getCachedCatalogCars,
  getPublicCatalogDetailSeoTemplate as getCachedCatalogDetailSeoTemplate,
  getPublicCatalogListSeo as getCachedCatalogListSeo,
} from "@/lib/publicSiteService";

export { entityToLegacyCar, findCatalogCarByIdOrSlug, listCatalogCars, listCatalogCarsLegacy };

export async function getPublicCatalogCars() {
  return getCachedCatalogCars();
}

export async function getPublicCatalogCar(idOrSlug: string) {
  return getCachedCatalogCar(idOrSlug);
}

export async function getPublicCatalogListSeo() {
  return getCachedCatalogListSeo();
}

export async function getPublicCatalogDetailSeoTemplate() {
  return getCachedCatalogDetailSeoTemplate();
}
