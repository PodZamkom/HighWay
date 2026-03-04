import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/admin/api";
import { writeAdminAuditLog } from "@/lib/admin/audit";
import {
  writeCatalogLabels,
  writeFooter,
  writeHomeCms,
  writeNavigation,
  writeSeoBundle,
} from "@/lib/cmsRepository";
import { getSiteContent } from "@/lib/data";
import type { CmsHomeContentDocument, CmsHomeLayoutDocument } from "@/types/cms";
import type { SiteContent } from "@/types/site";

export async function GET(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const content = await getSiteContent();
    return NextResponse.json(content);
  } catch (error) {
    console.error("Error reading site content:", error);
    return NextResponse.json({ error: "Failed to load site content" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const nextContent = (await request.json()) as SiteContent;
    const homeLayout: CmsHomeLayoutDocument = {
      blocks: [
        { key: "hero", enabled: true },
        { key: "promo", enabled: true },
        { key: "market", enabled: true },
        { key: "calculator", enabled: true },
        { key: "team", enabled: true },
      ],
    };
    const homeContent = {
      hero: nextContent.hero,
      promoBanners: nextContent.promoBanners,
      marketSection: nextContent.marketSection,
      calculator: nextContent.calculator,
      teamSection: nextContent.teamSection,
    } as unknown as CmsHomeContentDocument;

    await writeHomeCms(
      {
        layout: homeLayout,
        content: homeContent,
      },
      authResult.auth.user.id,
    );

    await Promise.all([
      writeNavigation(nextContent.navbar, authResult.auth.user.id),
      writeFooter(nextContent.footer, authResult.auth.user.id),
      writeSeoBundle(
        {
          global: nextContent.seo,
          catalogList: {
            title: `${nextContent.seo.title} | Каталог`,
            description: nextContent.seo.description,
            canonical: "/catalog",
            ogImage: nextContent.seo.ogImage,
            keywords: nextContent.seo.keywords,
            schemaName: "Каталог автомобилей",
            schemaDescription: "Актуальный каталог автомобилей с фильтрами по рынкам и параметрам.",
          },
          catalogDetailTemplate: {
            titleTemplate: "{brand} {model} {year} | Каталог",
            descriptionTemplate: "{brand} {model} {year}. Цена: {price}. {description}",
            canonicalTemplate: "/catalog/{id}",
            ogImage: nextContent.seo.ogImage,
            schemaTemplate: "{brand} {model} {year}",
            robots: "index,follow",
          },
        },
        authResult.auth.user.id,
      ),
      writeCatalogLabels(
        {
          catalogSection: nextContent.catalogSection,
          carDetail: nextContent.carDetail,
        },
        authResult.auth.user.id,
      ),
    ]);

    await writeAdminAuditLog({
      userId: authResult.auth.user.id,
      action: "admin.cms.site_content.legacy_update",
      entityType: "cms_document",
      entityId: "site_content",
    });

    return NextResponse.json({ success: true, deprecated: true });
  } catch (error) {
    console.error("Error saving site content:", error);
    return NextResponse.json({ error: "Failed to save site content" }, { status: 500 });
  }
}
