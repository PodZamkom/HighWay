import { NextResponse } from "next/server";
import { adminLoginRequestSchema } from "@/lib/schemas/auth";
import {
  attachSessionCookie,
  createAdminSession,
  findAdminUserByLogin,
  verifyAdminPassword,
} from "@/lib/admin/auth";
import { checkRateLimit, resetRateLimit } from "@/lib/admin/rateLimit";
import { writeAdminAuditLog } from "@/lib/admin/audit";

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "unknown";
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = adminLoginRequestSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: "Неверный формат запроса" }, { status: 400 });
    }

    const login = parsed.data.login.trim();
    const password = parsed.data.password;
    const ip = getClientIp(request);
    const rateKey = `admin:login:${ip}:${login.toLowerCase()}`;

    const rate = checkRateLimit(rateKey, { maxAttempts: 8, windowMs: 15 * 60 * 1000 });
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: "Слишком много попыток входа. Повторите позже.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rate.retryAfterSeconds),
          },
        },
      );
    }

    const user = await findAdminUserByLogin(login);
    if (!user || !user.isActive) {
      return NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 });
    }

    const isValid = await verifyAdminPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 });
    }

    const sessionPayload = await createAdminSession({
      userId: user.id,
      login: user.login,
      ipAddress: ip,
      userAgent: request.headers.get("user-agent"),
    });

    resetRateLimit(rateKey);

    const response = NextResponse.json({
      session: sessionPayload.session,
      user: {
        id: user.id,
        login: user.login,
      },
    });

    attachSessionCookie(response, sessionPayload.token, sessionPayload.session.expiresAt);

    await writeAdminAuditLog({
      userId: user.id,
      action: "admin.auth.login",
      entityType: "session",
      entityId: sessionPayload.session.sessionId,
      details: {
        ip,
      },
    });

    return response;
  } catch (error) {
    console.error("Admin login failed:", error);
    return NextResponse.json({ error: "Не удалось выполнить вход" }, { status: 500 });
  }
}
