import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/admin/api";
import {
  normalizeCrmProviderSettings,
  readCrmProviderSettings,
  writeCrmProviderSettings,
} from "@/lib/crmProviderStore";

export async function GET(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const settings = await readCrmProviderSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error reading crm provider:", error);
    return NextResponse.json({ error: "Failed to load crm provider" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const payload = (await request.json()) as unknown;
    const normalized = normalizeCrmProviderSettings(payload);
    const settings = await writeCrmProviderSettings(normalized);
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("Error saving crm provider:", error);
    return NextResponse.json({ error: "Failed to save crm provider" }, { status: 500 });
  }
}
