import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/admin/api";
import { writeAdminAuditLog } from "@/lib/admin/audit";
import { createCatalogCar, CurrencyPolicyError, listCatalogCars } from "@/lib/catalogRepository";
import { catalogCarInputSchema, catalogCarListQuerySchema } from "@/lib/schemas/catalog";

export async function GET(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const { searchParams } = new URL(request.url);
    const parsedQuery = catalogCarListQuerySchema.safeParse({
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      market: searchParams.get("market") ?? undefined,
      availability: searchParams.get("availability") ?? undefined,
      includeArchived: searchParams.get("includeArchived") ?? undefined,
    });

    if (!parsedQuery.success) {
      return NextResponse.json({ error: "Некорректные параметры списка" }, { status: 400 });
    }

    const result = await listCatalogCars(parsedQuery.data);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to load catalog cars list:", error);
    return NextResponse.json({ error: "Не удалось загрузить список автомобилей" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const payload = await request.json();
    const parsed = catalogCarInputSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: "Некорректные данные автомобиля" }, { status: 400 });
    }

    const created = await createCatalogCar(parsed.data);

    await writeAdminAuditLog({
      userId: authResult.auth.user.id,
      action: "admin.catalog.car.create",
      entityType: "catalog_car",
      entityId: created.id,
      details: {
        slug: created.slug,
      },
    });

    return NextResponse.json({ car: created }, { status: 201 });
  } catch (error: any) {
    if (error instanceof CurrencyPolicyError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Failed to create catalog car:", error);
    return NextResponse.json({ error: error?.message || "Не удалось создать автомобиль" }, { status: 500 });
  }
}
