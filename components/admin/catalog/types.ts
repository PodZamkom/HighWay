import type { Market } from "@/types/car";
import type { CatalogCarEntity } from "@/types/catalog";

export type CarFormState = {
  id?: string;
  slug: string;
  brand: string;
  model: string;
  priority: number;
  generation: string;
  year: number;
  condition: "New" | "Used" | "Crashed";
  mileageKm: number | null;
  priceValue: number;
  priceCurrency: "USD" | "EUR" | "BYN" | "JPY" | "CNY" | "KRW";
  priceType: "FOB" | "EXW" | "OnRoad" | "Estimate";
  availability: "InStock" | "EnRoute" | "OnOrder";
  market: Market;
  type: "EV" | "EREV" | "ICE" | "HEV" | null;
  bodyType: string;
  transmission: string;
  drive: string;
  description: string;
  images: Array<{
    id?: number;
    mediaAssetId?: string | null;
    url: string;
    alt: string;
    sortOrder: number;
    isCover: boolean;
  }>;
};

export interface CatalogTreePath {
  market?: Market;
  brand?: string;
  model?: string;
  generation?: string;
}

export interface CatalogTreeNode {
  id: string;
  label: string;
  level: "market" | "brand" | "model" | "generation";
  path: CatalogTreePath;
  count: number;
  children: CatalogTreeNode[];
}

export type PendingNavigationAction =
  | { type: "select_tree"; path: CatalogTreePath | null }
  | { type: "select_car"; carId: string }
  | { type: "start_create"; path: CatalogTreePath | null };

export interface CatalogDirtyState {
  isDirty: boolean;
  initialSnapshot: string;
  currentSnapshot: string;
}

export function defaultFormState(): CarFormState {
  return {
    slug: "",
    brand: "",
    model: "",
    priority: 0,
    generation: "",
    year: new Date().getFullYear(),
    condition: "Used",
    mileageKm: null,
    priceValue: 0,
    priceCurrency: "USD",
    priceType: "FOB",
    availability: "OnOrder",
    market: "China",
    type: null,
    bodyType: "",
    transmission: "",
    drive: "",
    description: "",
    images: [],
  };
}

export function mapCarToForm(car: CatalogCarEntity): CarFormState {
  return {
    id: car.id,
    slug: car.slug,
    brand: car.brand,
    model: car.model,
    priority: car.priority,
    generation: car.generation,
    year: car.year,
    condition: car.condition,
    mileageKm: car.mileageKm,
    priceValue: car.priceValue,
    priceCurrency: car.priceCurrency,
    priceType: car.priceType,
    availability: car.availability,
    market: car.market,
    type: car.type,
    bodyType: car.bodyType,
    transmission: car.transmission,
    drive: car.drive,
    description: car.description,
    images: [...car.images]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((image, index) => ({
        id: image.id,
        mediaAssetId: image.mediaAssetId,
        url: image.url,
        alt: image.alt,
        sortOrder: index,
        isCover: image.isCover,
      })),
  };
}

export function serializeFormState(form: CarFormState): string {
  return JSON.stringify({
    ...form,
    priority: Number.isFinite(form.priority) ? Math.trunc(form.priority) : 0,
    images: form.images.map((image, index) => ({
      id: image.id,
      mediaAssetId: image.mediaAssetId ?? null,
      url: image.url,
      alt: image.alt,
      sortOrder: index,
      isCover: image.isCover,
    })),
  });
}

export function pathToKey(path: CatalogTreePath | null): string {
  if (!path) return "all";

  const normalizePart = (value: string | undefined) => {
    if (value === undefined) return "*";
    if (value === "") return "(empty)";
    return value;
  };

  return [
    normalizePart(path.market),
    normalizePart(path.brand),
    normalizePart(path.model),
    normalizePart(path.generation),
  ].join("|");
}

export function isPathEqual(left: CatalogTreePath | null, right: CatalogTreePath | null): boolean {
  return pathToKey(left) === pathToKey(right);
}

export function matchPath(car: CatalogCarEntity, path: CatalogTreePath | null): boolean {
  if (!path) return true;
  if (path.market && car.market !== path.market) return false;
  if (path.brand && car.brand !== path.brand) return false;
  if (path.model && car.model !== path.model) return false;
  if (path.generation !== undefined && car.generation !== path.generation) return false;
  return true;
}

export function applyPathToForm(base: CarFormState, path: CatalogTreePath | null): CarFormState {
  if (!path) return base;

  return {
    ...base,
    market: path.market || base.market,
    brand: path.brand || "",
    model: path.model || "",
    generation: path.generation ?? "",
  };
}

export function pathLabel(path: CatalogTreePath | null): string {
  if (!path) return "Все автомобили";

  const generationLabel = path.generation !== undefined ? (path.generation || "Без комплектации") : null;
  const parts = [path.market, path.brand, path.model, generationLabel].filter(Boolean);
  return parts.length ? parts.join(" / ") : "Все автомобили";
}
