import { NextResponse } from "next/server";
import { catalogCarListQuerySchema } from "@/lib/schemas/catalog";
import { listCatalogCars } from "@/lib/catalogRepository";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const parsed = catalogCarListQuerySchema.safeParse({
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      market: searchParams.get("market") ?? undefined,
      availability: searchParams.get("availability") ?? undefined,
      includeArchived: searchParams.get("includeArchived") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Некорректные параметры запроса" }, { status: 400 });
    }

    const result = await listCatalogCars(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to load public cars API:", error);
    return NextResponse.json({ error: "Не удалось загрузить каталог" }, { status: 500 });
  }
}
