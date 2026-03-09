import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { requireAdminApiAuth } from "@/lib/admin/api";
import { writeAdminAuditLog } from "@/lib/admin/audit";
import { applyCatalogImportRows, type ParsedImportRow } from "@/lib/catalog/import";
import { readCatalogImportJob, updateCatalogImportJob } from "@/lib/catalog/catalogAdminService";
import { catalogImportApplySchema, catalogCarInputSchema } from "@/lib/schemas/catalog";

export async function GET(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const { jobId } = await params;
    const data = await readCatalogImportJob(jobId);
    if (!data.job) {
      return NextResponse.json({ error: "Задача импорта не найдена" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to load import job:", error);
    return NextResponse.json({ error: "Не удалось загрузить задачу импорта" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const { jobId } = await params;
    const payload = await request.json().catch(() => ({}));
    const parsedAction = catalogImportApplySchema.safeParse(payload);
    if (!parsedAction.success || parsedAction.data.apply !== true) {
      return NextResponse.json({ error: "Некорректное действие импорта" }, { status: 400 });
    }

    const data = await readCatalogImportJob(jobId);
    if (!data.job) {
      return NextResponse.json({ error: "Задача импорта не найдена" }, { status: 404 });
    }

    const rowsForApply: ParsedImportRow[] = data.rows
      .filter((row) => row.status === "valid")
      .map((row) => {
        const parsedCar = catalogCarInputSchema.safeParse(row.normalizedData || {});
        if (!parsedCar.success) {
          return {
            rowIndex: row.rowIndex,
            rawData: row.rawData,
            normalizedData: null,
            errors: parsedCar.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
            status: "invalid" as const,
          };
        }

        return {
          rowIndex: row.rowIndex,
          rawData: row.rawData,
          normalizedData: parsedCar.data,
          errors: [],
          status: "valid" as const,
        };
      });

    const result = await applyCatalogImportRows(rowsForApply);

    if (result.appliedRowIndexes.length > 0) {
      await dbQuery(
        `
          UPDATE catalog_import_rows
          SET status = 'applied'
          WHERE job_id = $1
            AND row_index = ANY($2::int[])
        `,
        [jobId, result.appliedRowIndexes],
      );
    }

    const nextStatus = result.failed > 0 && result.applied === 0 ? "failed" : "applied";
    await updateCatalogImportJob(jobId, {
      status: nextStatus,
      errors: result.errors,
      appliedAt: nextStatus === "applied" ? new Date().toISOString() : null,
    });

    await writeAdminAuditLog({
      userId: authResult.auth.user.id,
      action: "admin.catalog.import.apply",
      entityType: "catalog_import_job",
      entityId: jobId,
      details: {
        applied: result.applied,
        failed: result.failed,
      },
    });

    return NextResponse.json({
      success: nextStatus === "applied",
      status: nextStatus,
      applied: result.applied,
      failed: result.failed,
      errors: result.errors,
    });
  } catch (error: any) {
    console.error("Failed to apply import job:", error);
    return NextResponse.json({ error: error?.message || "Не удалось применить импорт" }, { status: 500 });
  }
}
