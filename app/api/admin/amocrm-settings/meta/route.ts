import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/admin/api";
import { AmocrmError, fetchAmocrmMeta } from "@/lib/amocrmClient";
import { normalizeAmocrmSettings, readAmocrmSettings } from "@/lib/amocrmSettingsStore";

export async function POST(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    let payload: unknown = null;
    try {
      payload = await request.json();
    } catch {
      payload = null;
    }

    const settings = payload ? normalizeAmocrmSettings(payload) : await readAmocrmSettings();
    if (!settings.subdomain || !settings.accessToken) {
      return NextResponse.json(
        { success: false, error: "Укажите поддомен и токен перед загрузкой воронок" },
        { status: 400 },
      );
    }

    const meta = await fetchAmocrmMeta(settings);
    return NextResponse.json({ success: true, meta });
  } catch (error: any) {
    if (error instanceof AmocrmError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error("amoCRM meta load failed:", error);
    return NextResponse.json(
      { success: false, error: "Не удалось загрузить данные amoCRM" },
      { status: 500 },
    );
  }
}
