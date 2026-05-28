import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { normalizeAmocrmSettings, readAmocrmSettings, writeAmocrmSettings } from "@/lib/amocrmSettingsStore";

export const runtime = "nodejs";

const RUNTIME_DIR = process.env.APP_RUNTIME_DIR?.trim() || path.join(process.cwd(), "runtime");
const SECRET_FILE = path.join(RUNTIME_DIR, "amocrm-setup-secret.txt");

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const providedSecret = url.searchParams.get("secret")?.trim();
    if (!providedSecret) {
      return NextResponse.json({ error: "Missing setup secret" }, { status: 401, headers: CORS_HEADERS });
    }

    let expectedSecret: string;
    try {
      expectedSecret = (await fs.readFile(SECRET_FILE, "utf-8")).trim();
    } catch {
      return NextResponse.json({ error: "Setup secret not configured" }, { status: 403, headers: CORS_HEADERS });
    }

    if (!expectedSecret || providedSecret !== expectedSecret) {
      return NextResponse.json({ error: "Invalid setup secret" }, { status: 403, headers: CORS_HEADERS });
    }

    const body = (await request.json().catch(() => ({}))) as {
      accessToken?: unknown;
      subdomain?: unknown;
      pipelineId?: unknown;
    };

    const accessToken = typeof body.accessToken === "string" ? body.accessToken.trim() : "";
    const subdomain = typeof body.subdomain === "string" ? body.subdomain.trim() : "";

    if (!accessToken || accessToken.length < 50) {
      return NextResponse.json({ error: "accessToken missing or too short" }, { status: 400, headers: CORS_HEADERS });
    }
    if (!subdomain) {
      return NextResponse.json({ error: "subdomain required" }, { status: 400, headers: CORS_HEADERS });
    }

    const current = await readAmocrmSettings();
    const pipelineIdRaw = typeof body.pipelineId === "number" ? body.pipelineId : Number(body.pipelineId ?? current.pipelineId);
    const pipelineId = Number.isFinite(pipelineIdRaw) && pipelineIdRaw > 0 ? Math.trunc(pipelineIdRaw) : current.pipelineId;

    const merged = normalizeAmocrmSettings({
      ...current,
      enabled: true,
      subdomain,
      accessToken,
      pipelineId,
    });

    const saved = await writeAmocrmSettings(merged);

    // Burn the secret — one-time use
    try {
      await fs.unlink(SECRET_FILE);
    } catch {
      // already gone — ok
    }

    return NextResponse.json(
      {
        success: true,
        message: "amoCRM token saved",
        subdomain: saved.subdomain,
        enabled: saved.enabled,
        pipelineId: saved.pipelineId,
      },
      { status: 200, headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error("Import amocrm token failed:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500, headers: CORS_HEADERS });
  }
}
