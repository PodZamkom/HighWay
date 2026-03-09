import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/admin/api";
import { writeAdminAuditLog } from "@/lib/admin/audit";
import { readCatalogLabels, writeCatalogLabels } from "@/lib/cms/cmsAdminService";
import { cmsCatalogLabelsSchema } from "@/lib/schemas/cms";

export async function GET(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const labels = await readCatalogLabels();
    return NextResponse.json({ labels });
  } catch (error) {
    console.error("Failed to load catalog labels CMS document:", error);
    return NextResponse.json({ error: "Не удалось загрузить подписи каталога" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const payload = await request.json();
    const parsed = cmsCatalogLabelsSchema.safeParse(payload?.labels ?? payload);
    if (!parsed.success) {
      return NextResponse.json({ error: "Некорректные подписи каталога" }, { status: 400 });
    }

    await writeCatalogLabels(parsed.data, authResult.auth.user.id);

    await writeAdminAuditLog({
      userId: authResult.auth.user.id,
      action: "admin.cms.catalog_labels.update",
      entityType: "cms_document",
      entityId: "catalog:labels",
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to save catalog labels CMS document:", error);
    return NextResponse.json({ error: error?.message || "Не удалось сохранить подписи каталога" }, { status: 500 });
  }
}
