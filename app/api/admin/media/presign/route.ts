import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/admin/api";
import { mediaPresignRequestSchema } from "@/lib/schemas/media";
import { buildAssetKey, buildPublicAssetUrl, createPresignedUpload, isMediaStorageConfigured } from "@/lib/mediaStorage";

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
    const parsed = mediaPresignRequestSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: "Некорректные параметры файла" }, { status: 400 });
    }

    const key = buildAssetKey(parsed.data.fileName);
    const uploadUrl = await createPresignedUpload({
      key,
      mime: parsed.data.mime,
      size: parsed.data.size,
    });

    return NextResponse.json({
      uploadUrl,
      key,
      publicUrl: buildPublicAssetUrl(key),
    });
  } catch (error) {
    console.error("Failed to create media presign URL:", error);
    return NextResponse.json({ error: "Не удалось подготовить загрузку" }, { status: 500 });
  }
}
