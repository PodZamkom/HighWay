import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/admin/api";
import { listAdminAuditLogs } from "@/lib/admin/audit";

export async function GET(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const { searchParams } = new URL(request.url);
    const limitRaw = Number(searchParams.get("limit") || "100");
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(500, Math.trunc(limitRaw))) : 100;
    const entries = await listAdminAuditLogs(limit);
    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Failed to load admin audit logs:", error);
    return NextResponse.json({ error: "Не удалось загрузить аудит-лог" }, { status: 500 });
  }
}
