import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/admin/api";
import { readCmsRevisions } from "@/lib/cms/cmsAdminService";
import type { CmsDocumentKey } from "@/types/cms";

export async function GET(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key") as CmsDocumentKey | null;
    const limitRaw = Number(searchParams.get("limit") || "50");
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(200, Math.trunc(limitRaw))) : 50;

    const revisions = await readCmsRevisions({
      key: key || undefined,
      limit,
    });

    return NextResponse.json({ revisions });
  } catch (error) {
    console.error("Failed to load CMS revisions:", error);
    return NextResponse.json({ error: "Не удалось загрузить историю изменений" }, { status: 500 });
  }
}
