import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/admin/api";
import { writeAdminAuditLog } from "@/lib/admin/audit";
import { readContentPage, writeContentPageDoc } from "@/lib/cms/cmsAdminService";
import { cmsContentPageSchema, contentPageSlugSchema } from "@/lib/schemas/cms";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const { slug } = await params;
    const parsedSlug = contentPageSlugSchema.safeParse(slug);
    if (!parsedSlug.success) {
      return NextResponse.json({ error: "Страница не найдена" }, { status: 404 });
    }

    const page = await readContentPage(parsedSlug.data);
    return NextResponse.json({ page });
  } catch (error) {
    console.error("Failed to load page CMS document:", error);
    return NextResponse.json({ error: "Не удалось загрузить страницу" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const { slug } = await params;
    const parsedSlug = contentPageSlugSchema.safeParse(slug);
    if (!parsedSlug.success) {
      return NextResponse.json({ error: "Страница не найдена" }, { status: 404 });
    }

    const payload = await request.json();
    const parsedPage = cmsContentPageSchema.safeParse(payload?.page ?? payload);
    if (!parsedPage.success) {
      return NextResponse.json({ error: "Некорректные данные страницы" }, { status: 400 });
    }

    await writeContentPageDoc(parsedSlug.data, parsedPage.data, authResult.auth.user.id);

    await writeAdminAuditLog({
      userId: authResult.auth.user.id,
      action: "admin.cms.page.update",
      entityType: "cms_document",
      entityId: `page:${parsedSlug.data}`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to save page CMS document:", error);
    return NextResponse.json({ error: error?.message || "Не удалось сохранить страницу" }, { status: 500 });
  }
}
