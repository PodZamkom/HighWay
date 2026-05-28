import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/admin/api";
import { AmocrmHealthError, runAmocrmHealthCheck } from "@/lib/amocrmHealth";
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
    const result = await runAmocrmHealthCheck(settings);
    return NextResponse.json({ success: true, message: result.message });
  } catch (error: any) {
    if (error instanceof AmocrmHealthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error("amoCRM test failed:", error);
    return NextResponse.json({ success: false, error: "Не удалось проверить amoCRM" }, { status: 500 });
  }
}
