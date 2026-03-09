import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/admin/api";
import { writeAdminAuditLog } from "@/lib/admin/audit";
import { readHomeContent, readHomeLayout, writeHomeCms } from "@/lib/cms/cmsAdminService";
import { cmsHomeContentSchema, cmsHomeLayoutSchema } from "@/lib/schemas/cms";
import type { CmsHomeContentDocument, CmsHomeLayoutDocument } from "@/types/cms";

export async function GET(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const [layout, content] = await Promise.all([readHomeLayout(), readHomeContent()]);
    return NextResponse.json({ layout, content });
  } catch (error) {
    console.error("Failed to load home CMS document:", error);
    return NextResponse.json({ error: "Не удалось загрузить раздел главной" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const payload = await request.json();
    const layoutParsed = cmsHomeLayoutSchema.safeParse(payload?.layout);
    const contentParsed = cmsHomeContentSchema.safeParse(payload?.content);

    if (!layoutParsed.success || !contentParsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные главной страницы" },
        { status: 400 },
      );
    }

    await writeHomeCms(
      {
        layout: layoutParsed.data as CmsHomeLayoutDocument,
        content: contentParsed.data as unknown as CmsHomeContentDocument,
      },
      authResult.auth.user.id,
    );

    await writeAdminAuditLog({
      userId: authResult.auth.user.id,
      action: "admin.cms.home.update",
      entityType: "cms_document",
      entityId: "home_layout,home_content",
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to save home CMS document:", error);
    return NextResponse.json({ error: error?.message || "Не удалось сохранить раздел главной" }, { status: 500 });
  }
}
