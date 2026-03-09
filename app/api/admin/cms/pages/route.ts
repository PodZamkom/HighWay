import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/admin/api";
import { readAllContentPages } from "@/lib/cms/cmsAdminService";

export async function GET(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const pages = await readAllContentPages();
    return NextResponse.json({ pages });
  } catch (error) {
    console.error("Failed to load CMS pages collection:", error);
    return NextResponse.json({ error: "Не удалось загрузить страницы" }, { status: 500 });
  }
}
