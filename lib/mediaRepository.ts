import { dbQuery, isDatabaseConfigured } from "@/lib/db";
import { ensureDatabaseReady } from "@/lib/db/ready";
import type { MediaAsset } from "@/types/media";

function requireDb() {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is not configured");
  }
}

function mapMediaRow(row: {
  id: string;
  bucket: string;
  object_key: string;
  url: string;
  mime: string;
  size: string | number;
  width: number | null;
  height: number | null;
  original_name: string;
  uploader: string | null;
  created_at: string;
}): MediaAsset {
  return {
    id: row.id,
    bucket: row.bucket,
    key: row.object_key,
    url: row.url,
    mime: row.mime,
    size: Number(row.size),
    width: row.width,
    height: row.height,
    originalName: row.original_name,
    uploader: row.uploader,
    createdAt: row.created_at,
  };
}

export async function createMediaAsset(input: {
  bucket: string;
  key: string;
  url: string;
  mime: string;
  size: number;
  width?: number | null;
  height?: number | null;
  originalName: string;
  uploader: string | null;
}): Promise<MediaAsset> {
  requireDb();
  await ensureDatabaseReady();

  const response = await dbQuery<{
    id: string;
    bucket: string;
    object_key: string;
    url: string;
    mime: string;
    size: string;
    width: number | null;
    height: number | null;
    original_name: string;
    uploader: string | null;
    created_at: string;
  }>(
    `
      INSERT INTO media_assets (
        bucket, object_key, url, mime, size, width, height, original_name, uploader
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, bucket, object_key, url, mime, size, width, height, original_name, uploader, created_at
    `,
    [
      input.bucket,
      input.key,
      input.url,
      input.mime,
      input.size,
      input.width ?? null,
      input.height ?? null,
      input.originalName,
      input.uploader,
    ],
  );

  return mapMediaRow(response.rows[0]);
}

export async function listMediaAssets(params?: {
  page?: number;
  pageSize?: number;
}): Promise<{ items: MediaAsset[]; total: number; page: number; pageSize: number }> {
  requireDb();
  await ensureDatabaseReady();

  const page = Math.max(1, params?.page ?? 1);
  const pageSize = Math.max(1, Math.min(100, params?.pageSize ?? 24));
  const offset = (page - 1) * pageSize;

  const [countRes, listRes] = await Promise.all([
    dbQuery<{ count: string }>(`SELECT COUNT(*)::text AS count FROM media_assets`),
    dbQuery<{
      id: string;
      bucket: string;
      object_key: string;
      url: string;
      mime: string;
      size: string;
      width: number | null;
      height: number | null;
      original_name: string;
      uploader: string | null;
      created_at: string;
    }>(
      `
        SELECT id, bucket, object_key, url, mime, size, width, height, original_name, uploader, created_at
        FROM media_assets
        ORDER BY created_at DESC, id DESC
        LIMIT $1 OFFSET $2
      `,
      [pageSize, offset],
    ),
  ]);

  return {
    items: listRes.rows.map(mapMediaRow),
    total: Number(countRes.rows[0]?.count || "0"),
    page,
    pageSize,
  };
}

export async function findMediaAssetById(id: string): Promise<MediaAsset | null> {
  requireDb();
  await ensureDatabaseReady();

  const response = await dbQuery<{
    id: string;
    bucket: string;
    object_key: string;
    url: string;
    mime: string;
    size: string;
    width: number | null;
    height: number | null;
    original_name: string;
    uploader: string | null;
    created_at: string;
  }>(
    `
      SELECT id, bucket, object_key, url, mime, size, width, height, original_name, uploader, created_at
      FROM media_assets
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  const row = response.rows[0];
  return row ? mapMediaRow(row) : null;
}

export async function deleteMediaAsset(id: string): Promise<MediaAsset | null> {
  requireDb();
  await ensureDatabaseReady();

  const response = await dbQuery<{
    id: string;
    bucket: string;
    object_key: string;
    url: string;
    mime: string;
    size: string;
    width: number | null;
    height: number | null;
    original_name: string;
    uploader: string | null;
    created_at: string;
  }>(
    `
      DELETE FROM media_assets
      WHERE id = $1
      RETURNING id, bucket, object_key, url, mime, size, width, height, original_name, uploader, created_at
    `,
    [id],
  );

  const row = response.rows[0];
  return row ? mapMediaRow(row) : null;
}
