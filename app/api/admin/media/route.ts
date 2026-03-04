import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/admin/api";
import { listMediaAssets } from "@/lib/mediaRepository";
import { mediaListQuerySchema } from "@/lib/schemas/media";

export async function GET(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const parsed = mediaListQuerySchema.safeParse({
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Некорректные параметры запроса" }, { status: 400 });
    }

    const result = await listMediaAssets(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to list media assets:", error);
    return NextResponse.json({ error: "Не удалось загрузить файлы" }, { status: 500 });
  }
}
