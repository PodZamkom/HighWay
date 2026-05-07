import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/admin/api";
import { writeAdminAuditLog } from "@/lib/admin/audit";
import { readAnalyticsCounters, writeAnalyticsCounters } from "@/lib/cms/cmsAdminService";
import { cmsAnalyticsCountersSchema } from "@/lib/schemas/cms";

export async function GET(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const document = await readAnalyticsCounters();
    return NextResponse.json({ counters: document.counters });
  } catch (error) {
    console.error("Failed to load analytics counters:", error);
    return NextResponse.json({ error: "Не удалось загрузить счётчики" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const payload = await request.json();
    const parsed = cmsAnalyticsCountersSchema.safeParse({
      counters: payload?.counters ?? [],
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "Некорректные данные счётчиков" }, { status: 400 });
    }

    const stamped = {
      counters: parsed.data.counters.map((counter) => ({
        ...counter,
        updatedAt: new Date().toISOString(),
      })),
    };

    const saved = await writeAnalyticsCounters(stamped, authResult.auth.user.id);

    await writeAdminAuditLog({
      userId: authResult.auth.user.id,
      action: "admin.cms.analytics_counters.update",
      entityType: "cms_document",
      entityId: "analytics:counters",
      details: { count: saved.counters.length },
    });

    return NextResponse.json({ counters: saved.counters });
  } catch (error: any) {
    console.error("Failed to save analytics counters:", error);
    return NextResponse.json({ error: error?.message || "Не удалось сохранить счётчики" }, { status: 500 });
  }
}
