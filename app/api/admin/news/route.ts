import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/admin/api";
import { writeAdminAuditLog } from "@/lib/admin/audit";
import { createNewsPost, listNews } from "@/lib/news/newsAdminService";
import { newsAdminListQuerySchema, newsCreateSchema } from "@/lib/schemas/news";

export async function GET(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const { searchParams } = new URL(request.url);
    const parsed = newsAdminListQuerySchema.safeParse({
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      tag: searchParams.get("tag") ?? undefined,
      includeArchived: searchParams.get("includeArchived") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Некорректные параметры списка новостей" }, { status: 400 });
    }

    const result = await listNews({
      ...parsed.data,
      onlyPublished: false,
      includeArchived: parsed.data.includeArchived ?? true,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Failed to list admin news:", error);
    return NextResponse.json({ error: error?.message || "Не удалось загрузить новости" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const payload = await request.json();
    const parsed = newsCreateSchema.safeParse(payload?.post ?? payload);

    if (!parsed.success) {
      return NextResponse.json({ error: "Некорректные данные новости" }, { status: 400 });
    }

    const created = await createNewsPost(parsed.data, authResult.auth.user.id);

    await writeAdminAuditLog({
      userId: authResult.auth.user.id,
      action: "admin.news.create",
      entityType: "news_post",
      entityId: created.id,
      details: {
        slug: created.slug,
        status: created.status,
      },
    });

    return NextResponse.json({ post: created }, { status: 201 });
  } catch (error: any) {
    const duplicateSlug = error?.code === "23505";
    if (duplicateSlug) {
      return NextResponse.json({ error: "Новость с таким slug уже существует" }, { status: 409 });
    }

    console.error("Failed to create news post:", error);
    return NextResponse.json({ error: error?.message || "Не удалось создать новость" }, { status: 500 });
  }
}
