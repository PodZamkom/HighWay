import { randomUUID } from "crypto";
import type { PoolClient } from "pg";
import { withDbClient } from "@/lib/db";
import { importedCarsDb } from "@/data/cars_imported_db";
import { buildCmsDefaults } from "@/lib/db/cmsDefaults";
import type { CmsDocumentKey } from "@/types/cms";
import type { CarModel } from "@/types/car";

async function upsertCmsDocument(client: PoolClient, key: CmsDocumentKey, content: unknown) {
  await client.query(
    `
      INSERT INTO cms_documents (key, content, updated_by)
      VALUES ($1, $2::jsonb, NULL)
      ON CONFLICT (key) DO NOTHING
    `,
    [key, JSON.stringify(content)],
  );
}

async function insertCmsRevision(client: PoolClient, key: CmsDocumentKey, content: unknown) {
  await client.query(
    `
      INSERT INTO cms_revisions (key, content, created_by)
      VALUES ($1, $2::jsonb, NULL)
    `,
    [key, JSON.stringify(content)],
  );
}

async function seedCmsIfEmpty(client: PoolClient) {
  const result = await client.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM cms_documents`);
  const total = Number(result.rows[0]?.count || "0");
  if (total > 0) {
    return;
  }

  const defaults = await buildCmsDefaults();
  const entries = Object.entries(defaults) as Array<[CmsDocumentKey, unknown]>;
  for (const [key, content] of entries) {
    await upsertCmsDocument(client, key, content);
    await insertCmsRevision(client, key, content);
  }
}

function normalizeCar(car: CarModel) {
  return {
    id: car.id || randomUUID(),
    slug: car.slug || car.id || randomUUID(),
    brand: car.brand || "",
    model: car.model || "",
    generation: car.generation || "",
    year: Number.isFinite(car.year) ? car.year : 2000,
    condition: car.condition || "Used",
    mileageKm: typeof car.mileage_km === "number" ? Math.max(0, Math.trunc(car.mileage_km)) : null,
    priceValue: Number.isFinite(car.price_value) ? car.price_value : 0,
    priceCurrency: car.price_currency || "USD",
    priceType: car.price_type || "FOB",
    availability: car.availability || "OnOrder",
    market: car.market || "China",
    type: car.type || null,
    bodyType: car.body_type || "",
    transmission: car.transmission || "",
    drive: car.drive || "",
    description: car.description || "",
    images: Array.isArray(car.images) ? car.images.filter(Boolean) : [],
  };
}

async function insertCar(client: PoolClient, car: CarModel) {
  const normalized = normalizeCar(car);
  await client.query(
    `
      INSERT INTO catalog_cars (
        id, slug, brand, model, generation, year, condition, mileage_km,
        price_value, price_currency, price_type, availability, market, type,
        body_type, transmission, drive, description, archived_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, NULL
      )
    `,
    [
      normalized.id,
      normalized.slug,
      normalized.brand,
      normalized.model,
      normalized.generation,
      normalized.year,
      normalized.condition,
      normalized.mileageKm,
      normalized.priceValue,
      normalized.priceCurrency,
      normalized.priceType,
      normalized.availability,
      normalized.market,
      normalized.type,
      normalized.bodyType,
      normalized.transmission,
      normalized.drive,
      normalized.description,
    ],
  );

  for (let i = 0; i < normalized.images.length; i += 1) {
    const url = normalized.images[i];
    await client.query(
      `
        INSERT INTO catalog_car_images (car_id, media_asset_id, url, alt, sort_order, is_cover)
        VALUES ($1, NULL, $2, $3, $4, $5)
      `,
      [normalized.id, url, `${normalized.brand} ${normalized.model}`.trim(), i, i === 0],
    );
  }
}

async function seedCatalogIfEmpty(client: PoolClient) {
  const result = await client.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM catalog_cars`);
  const total = Number(result.rows[0]?.count || "0");
  if (total > 0) {
    return;
  }

  for (const car of importedCarsDb) {
    await insertCar(client, car);
  }
}

async function ensureAdminUserFromEnv(client: PoolClient) {
  const login = (process.env.ADMIN_LOGIN || "").trim();
  const passwordHash = (process.env.ADMIN_PASSWORD_HASH || "").trim();
  if (!login || !passwordHash) {
    return;
  }

  await client.query(
    `
      INSERT INTO admin_users (login, password_hash, is_active)
      VALUES ($1, $2, TRUE)
      ON CONFLICT (login)
      DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        is_active = TRUE,
        updated_at = NOW()
    `,
    [login, passwordHash],
  );
}

async function ensureMissingCmsKeys(client: PoolClient) {
  const defaults = await buildCmsDefaults();
  const keysResult = await client.query<{ key: string }>(`SELECT key FROM cms_documents`);
  const existing = new Set(keysResult.rows.map((row) => row.key));

  const missing = (Object.keys(defaults) as CmsDocumentKey[]).filter((key) => !existing.has(key));
  for (const key of missing) {
    const content = defaults[key];
    await upsertCmsDocument(client, key, content);
    await insertCmsRevision(client, key, content);
  }
}

export async function bootstrapDatabase(): Promise<void> {
  await withDbClient(async (client) => {
    await client.query("BEGIN");
    try {
      await seedCmsIfEmpty(client);
      await ensureMissingCmsKeys(client);
      await seedCatalogIfEmpty(client);
      await ensureAdminUserFromEnv(client);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}
