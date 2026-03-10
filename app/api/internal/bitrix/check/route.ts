import { NextResponse } from "next/server";
import { BitrixHealthError, runBitrixHealthCheck } from "@/lib/bitrixHealth";
import { readBitrixSettings } from "@/lib/bitrixSettingsStore";

export const runtime = "nodejs";

function isAuthorized(request: Request): boolean {
  const expectedToken = (process.env.RUNTIME_PREPARE_TOKEN || "").trim();
  if (!expectedToken) {
    return false;
  }

  const receivedToken = request.headers.get("x-runtime-prepare-token")?.trim() || "";
  return receivedToken === expectedToken;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await readBitrixSettings();
    const result = await runBitrixHealthCheck(settings);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof BitrixHealthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }

    console.error("[bitrix.check] failed:", error);
    return NextResponse.json({ ok: false, error: "Bitrix health check failed" }, { status: 500 });
  }
}
