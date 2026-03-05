import type { Availability, CarType, Condition, Market, PriceType } from "@/types/car";

export interface CatalogCarImage {
  id: number;
  carId: string;
  mediaAssetId: string | null;
  url: string;
  alt: string;
  sortOrder: number;
  isCover: boolean;
}

export interface CatalogCarEntity {
  id: string;
  slug: string;
  brand: string;
  model: string;
  priority: number;
  generation: string;
  year: number;
  condition: Condition;
  mileageKm: number | null;
  priceValue: number;
  priceCurrency: "USD" | "EUR" | "BYN" | "JPY" | "CNY" | "KRW";
  priceType: PriceType;
  availability: Availability;
  market: Market;
  type: CarType | null;
  bodyType: string;
  transmission: string;
  drive: string;
  description: string;
  images: CatalogCarImage[];
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogListResult {
  items: CatalogCarEntity[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CatalogImportJob {
  id: string;
  sourceFileName: string;
  status: "uploaded" | "validated" | "applied" | "failed";
  totalRows: number;
  validRows: number;
  invalidRows: number;
  createdBy: string | null;
  createdAt: string;
  appliedAt: string | null;
  errors: string[];
}

export interface CatalogImportRow {
  id: number;
  jobId: string;
  rowIndex: number;
  rawData: Record<string, unknown>;
  normalizedData: Record<string, unknown> | null;
  errors: string[];
  status: "valid" | "invalid" | "applied";
}
