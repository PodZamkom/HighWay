import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/admin/api";
import {
  normalizeAmocrmSettings,
  readAmocrmSettings,
  writeAmocrmSettings,
} from "@/lib/amocrmSettingsStore";
import type { AmocrmSettings } from "@/types/amocrm";

function validateSettings(settings: AmocrmSettings): string[] {
  const issues: string[] = [];

  if (settings.enabled) {
    if (!settings.subdomain) issues.push("Укажите поддомен amoCRM");
    if (!settings.accessToken) issues.push("Укажите долгосрочный токен amoCRM");
  }

  if (settings.subdomain && !/^[a-z0-9-]+$/.test(settings.subdomain)) {
    issues.push("Поддомен может содержать только латиницу, цифры и дефис");
  }

  return issues;
}

export async function GET(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const settings = await readAmocrmSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error reading amocrm settings:", error);
    return NextResponse.json({ error: "Failed to load amocrm settings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const payload = (await request.json()) as unknown;
    const normalized = normalizeAmocrmSettings(payload);
    const issues = validateSettings(normalized);

    if (issues.length > 0) {
      return NextResponse.json({ error: "Validation failed", issues }, { status: 400 });
    }

    const settings = await writeAmocrmSettings(normalized);
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("Error saving amocrm settings:", error);
    return NextResponse.json({ error: "Failed to save amocrm settings" }, { status: 500 });
  }
}
