import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/admin/api";
import { writeAdminAuditLog } from "@/lib/admin/audit";
import { readNavigation, writeNavigation } from "@/lib/cmsRepository";
import { cmsNavigationSchema } from "@/lib/schemas/cms";

export async function GET(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const navigation = await readNavigation();
    return NextResponse.json({ navigation });
  } catch (error) {
    console.error("Failed to load navigation CMS document:", error);
    return NextResponse.json({ error: "Не удалось загрузить навигацию" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const payload = await request.json();
    const parsed = cmsNavigationSchema.safeParse(payload?.navigation ?? payload);
    if (!parsed.success) {
      return NextResponse.json({ error: "Некорректные данные навигации" }, { status: 400 });
    }

    await writeNavigation(parsed.data, authResult.auth.user.id);

    await writeAdminAuditLog({
      userId: authResult.auth.user.id,
      action: "admin.cms.navigation.update",
      entityType: "cms_document",
      entityId: "navigation",
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to save navigation CMS document:", error);
    return NextResponse.json({ error: error?.message || "Не удалось сохранить навигацию" }, { status: 500 });
  }
}
