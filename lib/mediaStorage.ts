import { randomUUID } from "crypto";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let cachedClient: S3Client | null = null;

function requiredEnv(name: string): string {
  const value = (process.env[name] || "").trim();
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

export function isMediaStorageConfigured(): boolean {
  const required = [
    "S3_ENDPOINT",
    "S3_REGION",
    "S3_BUCKET",
    "S3_ACCESS_KEY_ID",
    "S3_SECRET_ACCESS_KEY",
  ];
  return required.every((name) => (process.env[name] || "").trim().length > 0);
}

function getS3Client(): S3Client {
  if (cachedClient) {
    return cachedClient;
  }

  cachedClient = new S3Client({
    endpoint: requiredEnv("S3_ENDPOINT"),
    region: requiredEnv("S3_REGION"),
    credentials: {
      accessKeyId: requiredEnv("S3_ACCESS_KEY_ID"),
      secretAccessKey: requiredEnv("S3_SECRET_ACCESS_KEY"),
    },
    forcePathStyle: true,
  });

  return cachedClient;
}

export function getS3Bucket(): string {
  return requiredEnv("S3_BUCKET");
}

export function buildPublicAssetUrl(key: string): string {
  const base = (process.env.S3_PUBLIC_BASE_URL || "").trim();
  if (base) {
    return `${base.replace(/\/$/, "")}/${key}`;
  }

  const endpoint = requiredEnv("S3_ENDPOINT").replace(/\/$/, "");
  const bucket = getS3Bucket();
  return `${endpoint}/${bucket}/${key}`;
}

function sanitizeFileName(name: string): string {
  const normalized = name
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || "file";
}

export function buildAssetKey(originalName: string): string {
  const fileName = sanitizeFileName(originalName.toLowerCase());
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `admin/${year}/${month}/${randomUUID()}-${fileName}`;
}

export async function createPresignedUpload(params: {
  key: string;
  mime: string;
  size: number;
  expiresInSeconds?: number;
}): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: getS3Bucket(),
    Key: params.key,
    ContentType: params.mime,
    ContentLength: params.size,
  });

  return getSignedUrl(getS3Client(), command, {
    expiresIn: params.expiresInSeconds ?? 900,
  });
}

export async function deleteS3Object(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: getS3Bucket(),
    Key: key,
  });

  await getS3Client().send(command);
}
