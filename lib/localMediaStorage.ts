import "server-only";
import { randomUUID } from "crypto";
import { mkdir, writeFile, readFile, stat } from "fs/promises";
import path from "path";

export const LOCAL_BUCKET = "local";

function rootDir(): string {
  return process.env.RUNTIME_DIR?.trim() || path.join(process.cwd(), "runtime");
}

function uploadsRoot(): string {
  return path.join(rootDir(), "uploads");
}

function sanitizeFileName(name: string): string {
  const normalized = name
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || "file";
}

export function buildLocalAssetKey(originalName: string): string {
  const fileName = sanitizeFileName(originalName.toLowerCase());
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `admin/${year}/${month}/${randomUUID()}-${fileName}`;
}

export function buildLocalPublicUrl(key: string): string {
  return `/uploads/${key}`;
}

export async function saveLocalAsset(key: string, buffer: Buffer): Promise<void> {
  const target = path.join(uploadsRoot(), key);
  const dir = path.dirname(target);
  await mkdir(dir, { recursive: true });
  await writeFile(target, buffer);
}

export async function readLocalAsset(key: string): Promise<{ data: Buffer; size: number } | null> {
  const safeKey = key.replace(/\.\./g, "");
  const target = path.join(uploadsRoot(), safeKey);
  const root = uploadsRoot();
  if (!path.resolve(target).startsWith(path.resolve(root))) {
    return null;
  }
  try {
    const [data, info] = await Promise.all([readFile(target), stat(target)]);
    return { data, size: info.size };
  } catch {
    return null;
  }
}

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

export function inferMimeFromKey(key: string): string {
  const ext = path.extname(key).toLowerCase();
  return MIME_BY_EXT[ext] || "application/octet-stream";
}
