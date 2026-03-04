import { NextResponse } from "next/server";
import type { AdminContentPagesResponse } from "@/types/content-pages";
import { requireAdminApiAuth } from "@/lib/admin/api";
import { writeAdminAuditLog } from "@/lib/admin/audit";
import {
  readAllContentPages,
  readGlobalSeo,
  writeContentPagesAndGlobalSeo,
} from "@/lib/cmsRepository";
import { cmsContentPageSchema, cmsGlobalSeoSchema } from "@/lib/schemas/cms";

export async function GET(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const [pages, globalSeo] = await Promise.all([readAllContentPages(), readGlobalSeo()]);
    const response: AdminContentPagesResponse = {
      pages,
      globalSeo,
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error reading content pages payload:", error);
    return NextResponse.json({ error: "Failed to load content pages" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const payload = await request.json();

    const pagesPayload = payload?.pages;
    const globalSeoPayload = payload?.globalSeo;

    const parsedPages = {
      "o-kompanii": cmsContentPageSchema.safeParse(pagesPayload?.["o-kompanii"]),
      uslugi: cmsContentPageSchema.safeParse(pagesPayload?.uslugi),
      servisy: cmsContentPageSchema.safeParse(pagesPayload?.servisy),
      poleznoe: cmsContentPageSchema.safeParse(pagesPayload?.poleznoe),
      kontakty: cmsContentPageSchema.safeParse(pagesPayload?.kontakty),
    };
    const parsedGlobalSeo = cmsGlobalSeoSchema.safeParse(globalSeoPayload);

    if (
      !parsedPages["o-kompanii"].success ||
      !parsedPages.uslugi.success ||
      !parsedPages.servisy.success ||
      !parsedPages.poleznoe.success ||
      !parsedPages.kontakty.success ||
      !parsedGlobalSeo.success
    ) {
      return NextResponse.json({ error: "Некорректные данные страниц или SEO" }, { status: 400 });
    }

    const pages = {
      "o-kompanii": parsedPages["o-kompanii"].data,
      uslugi: parsedPages.uslugi.data,
      servisy: parsedPages.servisy.data,
      poleznoe: parsedPages.poleznoe.data,
      kontakty: parsedPages.kontakty.data,
    };

    const globalSeo = parsedGlobalSeo.data;

    await writeContentPagesAndGlobalSeo({ pages, globalSeo }, authResult.auth.user.id);

    await writeAdminAuditLog({
      userId: authResult.auth.user.id,
      action: "admin.cms.pages.bulk_update",
      entityType: "cms_document",
      entityId: "content_pages",
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error saving content pages payload:", error);
    return NextResponse.json({ error: error?.message || "Failed to save content pages" }, { status: 500 });
  }
}
