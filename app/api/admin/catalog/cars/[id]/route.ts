import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/admin/api";
import { writeAdminAuditLog } from "@/lib/admin/audit";
import { archiveCatalogCar, findCatalogCarByIdOrSlug, updateCatalogCar } from "@/lib/catalogRepository";
import { catalogArchiveRequestSchema, catalogCarPatchSchema } from "@/lib/schemas/catalog";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const { id } = await params;
    const car = await findCatalogCarByIdOrSlug(id);
    if (!car) {
      return NextResponse.json({ error: "Автомобиль не найден" }, { status: 404 });
    }

    return NextResponse.json({ car });
  } catch (error) {
    console.error("Failed to load catalog car:", error);
    return NextResponse.json({ error: "Не удалось загрузить автомобиль" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const { id } = await params;
    const payload = await request.json();
    const parsed = catalogCarPatchSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: "Некорректные данные автомобиля" }, { status: 400 });
    }

    const updated = await updateCatalogCar(id, parsed.data);

    await writeAdminAuditLog({
      userId: authResult.auth.user.id,
      action: "admin.catalog.car.update",
      entityType: "catalog_car",
      entityId: updated.id,
      details: {
        slug: updated.slug,
      },
    });

    return NextResponse.json({ car: updated });
  } catch (error: any) {
    console.error("Failed to update catalog car:", error);
    return NextResponse.json({ error: error?.message || "Не удалось обновить автомобиль" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const { id } = await params;
    const payload = await request.json();
    const parsed = catalogArchiveRequestSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: "Некорректный запрос архивации" }, { status: 400 });
    }

    await archiveCatalogCar(id, parsed.data.archived);

    await writeAdminAuditLog({
      userId: authResult.auth.user.id,
      action: parsed.data.archived ? "admin.catalog.car.archive" : "admin.catalog.car.restore",
      entityType: "catalog_car",
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to archive catalog car:", error);
    return NextResponse.json({ error: error?.message || "Не удалось изменить статус архива" }, { status: 500 });
  }
}
