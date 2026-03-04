import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/admin/api";
import { writeAdminAuditLog } from "@/lib/admin/audit";
import {
  readCatalogDetailSeoTemplate,
  readCatalogListSeo,
  readGlobalSeo,
  writeSeoBundle,
} from "@/lib/cmsRepository";
import { cmsSeoBundleSchema } from "@/lib/schemas/cms";

export async function GET(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const [global, catalogList, catalogDetailTemplate] = await Promise.all([
      readGlobalSeo(),
      readCatalogListSeo(),
      readCatalogDetailSeoTemplate(),
    ]);

    return NextResponse.json({
      seo: {
        global,
        catalogList,
        catalogDetailTemplate,
      },
    });
  } catch (error) {
    console.error("Failed to load SEO CMS documents:", error);
    return NextResponse.json({ error: "Не удалось загрузить SEO" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const payload = await request.json();
    const parsed = cmsSeoBundleSchema.safeParse(payload?.seo ?? payload);
    if (!parsed.success) {
      return NextResponse.json({ error: "Некорректные SEO-данные" }, { status: 400 });
    }

    await writeSeoBundle(parsed.data, authResult.auth.user.id);

    await writeAdminAuditLog({
      userId: authResult.auth.user.id,
      action: "admin.cms.seo.update",
      entityType: "cms_document",
      entityId: "seo:global,seo:catalog-list,seo:catalog-detail-template",
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to save SEO CMS documents:", error);
    return NextResponse.json({ error: error?.message || "Не удалось сохранить SEO" }, { status: 500 });
  }
}
