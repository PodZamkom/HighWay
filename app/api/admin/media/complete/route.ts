import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/admin/api";
import { writeAdminAuditLog } from "@/lib/admin/audit";
import { createMediaAsset } from "@/lib/media/mediaAdminService";
import { mediaCompleteRequestSchema } from "@/lib/schemas/media";
import { buildPublicAssetUrl, getS3Bucket, isMediaStorageConfigured } from "@/lib/mediaStorage";

export async function POST(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  if (!isMediaStorageConfigured()) {
    return NextResponse.json(
      { error: "S3-хранилище не настроено" },
      { status: 503 },
    );
  }

  try {
    const payload = await request.json();
    const parsed = mediaCompleteRequestSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: "Некорректные данные файла" }, { status: 400 });
    }

    const data = parsed.data;
    const asset = await createMediaAsset({
      bucket: getS3Bucket(),
      key: data.key,
      url: buildPublicAssetUrl(data.key),
      mime: data.mime,
      size: data.size,
      width: data.width ?? null,
      height: data.height ?? null,
      originalName: data.originalName,
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
      },
    });

    return NextResponse.json({ asset });
  } catch (error) {
    console.error("Failed to finalize media upload:", error);
    return NextResponse.json({ error: "Не удалось сохранить файл" }, { status: 500 });
  }
}
