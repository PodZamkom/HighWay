import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/admin/api";
import { writeAdminAuditLog } from "@/lib/admin/audit";
import { patchNewsStatus } from "@/lib/news/newsAdminService";
import { newsIdParamSchema, newsStatusPatchSchema } from "@/lib/schemas/news";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const { id } = await params;
    const parsedId = newsIdParamSchema.safeParse({ id });
    if (!parsedId.success) {
      return NextResponse.json({ error: "Новость не найдена" }, { status: 404 });
    }

    const payload = await request.json();
    const parsed = newsStatusPatchSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: "Некорректный запрос смены статуса" }, { status: 400 });
    }

    const updated = await patchNewsStatus(parsedId.data.id, parsed.data, authResult.auth.user.id);

    await writeAdminAuditLog({
      userId: authResult.auth.user.id,
      action: `admin.news.status.${parsed.data.status}`,
      entityType: "news_post",
      entityId: updated.id,
      details: {
        status: updated.status,
        publishedAt: updated.publishedAt,
      },
    });

    return NextResponse.json({ post: updated });
  } catch (error: any) {
    console.error("Failed to patch news status:", error);
    return NextResponse.json({ error: error?.message || "Не удалось изменить статус" }, { status: 500 });
  }
}
