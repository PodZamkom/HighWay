import path from "path";
import * as XLSX from "xlsx";
import { catalogCarInputSchema, type CatalogCarInputDto } from "@/lib/schemas/catalog";
import {
  getMarketDefaultCurrency,
  normalizeCatalogCurrency,
  normalizeMarket,
} from "@/lib/catalog/currencyPolicy";
import {
  createCatalogCar,
  findCatalogCarByIdOrSlug,
  updateCatalogCar,
} from "@/lib/catalogRepository";

export interface ParsedImportRow {
  rowIndex: number;
  rawData: Record<string, unknown>;
  normalizedData: CatalogCarInputDto | null;
  errors: string[];
  status: "valid" | "invalid";
}

function normalizeHeaderKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function pickString(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }
  return "";
}

function pickNumber(row: Record<string, unknown>, keys: string[]): number | null {
  const raw = pickString(row, keys);
  if (!raw) return null;
  const normalized = raw.replace(/\s+/g, "").replace(/,/g, ".");
  const number = Number(normalized);
  if (!Number.isFinite(number)) return null;
  return number;
}

function parseImages(value: string): Array<{ url: string; alt: string; sortOrder: number; isCover: boolean; mediaAssetId: null }> {
  if (!value.trim()) return [];
  const parts = value
    .split(/[\n,;]/g)
    .map((item) => item.trim())
    .filter(Boolean);

  return parts.map((url, index) => ({
    url,
    alt: "",
    sortOrder: index,
    isCover: index === 0,
    mediaAssetId: null,
  }));
}

function normalizeRow(row: Record<string, unknown>): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    output[normalizeHeaderKey(key)] = value;
  }
  return output;
}

export function parseCatalogImportFile(fileName: string, buffer: Buffer): ParsedImportRow[] {
  const extension = path.extname(fileName).toLowerCase();
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    raw: false,
    codepage: 65001,
    dense: true,
  });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return [];
  }

  const sheet = workbook.Sheets[firstSheetName];
  const sourceRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });

  const parsedRows: ParsedImportRow[] = sourceRows.map((sourceRow, index) => {
    const normalizedRow = normalizeRow(sourceRow);

    const slug = pickString(normalizedRow, ["slug", "id"]);
    const id = pickString(normalizedRow, ["id", "slug"]);
    const brand = pickString(normalizedRow, ["brand", "make"]);
    const model = pickString(normalizedRow, ["model"]);
    const generation = pickString(normalizedRow, ["generation", "trim"]);
    const year = pickNumber(normalizedRow, ["year"]);
    const condition = pickString(normalizedRow, ["condition"]);
    const mileageKm = pickNumber(normalizedRow, ["mileage_km", "mileage", "mileagekm"]);
    const priceValue = pickNumber(normalizedRow, ["price_value", "price", "price_usd"]);
    const priceCurrencyRaw = pickString(normalizedRow, ["price_currency", "currency"]).toUpperCase();
    const priceType = pickString(normalizedRow, ["price_type"]).toUpperCase();
    const availability = pickString(normalizedRow, ["availability"]);
    const marketRaw = pickString(normalizedRow, ["market"]);
    const type = pickString(normalizedRow, ["type"]).toUpperCase();
    const bodyType = pickString(normalizedRow, ["body_type", "bodytype", "body"]);
    const transmission = pickString(normalizedRow, ["transmission"]);
    const drive = pickString(normalizedRow, ["drive"]);
    const description = pickString(normalizedRow, ["description"]);
    const imagesRaw = pickString(normalizedRow, ["images", "image_urls", "gallery"]);
    const normalizedMarket = normalizeMarket(marketRaw);
    const normalizedPriceCurrency = normalizeCatalogCurrency(priceCurrencyRaw);
    const resolvedMarket = normalizedMarket || marketRaw;
    const resolvedPriceCurrency = priceCurrencyRaw
      ? normalizedPriceCurrency || priceCurrencyRaw
      : normalizedMarket
      ? getMarketDefaultCurrency(normalizedMarket)
      : "USD";

    const candidate: Record<string, unknown> = {
      id: id || undefined,
      slug,
      brand,
      model,
      generation,
      year: year ?? undefined,
      condition,
      mileageKm: mileageKm ?? null,
      priceValue: priceValue ?? undefined,
      priceCurrency: resolvedPriceCurrency,
      priceType: priceType || "FOB",
      availability,
      market: resolvedMarket,
      type: type || null,
      bodyType,
      transmission,
      drive,
      description,
      images: parseImages(imagesRaw),
    };

    const validation = catalogCarInputSchema.safeParse(candidate);

    return {
      rowIndex: index + 1,
      rawData: sourceRow,
      normalizedData: validation.success ? validation.data : null,
      errors: validation.success
        ? []
        : validation.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
      status: validation.success ? "valid" : "invalid",
    };
  });

  if (extension === ".csv") {
    return parsedRows;
  }

  return parsedRows;
}

export async function applyCatalogImportRows(rows: ParsedImportRow[]): Promise<{
  applied: number;
  failed: number;
  errors: string[];
  appliedRowIndexes: number[];
}> {
  let applied = 0;
  let failed = 0;
  const errors: string[] = [];
  const appliedRowIndexes: number[] = [];

  for (const row of rows) {
    if (!row.normalizedData || row.status !== "valid") {
      continue;
    }

    try {
      const key = row.normalizedData.id || row.normalizedData.slug;
      const existing = await findCatalogCarByIdOrSlug(key);
      if (existing) {
        await updateCatalogCar(existing.id, row.normalizedData);
      } else {
        await createCatalogCar(row.normalizedData);
      }
      applied += 1;
      appliedRowIndexes.push(row.rowIndex);
    } catch (error: any) {
      failed += 1;
      errors.push(`Строка ${row.rowIndex}: ${error?.message || "ошибка применения"}`);
    }
  }

  return { applied, failed, errors, appliedRowIndexes };
}
