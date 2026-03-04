import { NextResponse } from "next/server";
import { clearSessionCookie, destroyAdminSessionByToken, getAdminSessionFromRequest, getSessionTokenFromRequest } from "@/lib/admin/auth";
import { writeAdminAuditLog } from "@/lib/admin/audit";

export async function POST(request: Request) {
  try {
    const token = getSessionTokenFromRequest(request);
    const auth = await getAdminSessionFromRequest(request);

    if (token) {
      await destroyAdminSessionByToken(token);
    }

    const response = NextResponse.json({ success: true });
    clearSessionCookie(response);

    if (auth) {
      await writeAdminAuditLog({
        userId: auth.user.id,
        action: "admin.auth.logout",
        entityType: "session",
        entityId: auth.session.sessionId,
      });
    }

    return response;
  } catch (error) {
    console.error("Admin logout failed:", error);
    const response = NextResponse.json({ error: "Не удалось выполнить выход" }, { status: 500 });
    clearSessionCookie(response);
    return response;
  }
}
