import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/admin/api";
import { writeAdminAuditLog } from "@/lib/admin/audit";
import { createMediaAsset } from "@/lib/media/mediaAdminService";
import { isMediaStorageConfigured } from "@/lib/mediaStorage";
import {
  LOCAL_BUCKET,
  buildLocalAssetKey,
  buildLocalPublicUrl,
  saveLocalAsset,
} from "@/lib/localMediaStorage";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/svg+xml",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const IMAGE_MAX_SIZE = 20 * 1024 * 1024;
const VIDEO_MAX_SIZE = 200 * 1024 * 1024;

export async function POST(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  if (isMediaStorageConfigured()) {
    return NextResponse.json(
      { error: "S3-хранилище настроено. Используйте основной канал загрузки." },
      { status: 409 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Ожидается multipart/form-data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Файл не передан" }, { status: 400 });
  }

  const mime = file.type || "application/octet-stream";
  if (!ALLOWED_MIME.has(mime)) {
    return NextResponse.json({ error: "Недопустимый тип файла" }, { status: 400 });
  }

  const isVideo = mime.startsWith("video/");
  const maxSize = isVideo ? VIDEO_MAX_SIZE : IMAGE_MAX_SIZE;
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: isVideo ? "Видео должно быть не больше 200MB" : "Изображение должно быть не больше 20MB" },
      { status: 400 },
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const key = buildLocalAssetKey(file.name || "file");

  try {
    await saveLocalAsset(key, buffer);
  } catch (error) {
    console.error("Failed to write local asset:", error);
    return NextResponse.json({ error: "Не удалось сохранить файл на сервере" }, { status: 500 });
  }

  try {
    const asset = await createMediaAsset({
      bucket: LOCAL_BUCKET,
      key,
      url: buildLocalPublicUrl(key),
      mime,
      size: file.size,
      originalName: file.name || "file",
      uploader: authResult.auth.user.id,
    });

    await writeAdminAuditLog({
      userId: authResult.auth.user.id,
      action: "admin.media.create",
      entityType: "media",
      entityId: asset.id,
      details: {
        key: asset.key,
        mime: asset.mime,
        size: asset.size,
        storage: "local",
      },
    });

    return NextResponse.json({ asset });
  } catch (error) {
    console.error("Failed to register local media asset:", error);
    return NextResponse.json({ error: "Не удалось сохранить запись о файле" }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
