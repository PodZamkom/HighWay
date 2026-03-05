import type { PoolClient } from "pg";
import { withDbClient } from "@/lib/db";

interface Migration {
  id: string;
  sql: string;
}

const MIGRATIONS: Migration[] = [
  {
    id: "20260304_0001_admin_cms_catalog",
    sql: `
      CREATE EXTENSION IF NOT EXISTS pgcrypto;

      CREATE TABLE IF NOT EXISTS admin_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        login TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS admin_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL UNIQUE,
        ip_address TEXT,
        user_agent TEXT,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);

      CREATE TABLE IF NOT EXISTS admin_audit_logs (
        id BIGSERIAL PRIMARY KEY,
        user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT,
        details JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_user_id ON admin_audit_logs(user_id);

      CREATE TABLE IF NOT EXISTS media_assets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        bucket TEXT NOT NULL,
        object_key TEXT NOT NULL,
        url TEXT NOT NULL,
        mime TEXT NOT NULL,
        size BIGINT NOT NULL,
        width INT,
        height INT,
        original_name TEXT NOT NULL,
        uploader UUID REFERENCES admin_users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(bucket, object_key)
      );

      CREATE INDEX IF NOT EXISTS idx_media_assets_created_at ON media_assets(created_at DESC);

      CREATE TABLE IF NOT EXISTS cms_documents (
        key TEXT PRIMARY KEY,
        content JSONB NOT NULL,
        updated_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS cms_revisions (
        id BIGSERIAL PRIMARY KEY,
        key TEXT NOT NULL,
        content JSONB NOT NULL,
        created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_cms_revisions_key_created ON cms_revisions(key, created_at DESC);

      CREATE TABLE IF NOT EXISTS catalog_cars (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        brand TEXT NOT NULL,
        model TEXT NOT NULL,
        generation TEXT NOT NULL DEFAULT '',
        year INT NOT NULL,
        condition TEXT NOT NULL,
        mileage_km INT,
        price_value NUMERIC(14,2) NOT NULL,
        price_currency TEXT NOT NULL,
        price_type TEXT NOT NULL,
        availability TEXT NOT NULL,
        market TEXT NOT NULL,
        type TEXT,
        body_type TEXT NOT NULL DEFAULT '',
        transmission TEXT NOT NULL DEFAULT '',
        drive TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT '',
        archived_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_catalog_cars_market ON catalog_cars(market);
      CREATE INDEX IF NOT EXISTS idx_catalog_cars_archived ON catalog_cars(archived_at);
      CREATE INDEX IF NOT EXISTS idx_catalog_cars_brand_model ON catalog_cars(brand, model);

      CREATE TABLE IF NOT EXISTS catalog_car_images (
        id BIGSERIAL PRIMARY KEY,
        car_id TEXT NOT NULL REFERENCES catalog_cars(id) ON DELETE CASCADE,
        media_asset_id UUID REFERENCES media_assets(id) ON DELETE SET NULL,
        url TEXT NOT NULL,
        alt TEXT NOT NULL DEFAULT '',
        sort_order INT NOT NULL DEFAULT 0,
        is_cover BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_catalog_car_images_car_sort ON catalog_car_images(car_id, sort_order, id);

      CREATE TABLE IF NOT EXISTS catalog_seo_overrides (
        id BIGSERIAL PRIMARY KEY,
        scope TEXT NOT NULL,
        target_id TEXT,
        title TEXT,
        description TEXT,
        canonical TEXT,
        og_image TEXT,
        robots TEXT,
        schema_json JSONB,
        updated_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(scope, target_id)
      );

      CREATE TABLE IF NOT EXISTS catalog_import_jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        source_file_name TEXT NOT NULL,
        status TEXT NOT NULL,
        total_rows INT NOT NULL DEFAULT 0,
        valid_rows INT NOT NULL DEFAULT 0,
        invalid_rows INT NOT NULL DEFAULT 0,
        created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        applied_at TIMESTAMPTZ,
        errors JSONB NOT NULL DEFAULT '[]'::jsonb
      );

      CREATE INDEX IF NOT EXISTS idx_catalog_import_jobs_created ON catalog_import_jobs(created_at DESC);

      CREATE TABLE IF NOT EXISTS catalog_import_rows (
        id BIGSERIAL PRIMARY KEY,
        job_id UUID NOT NULL REFERENCES catalog_import_jobs(id) ON DELETE CASCADE,
        row_index INT NOT NULL,
        raw_data JSONB NOT NULL,
        normalized_data JSONB,
        errors JSONB NOT NULL DEFAULT '[]'::jsonb,
        status TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_catalog_import_rows_job_id ON catalog_import_rows(job_id, row_index);
    `,
  },
  {
    id: "20260305_0002_update_home_hero_youtube_source",
    sql: `
      UPDATE cms_documents
      SET
        content = jsonb_set(
          content,
          '{hero,youtubeSource}',
          to_jsonb('https://www.youtube.com/shorts/eoh6ZrVTGgQ'::text),
          true
        ),
        updated_at = NOW()
      WHERE key = 'home_content';

      INSERT INTO cms_revisions (key, content, created_by)
      SELECT key, content, NULL
      FROM cms_documents
      WHERE key = 'home_content';
    `,
  },
];

async function ensureMigrationsTable(client: PoolClient) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

export async function runMigrations(): Promise<void> {
  await withDbClient(async (client) => {
    await ensureMigrationsTable(client);

    const result = await client.query<{ id: string }>(`SELECT id FROM schema_migrations`);
    const applied = new Set(result.rows.map((row) => row.id));

    for (const migration of MIGRATIONS) {
      if (applied.has(migration.id)) {
        continue;
      }

      await client.query("BEGIN");
      try {
        await client.query(migration.sql);
        await client.query(`INSERT INTO schema_migrations (id) VALUES ($1)`, [migration.id]);
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  });
}
