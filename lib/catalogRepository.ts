import { randomUUID } from "crypto";
import type { PoolClient } from "pg";
import { dbQuery, isDatabaseConfigured, withDbClient } from "@/lib/db";
import { ensureDatabaseReady } from "@/lib/db/ready";
import {
  assertMarketCurrencyAllowed,
  CurrencyPolicyError,
  normalizeCatalogCurrency,
  normalizeMarket,
} from "@/lib/catalog/currencyPolicy";
import type {
  CatalogCarEntity,
  CatalogCarImage,
  CatalogImportJob,
  CatalogImportRow,
  CatalogListResult,
} from "@/types/catalog";
import type { CarModel, Condition } from "@/types/car";
import { cars_db } from "@/data/cars_db";
import type { CatalogCarImageInputDto, CatalogCarInputDto, CatalogCarPatchDto } from "@/lib/schemas/catalog";

interface CatalogListFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  market?: string;
  availability?: string;
  includeArchived?: boolean;
}

interface CatalogCarRow {
  id: string;
  slug: string;
  brand: string;
  model: string;
  generation: string;
  year: number;
  condition: string;
  mileage_km: number | null;
  price_value: string | number;
  price_currency: "USD" | "EUR" | "BYN" | "JPY" | "CNY" | "KRW";
  price_type: "FOB" | "EXW" | "OnRoad" | "Estimate";
  availability: "InStock" | "EnRoute" | "OnOrder";
  market: "China" | "USA" | "Korea" | "Europe";
  type: "EV" | "EREV" | "ICE" | "HEV" | null;
  body_type: string;
  transmission: string;
  drive: string;
  description: string;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  images: CatalogCarImage[] | null;
}

function requireDbForWrites() {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is not configured. Catalog write operations require Postgres.");
  }
}

function assertCurrencyPolicy(market: string, currency: string) {
  const normalizedMarket = normalizeMarket(market);
  const normalizedCurrency = normalizeCatalogCurrency(currency);

  if (!normalizedMarket || !normalizedCurrency) {
    throw new Error(`Не удалось проверить политику валют: market=${market}, currency=${currency}`);
  }

  assertMarketCurrencyAllowed(normalizedMarket, normalizedCurrency);
}

