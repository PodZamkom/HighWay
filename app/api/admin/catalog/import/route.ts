import path from "path";
import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/admin/api";
import { writeAdminAuditLog } from "@/lib/admin/audit";
import { parseCatalogImportFile } from "@/lib/catalog/import";
import { createCatalogImportJob, insertCatalogImportRows } from "@/lib/catalog/catalogAdminService";
import type { CatalogImportRow } from "@/types/catalog";

const ALLOWED_EXTENSIONS = new Set([".csv", ".xlsx", ".xls"]);

export async function POST(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Файл не передан" }, { status: 400 });
    }

    const extension = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      return NextResponse.json({ error: "Поддерживаются только CSV и XLSX" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsedRows = parseCatalogImportFile(file.name, buffer);

    const totalRows = parsedRows.length;
    const validRows = parsedRows.filter((row) => row.status === "valid").length;
    const invalidRows = totalRows - validRows;

    const jobId = await createCatalogImportJob({
      sourceFileName: file.name,
      status: "validated",
      totalRows,
      validRows,
      invalidRows,
      createdBy: authResult.auth.user.id,
      errors: [],
    });

    const rowsToInsert: Array<Omit<CatalogImportRow, "id">> = parsedRows.map((row) => ({
      jobId,
      rowIndex: row.rowIndex,
      rawData: row.rawData,
      normalizedData: row.normalizedData ? (row.normalizedData as Record<string, unknown>) : null,
      errors: row.errors,
      status: row.status,
    }));

    await insertCatalogImportRows(rowsToInsert);

    await writeAdminAuditLog({
      userId: authResult.auth.user.id,
      action: "admin.catalog.import.create",
      entityType: "catalog_import_job",
      entityId: jobId,
      details: {
        sourceFileName: file.name,
        totalRows,
        validRows,
        invalidRows,
      },
    });

    return NextResponse.json({
      jobId,
      summary: {
        totalRows,
        validRows,
        invalidRows,
      },
      preview: parsedRows.slice(0, 50),
    });
  } catch (error) {
    console.error("Failed to create catalog import job:", error);
    return NextResponse.json({ error: "Не удалось обработать файл импорта" }, { status: 500 });
  }
}
