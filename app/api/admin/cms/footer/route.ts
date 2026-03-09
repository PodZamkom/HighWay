import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/admin/api";
import { writeAdminAuditLog } from "@/lib/admin/audit";
import { readFooter, writeFooter } from "@/lib/cms/cmsAdminService";
import { cmsFooterSchema } from "@/lib/schemas/cms";

export async function GET(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const footer = await readFooter();
    return NextResponse.json({ footer });
  } catch (error) {
    console.error("Failed to load footer CMS document:", error);
    return NextResponse.json({ error: "Не удалось загрузить футер" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const payload = await request.json();
    const parsed = cmsFooterSchema.safeParse(payload?.footer ?? payload);
    if (!parsed.success) {
      return NextResponse.json({ error: "Некорректные данные футера" }, { status: 400 });
    }

    await writeFooter(parsed.data, authResult.auth.user.id);

    await writeAdminAuditLog({
      userId: authResult.auth.user.id,
      action: "admin.cms.footer.update",
      entityType: "cms_document",
      entityId: "footer",
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to save footer CMS document:", error);
    return NextResponse.json({ error: error?.message || "Не удалось сохранить футер" }, { status: 500 });
  }
}
