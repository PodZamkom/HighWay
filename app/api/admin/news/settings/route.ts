import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/admin/api";
import { writeAdminAuditLog } from "@/lib/admin/audit";
import { readNewsSettings, writeNewsSettings } from "@/lib/cms/cmsAdminService";
import { newsSettingsSchema } from "@/lib/schemas/news";

export async function GET(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const settings = await readNewsSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Failed to load news settings:", error);
    return NextResponse.json({ error: "Не удалось загрузить настройки новостей" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const payload = await request.json();
    const parsed = newsSettingsSchema.safeParse(payload?.settings ?? payload);

    if (!parsed.success) {
      return NextResponse.json({ error: "Некорректные настройки новостей" }, { status: 400 });
    }

    await writeNewsSettings(parsed.data, authResult.auth.user.id);

    await writeAdminAuditLog({
      userId: authResult.auth.user.id,
      action: "admin.news.settings.update",
      entityType: "cms_document",
      entityId: "news:settings",
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to save news settings:", error);
    return NextResponse.json({ error: error?.message || "Не удалось сохранить настройки новостей" }, { status: 500 });
  }
}