function parsePriceValue(raw: string | number): number {
  if (typeof raw === "number") {
    return raw;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeCondition(value: string): Condition {
  if (value === "New" || value === "Used" || value === "Crashed") {
    return value;
  }
  return "Used";
}

function normalizeImages(raw: unknown): CatalogCarImage[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((item) => {
      const value = item as Partial<CatalogCarImage>;
      if (!value || typeof value !== "object") {
        return null;
      }
      return {
        id: Number(value.id || 0),
        carId: String(value.carId || ""),
        mediaAssetId: typeof value.mediaAssetId === "string" ? value.mediaAssetId : null,
        url: String(value.url || ""),
        alt: String(value.alt || ""),
        sortOrder: Number(value.sortOrder || 0),
        isCover: Boolean(value.isCover),
      } satisfies CatalogCarImage;
    })
    .filter((item): item is CatalogCarImage => Boolean(item && item.url));
}

function rowToEntity(row: CatalogCarRow): CatalogCarEntity {
  return {
    id: row.id,
    slug: row.slug,
    brand: row.brand,
    model: row.model,
    generation: row.generation,
    year: row.year,
    condition: normalizeCondition(row.condition),
    mileageKm: row.mileage_km,
    priceValue: parsePriceValue(row.price_value),
    priceCurrency: row.price_currency,
    priceType: row.price_type,
    availability: row.availability,
    market: row.market,
    type: row.type,
    bodyType: row.body_type,
    transmission: row.transmission,
    drive: row.drive,
    description: row.description,
    images: normalizeImages(row.images).sort((a, b) => a.sortOrder - b.sortOrder),
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function entityToLegacyCar(entity: CatalogCarEntity): CarModel {
  return {
    id: entity.id,
    slug: entity.slug,
    brand: entity.brand,
    model: entity.model,
    generation: entity.generation,
    year: entity.year,
    condition: entity.condition,
    mileage_km: entity.mileageKm ?? undefined,
    price_value: entity.priceValue,
    price_currency: entity.priceCurrency,
    price_type: entity.priceType,
    availability: entity.availability,
    market: entity.market,
    type: entity.type ?? undefined,
    body_type: entity.bodyType,
    transmission: entity.transmission,
    drive: entity.drive,
    images: entity.images
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((image) => image.url)
      .filter(Boolean),
    description: entity.description,
  };
}

function staticCarsToLegacy(filters: CatalogListFilters): CarModel[] {
  let items = [...cars_db];

  if (!filters.includeArchived) {
    items = items.filter((car) => car.id !== "");
  }

  if (filters.market) {
    items = items.filter((car) => car.market === filters.market);
  }

  if (filters.availability) {
    items = items.filter((car) => car.availability === filters.availability);
  }

  if (filters.search && filters.search.trim()) {
    const needle = filters.search.trim().toLowerCase();
    items = items.filter((car) => {
      const haystack = `${car.brand} ${car.model} ${car.generation || ""} ${car.id}`.toLowerCase();
      return haystack.includes(needle);
    });
  }

  return items;
}

function buildWhere(filters: CatalogListFilters) {
  const clauses: string[] = [];
  const values: unknown[] = [];

  if (!filters.includeArchived) {
    clauses.push("c.archived_at IS NULL");
  }

  if (filters.market) {
    values.push(filters.market);
    clauses.push(`c.market = $${values.length}`);
  }

  if (filters.availability) {
    values.push(filters.availability);
    clauses.push(`c.availability = $${values.length}`);
  }

  if (filters.search && filters.search.trim()) {
    values.push(`%${filters.search.trim()}%`);
    clauses.push(`(c.brand ILIKE $${values.length} OR c.model ILIKE $${values.length} OR c.generation ILIKE $${values.length} OR c.id ILIKE $${values.length})`);
  }

  return {
    whereSql: clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "",
    values,
  };
}

export async function listCatalogCars(filters: CatalogListFilters = {}): Promise<CatalogListResult> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.max(1, Math.min(100, filters.pageSize ?? 24));

  if (!isDatabaseConfigured()) {
    const staticItems = staticCarsToLegacy(filters);
    const start = (page - 1) * pageSize;
    const slice = staticItems.slice(start, start + pageSize);
    return {
      items: slice.map((car) => {
        const images = (car.images || []).map((url, index) => ({
          id: index + 1,
          carId: car.id,
          mediaAssetId: null,
          url,
          alt: `${car.brand} ${car.model}`,
          sortOrder: index,
          isCover: index === 0,
        }));

        return {
          id: car.id,
          slug: car.slug,
          brand: car.brand,
          model: car.model,
          generation: car.generation || "",
          year: car.year,
          condition: car.condition,
          mileageKm: car.mileage_km ?? null,
          priceValue: car.price_value,
          priceCurrency: car.price_currency,
          priceType: car.price_type,
          availability: car.availability,
          market: car.market,
          type: car.type ?? null,
          bodyType: car.body_type || "",
          transmission: car.transmission || "",
          drive: car.drive || "",
          description: car.description || "",
          images,
          archivedAt: null,
          createdAt: new Date(0).toISOString(),
          updatedAt: new Date(0).toISOString(),
        } as CatalogCarEntity;
      }),
      total: staticItems.length,
      page,
      pageSize,
    };
  }

  await ensureDatabaseReady();

  const { whereSql, values } = buildWhere({
    market: filters.market,
    availability: filters.availability,
    search: filters.search,
    includeArchived: filters.includeArchived,
  });

  const countQuery = `SELECT COUNT(*)::text AS count FROM catalog_cars c ${whereSql}`;
  const countResponse = await dbQuery<{ count: string }>(countQuery, values);
  const total = Number(countResponse.rows[0]?.count || "0");

  const offset = (page - 1) * pageSize;
  const listValues = [...values, pageSize, offset];
  const limitPlaceholder = `$${listValues.length - 1}`;
  const offsetPlaceholder = `$${listValues.length}`;

  const listQuery = `
    SELECT
      c.id,
      c.slug,
      c.brand,
      c.model,
      c.generation,
      c.year,
      c.condition,
      c.mileage_km,
      c.price_value,
      c.price_currency,
      c.price_type,
      c.availability,
      c.market,
      c.type,
      c.body_type,
      c.transmission,
      c.drive,
      c.description,
      c.archived_at,
      c.created_at,
      c.updated_at,
      COALESCE(
        json_agg(
          json_build_object(
            'id', i.id,
            'carId', i.car_id,
            'mediaAssetId', i.media_asset_id,
            'url', i.url,
            'alt', i.alt,
            'sortOrder', i.sort_order,
            'isCover', i.is_cover
          ) ORDER BY i.sort_order ASC, i.id ASC
        ) FILTER (WHERE i.id IS NOT NULL),
        '[]'::json
      ) AS images
    FROM catalog_cars c
    LEFT JOIN catalog_car_images i ON i.car_id = c.id
    ${whereSql}
    GROUP BY c.id
    ORDER BY c.updated_at DESC, c.id ASC
    LIMIT ${limitPlaceholder}
    OFFSET ${offsetPlaceholder}
  `;

  const response = await dbQuery<CatalogCarRow>(listQuery, listValues);
  const items = response.rows.map(rowToEntity);

  return {
    items,
    total,
    page,
    pageSize,
  };
}

export async function listCatalogCarsLegacy(filters: CatalogListFilters = {}): Promise<CarModel[]> {
  const result = await listCatalogCars({ ...filters, page: filters.page ?? 1, pageSize: filters.pageSize ?? 5000 });
  return result.items.map(entityToLegacyCar);
}

export async function findCatalogCarByIdOrSlug(idOrSlug: string): Promise<CatalogCarEntity | null> {
  const needle = idOrSlug.trim();
  if (!needle) return null;

  if (!isDatabaseConfigured()) {
    const car = cars_db.find((item) => item.id === needle || item.slug === needle);
    if (!car) return null;
    const images = (car.images || []).map((url, index) => ({
      id: index + 1,
      carId: car.id,
      mediaAssetId: null,
      url,
      alt: `${car.brand} ${car.model}`,
      sortOrder: index,
      isCover: index === 0,
    }));

    return {
      id: car.id,
      slug: car.slug,
      brand: car.brand,
      model: car.model,
      generation: car.generation || "",
      year: car.year,
      condition: car.condition,
      mileageKm: car.mileage_km ?? null,
      priceValue: car.price_value,
      priceCurrency: car.price_currency,
      priceType: car.price_type,
      availability: car.availability,
      market: car.market,
      type: car.type ?? null,
      bodyType: car.body_type || "",
      transmission: car.transmission || "",
      drive: car.drive || "",
      description: car.description || "",
      images,
      archivedAt: null,
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString(),
    };
  }

  await ensureDatabaseReady();

  const response = await dbQuery<CatalogCarRow>(
    `
      SELECT
        c.id,
        c.slug,
        c.brand,
        c.model,
        c.generation,
        c.year,
        c.condition,
        c.mileage_km,
        c.price_value,
        c.price_currency,
        c.price_type,
        c.availability,
        c.market,
        c.type,
        c.body_type,
        c.transmission,
        c.drive,
        c.description,
        c.archived_at,
        c.created_at,
        c.updated_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', i.id,
              'carId', i.car_id,
              'mediaAssetId', i.media_asset_id,
              'url', i.url,
              'alt', i.alt,
              'sortOrder', i.sort_order,
              'isCover', i.is_cover
            ) ORDER BY i.sort_order ASC, i.id ASC
          ) FILTER (WHERE i.id IS NOT NULL),
          '[]'::json
        ) AS images
      FROM catalog_cars c
      LEFT JOIN catalog_car_images i ON i.car_id = c.id
      WHERE (c.id = $1 OR c.slug = $1)
      GROUP BY c.id
      LIMIT 1
    `,
    [needle],
  );

  const row = response.rows[0];
  if (!row) return null;
  return rowToEntity(row);
}

function normalizeImageInputs(images: CatalogCarImageInputDto[]): CatalogCarImageInputDto[] {
  const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
  if (sorted.length > 0 && !sorted.some((item) => item.isCover)) {
    sorted[0].isCover = true;
  }

  return sorted.map((item, index) => ({
    ...item,
    alt: item.alt || "",
    sortOrder: Number.isFinite(item.sortOrder) ? item.sortOrder : index,
    isCover: Boolean(item.isCover),
  }));
}

async function persistImages(client: PoolClient, carId: string, images: CatalogCarImageInputDto[]) {
  await client.query(`DELETE FROM catalog_car_images WHERE car_id = $1`, [carId]);

  const normalized = normalizeImageInputs(images);
  for (let i = 0; i < normalized.length; i += 1) {
    const image = normalized[i];
    await client.query(
      `
        INSERT INTO catalog_car_images (car_id, media_asset_id, url, alt, sort_order, is_cover)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [carId, image.mediaAssetId ?? null, image.url, image.alt || "", image.sortOrder, image.isCover],
    );
  }
}

function entityToInput(entity: CatalogCarEntity): CatalogCarInputDto {
  return {
    id: entity.id,
    slug: entity.slug,
    brand: entity.brand,
    model: entity.model,
    generation: entity.generation,
    year: entity.year,
    condition: entity.condition,
    mileageKm: entity.mileageKm,
    priceValue: entity.priceValue,
    priceCurrency: entity.priceCurrency,
    priceType: entity.priceType,
    availability: entity.availability,
    market: entity.market,
    type: entity.type,
    bodyType: entity.bodyType,
    transmission: entity.transmission,
    drive: entity.drive,
    description: entity.description,
    images: entity.images.map((image) => ({
      id: image.id,
      mediaAssetId: image.mediaAssetId,
      url: image.url,
      alt: image.alt,
      sortOrder: image.sortOrder,
      isCover: image.isCover,
    })),
  };
}

export async function createCatalogCar(input: CatalogCarInputDto): Promise<CatalogCarEntity> {
  requireDbForWrites();
  await ensureDatabaseReady();
  assertCurrencyPolicy(input.market, input.priceCurrency);

  const carId = input.id || randomUUID();

  await withDbClient(async (client) => {
    await client.query("BEGIN");
    try {
      await client.query(
        `
          INSERT INTO catalog_cars (
            id, slug, brand, model, generation, year, condition, mileage_km,
            price_value, price_currency, price_type, availability, market, type,
            body_type, transmission, drive, description, archived_at, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8,
            $9, $10, $11, $12, $13, $14,
            $15, $16, $17, $18, NULL, NOW(), NOW()
          )
        `,
        [
          carId,
          input.slug,
          input.brand,
          input.model,
          input.generation || "",
          input.year,
          input.condition,
          input.mileageKm ?? null,
          input.priceValue,
          input.priceCurrency,
          input.priceType,
          input.availability,
          input.market,
          input.type ?? null,
          input.bodyType || "",
          input.transmission || "",
          input.drive || "",
          input.description || "",
        ],
      );

      await persistImages(client, carId, input.images || []);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });

  const created = await findCatalogCarByIdOrSlug(carId);
  if (!created) {
    throw new Error("Не удалось загрузить созданный автомобиль");
  }

  return created;
}

export async function updateCatalogCar(id: string, patch: CatalogCarPatchDto): Promise<CatalogCarEntity> {
  requireDbForWrites();
  await ensureDatabaseReady();

  const existing = await findCatalogCarByIdOrSlug(id);
  if (!existing) {
    throw new Error("Автомобиль не найден");
  }

  const next = {
    ...entityToInput(existing),
    ...patch,
    id: existing.id,
    images: patch.images ?? entityToInput(existing).images,
  } as CatalogCarInputDto;
  assertCurrencyPolicy(next.market, next.priceCurrency);

  await withDbClient(async (client) => {
    await client.query("BEGIN");
    try {
      await client.query(
        `
          UPDATE catalog_cars
          SET
            slug = $2,
            brand = $3,
            model = $4,
            generation = $5,
            year = $6,
            condition = $7,
            mileage_km = $8,
            price_value = $9,
            price_currency = $10,
            price_type = $11,
            availability = $12,
            market = $13,
            type = $14,
            body_type = $15,
            transmission = $16,
            drive = $17,
            description = $18,
            updated_at = NOW()
          WHERE id = $1
        `,
        [
          existing.id,
          next.slug,
          next.brand,
          next.model,
          next.generation || "",
          next.year,
          next.condition,
          next.mileageKm ?? null,
          next.priceValue,
          next.priceCurrency,
          next.priceType,
          next.availability,
          next.market,
          next.type ?? null,
          next.bodyType || "",
          next.transmission || "",
          next.drive || "",
          next.description || "",
        ],
      );

      if (patch.images) {
        await persistImages(client, existing.id, patch.images);
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });

  const updated = await findCatalogCarByIdOrSlug(existing.id);
  if (!updated) {
    throw new Error("Не удалось загрузить обновленный автомобиль");
  }

  return updated;
}

export { CurrencyPolicyError };

export async function archiveCatalogCar(id: string, archived: boolean): Promise<void> {
  requireDbForWrites();
  await ensureDatabaseReady();

  await dbQuery(
    `
      UPDATE catalog_cars
      SET archived_at = CASE WHEN $2::boolean THEN NOW() ELSE NULL END,
          updated_at = NOW()
      WHERE id = $1
    `,
    [id, archived],
  );
}

export async function createCatalogImportJob(params: {
  sourceFileName: string;
  status: CatalogImportJob["status"];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  createdBy: string | null;
  errors: string[];
}): Promise<string> {
  requireDbForWrites();
  await ensureDatabaseReady();

  const response = await dbQuery<{ id: string }>(
    `
      INSERT INTO catalog_import_jobs (
        source_file_name, status, total_rows, valid_rows, invalid_rows, created_by, errors
      ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
      RETURNING id
    `,
    [
      params.sourceFileName,
      params.status,
      params.totalRows,
      params.validRows,
      params.invalidRows,
      params.createdBy,
      JSON.stringify(params.errors || []),
    ],
  );

  return response.rows[0].id;
}

export async function insertCatalogImportRows(rows: Array<Omit<CatalogImportRow, "id">>): Promise<void> {
  if (!rows.length) return;
  requireDbForWrites();
  await ensureDatabaseReady();

  await withDbClient(async (client) => {
    await client.query("BEGIN");
    try {
      for (const row of rows) {
        await client.query(
          `
            INSERT INTO catalog_import_rows (
              job_id, row_index, raw_data, normalized_data, errors, status
            ) VALUES ($1, $2, $3::jsonb, $4::jsonb, $5::jsonb, $6)
          `,
          [
            row.jobId,
            row.rowIndex,
            JSON.stringify(row.rawData || {}),
            row.normalizedData ? JSON.stringify(row.normalizedData) : null,
            JSON.stringify(row.errors || []),
            row.status,
          ],
        );
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}

export async function readCatalogImportJob(jobId: string): Promise<{
  job: CatalogImportJob | null;
  rows: CatalogImportRow[];
}> {
  requireDbForWrites();
  await ensureDatabaseReady();

  const jobRes = await dbQuery<{
    id: string;
    source_file_name: string;
    status: CatalogImportJob["status"];
    total_rows: number;
    valid_rows: number;
    invalid_rows: number;
    created_by: string | null;
    created_at: string;
    applied_at: string | null;
    errors: string[] | null;
  }>(
    `
      SELECT
        id,
        source_file_name,
        status,
        total_rows,
        valid_rows,
        invalid_rows,
        created_by,
        created_at,
        applied_at,
        errors
      FROM catalog_import_jobs
      WHERE id = $1
      LIMIT 1
    `,
    [jobId],
  );

  const jobRow = jobRes.rows[0];
  if (!jobRow) {
    return { job: null, rows: [] };
  }

  const rowsRes = await dbQuery<{
    id: number;
    job_id: string;
    row_index: number;
    raw_data: Record<string, unknown>;
    normalized_data: Record<string, unknown> | null;
    errors: string[];
    status: CatalogImportRow["status"];
  }>(
    `
      SELECT id, job_id, row_index, raw_data, normalized_data, errors, status
      FROM catalog_import_rows
      WHERE job_id = $1
      ORDER BY row_index ASC
    `,
    [jobId],
  );

  const rows: CatalogImportRow[] = rowsRes.rows.map((row) => ({
    id: row.id,
    jobId: row.job_id,
    rowIndex: row.row_index,
    rawData: row.raw_data || {},
    normalizedData: row.normalized_data,
    errors: Array.isArray(row.errors) ? row.errors : [],
    status: row.status,
  }));

  return {
    job: {
      id: jobRow.id,
      sourceFileName: jobRow.source_file_name,
      status: jobRow.status,
      totalRows: jobRow.total_rows,
      validRows: jobRow.valid_rows,
      invalidRows: jobRow.invalid_rows,
      createdBy: jobRow.created_by,
      createdAt: jobRow.created_at,
      appliedAt: jobRow.applied_at,
      errors: Array.isArray(jobRow.errors) ? jobRow.errors : [],
    },
    rows,
  };
}

export async function updateCatalogImportJob(
  jobId: string,
  patch: Partial<Pick<CatalogImportJob, "status" | "totalRows" | "validRows" | "invalidRows" | "errors" | "appliedAt">>,
): Promise<void> {
  requireDbForWrites();
  await ensureDatabaseReady();

  await dbQuery(
    `
      UPDATE catalog_import_jobs
      SET
        status = COALESCE($2, status),
        total_rows = COALESCE($3, total_rows),
        valid_rows = COALESCE($4, valid_rows),
        invalid_rows = COALESCE($5, invalid_rows),
        errors = COALESCE($6::jsonb, errors),
        applied_at = CASE
          WHEN $7::boolean THEN NOW()
          WHEN $8::boolean THEN NULL
          ELSE applied_at
        END
      WHERE id = $1
    `,
    [
      jobId,
      patch.status ?? null,
      patch.totalRows ?? null,
      patch.validRows ?? null,
      patch.invalidRows ?? null,
      patch.errors ? JSON.stringify(patch.errors) : null,
      Boolean(patch.appliedAt),
      patch.appliedAt === null,
    ],
  );
}
