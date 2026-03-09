import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/admin/api";
import { writeAdminAuditLog } from "@/lib/admin/audit";
import { deleteMediaAsset, findMediaAssetById } from "@/lib/media/mediaAdminService";
import { deleteS3Object, isMediaStorageConfigured } from "@/lib/mediaStorage";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  try {
    const { id } = await params;
    const asset = await findMediaAssetById(id);
    if (!asset) {
      return NextResponse.json({ error: "Файл не найден" }, { status: 404 });
    }

    return NextResponse.json({ asset });
  } catch (error) {
    console.error("Failed to get media asset:", error);
    return NextResponse.json({ error: "Не удалось получить файл" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  try {
    const { id } = await params;
    const asset = await findMediaAssetById(id);
    if (!asset) {
      return NextResponse.json({ error: "Файл не найден" }, { status: 404 });
    }

    if (isMediaStorageConfigured()) {
      try {
        await deleteS3Object(asset.key);
      } catch (s3Error) {
        console.error("Failed to delete object in S3:", s3Error);
      }
    }

    await deleteMediaAsset(id);

    await writeAdminAuditLog({
      userId: authResult.auth.user.id,
      action: "admin.media.delete",
      entityType: "media",
      entityId: id,
      details: {
        key: asset.key,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete media asset:", error);
    return NextResponse.json({ error: "Не удалось удалить файл" }, { status: 500 });
  }
}
