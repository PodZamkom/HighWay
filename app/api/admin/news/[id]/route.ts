import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/admin/api";
import { writeAdminAuditLog } from "@/lib/admin/audit";
import { deleteNewsPost, findNewsById, updateNewsPost } from "@/lib/news/newsAdminService";
import { newsIdParamSchema, newsUpdateSchema } from "@/lib/schemas/news";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const { id } = await params;
    const parsedId = newsIdParamSchema.safeParse({ id });
    if (!parsedId.success) {
      return NextResponse.json({ error: "Новость не найдена" }, { status: 404 });
    }

    const post = await findNewsById(parsedId.data.id);
    if (!post) {
      return NextResponse.json({ error: "Новость не найдена" }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error: any) {
    console.error("Failed to load news post:", error);
    return NextResponse.json({ error: error?.message || "Не удалось загрузить новость" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const { id } = await params;
    const parsedId = newsIdParamSchema.safeParse({ id });
    if (!parsedId.success) {
      return NextResponse.json({ error: "Новость не найдена" }, { status: 404 });
    }

    const payload = await request.json();
    const parsedPatch = newsUpdateSchema.safeParse(payload?.post ?? payload);
    if (!parsedPatch.success) {
      return NextResponse.json({ error: "Некорректные данные новости" }, { status: 400 });
    }

    const updated = await updateNewsPost(parsedId.data.id, parsedPatch.data, authResult.auth.user.id);

    await writeAdminAuditLog({
      userId: authResult.auth.user.id,
      action: "admin.news.update",
      entityType: "news_post",
      entityId: updated.id,
      details: {
        slug: updated.slug,
        status: updated.status,
      },
    });

    return NextResponse.json({ post: updated });
  } catch (error: any) {
    const duplicateSlug = error?.code === "23505";
    if (duplicateSlug) {
      return NextResponse.json({ error: "Новость с таким slug уже существует" }, { status: 409 });
    }

    console.error("Failed to update news post:", error);
    return NextResponse.json({ error: error?.message || "Не удалось обновить новость" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const { id } = await params;
    const parsedId = newsIdParamSchema.safeParse({ id });
    if (!parsedId.success) {
      return NextResponse.json({ error: "Новость не найдена" }, { status: 404 });
    }

    await deleteNewsPost(parsedId.data.id);

    await writeAdminAuditLog({
      userId: authResult.auth.user.id,
      action: "admin.news.delete",
      entityType: "news_post",
      entityId: parsedId.data.id,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete news post:", error);
    return NextResponse.json({ error: error?.message || "Не удалось удалить новость" }, { status: 500 });
  }
}
