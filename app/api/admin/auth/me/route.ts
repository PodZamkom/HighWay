import { NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/admin/auth";

export async function GET(request: Request) {
  try {
    const auth = await getAdminSessionFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      user: auth.user,
      session: auth.session,
    });
  } catch (error) {
    console.error("Failed to read admin session:", error);
    return NextResponse.json({ error: "Не удалось получить данные сессии" }, { status: 500 });
  }
}
