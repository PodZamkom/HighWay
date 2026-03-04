import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import argon2 from "argon2";
import { dbQuery, isDatabaseConfigured } from "@/lib/db";
import { ensureDatabaseReady } from "@/lib/db/ready";
import type { AdminSession } from "@/types/admin";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin/constants";
const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 8;

function getSessionSecret(): string {
  const secret = (process.env.SESSION_SECRET || "").trim();
  if (!secret) {
    return "local-dev-session-secret-change-me";
  }
  return secret;
}

function getSessionTtlSeconds(): number {
  const raw = Number(process.env.ADMIN_SESSION_TTL_SECONDS || DEFAULT_SESSION_TTL_SECONDS);
  if (!Number.isFinite(raw) || raw <= 0) {
    return DEFAULT_SESSION_TTL_SECONDS;
  }
  return Math.trunc(raw);
}

function hashSessionToken(token: string): string {
  const secret = getSessionSecret();
  return createHash("sha256").update(`${secret}:${token}`).digest("hex");
}

function parseCookieHeader(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  return cookieHeader.split(";").reduce<Record<string, string>>((acc, chunk) => {
    const [name, ...valueParts] = chunk.trim().split("=");
    if (!name) return acc;
    acc[name] = decodeURIComponent(valueParts.join("=") || "");
    return acc;
  }, {});
}

export function getSessionTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  const parsed = parseCookieHeader(cookieHeader);
  const token = parsed[ADMIN_SESSION_COOKIE];
  return token || null;
}

export async function verifyAdminPassword(password: string, passwordHash: string): Promise<boolean> {
  try {
    return await argon2.verify(passwordHash, password);
  } catch {
    return false;
  }
}

export async function findAdminUserByLogin(login: string): Promise<
  | {
      id: string;
      login: string;
      passwordHash: string;
      isActive: boolean;
    }
  | null
> {
  if (!isDatabaseConfigured()) return null;
  await ensureDatabaseReady();

  const response = await dbQuery<{
    id: string;
    login: string;
    password_hash: string;
    is_active: boolean;
  }>(
    `
      SELECT id, login, password_hash, is_active
      FROM admin_users
      WHERE login = $1
      LIMIT 1
    `,
    [login],
  );

  const row = response.rows[0];
  if (!row) return null;

  return {
    id: row.id,
    login: row.login,
    passwordHash: row.password_hash,
    isActive: row.is_active,
  };
}

export async function createAdminSession(params: {
  userId: string;
  login: string;
  ipAddress: string | null;
  userAgent: string | null;
}): Promise<{ token: string; session: AdminSession }> {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is not configured");
  }

  await ensureDatabaseReady();

  const token = randomBytes(32).toString("hex");
  const tokenHash = hashSessionToken(token);
  const ttlSeconds = getSessionTtlSeconds();
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  const insert = await dbQuery<{ id: string }>(
    `
      INSERT INTO admin_sessions (user_id, token_hash, ip_address, user_agent, expires_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `,
    [params.userId, tokenHash, params.ipAddress, params.userAgent, expiresAt.toISOString()],
  );

  return {
    token,
    session: {
      sessionId: insert.rows[0]?.id || "",
      userId: params.userId,
      login: params.login,
      expiresAt: expiresAt.toISOString(),
    },
  };
}

export async function destroyAdminSessionByToken(token: string): Promise<void> {
  if (!isDatabaseConfigured()) return;
  await ensureDatabaseReady();

  const tokenHash = hashSessionToken(token);
  await dbQuery(`DELETE FROM admin_sessions WHERE token_hash = $1`, [tokenHash]);
}

export async function findAdminSessionByToken(token: string): Promise<
  | {
      session: AdminSession;
      user: { id: string; login: string };
    }
  | null
> {
  if (!isDatabaseConfigured()) return null;
  await ensureDatabaseReady();

  const tokenHash = hashSessionToken(token);
  const response = await dbQuery<{
    session_id: string;
    user_id: string;
    login: string;
    expires_at: string;
  }>(
    `
      SELECT
        s.id AS session_id,
        s.user_id,
        u.login,
        s.expires_at
      FROM admin_sessions s
      JOIN admin_users u ON u.id = s.user_id
      WHERE s.token_hash = $1
        AND s.expires_at > NOW()
        AND u.is_active = TRUE
      LIMIT 1
    `,
    [tokenHash],
  );

  const row = response.rows[0];
  if (!row) {
    return null;
  }

  return {
    session: {
      sessionId: row.session_id,
      userId: row.user_id,
      login: row.login,
      expiresAt: row.expires_at,
    },
    user: {
      id: row.user_id,
      login: row.login,
    },
  };
}

export function attachSessionCookie(response: NextResponse, token: string, expiresAtIso: string) {
  const secure = process.env.NODE_ENV === "production";
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAtIso),
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
}

export async function getAdminSessionFromRequest(request: Request) {
  const token = getSessionTokenFromRequest(request);
  if (!token) return null;
  return findAdminSessionByToken(token);
}

export async function getAdminSessionFromServerContext() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  return findAdminSessionByToken(token);
}

export async function requireAdminSession(request: Request) {
  const auth = await getAdminSessionFromRequest(request);
  if (!auth) {
    throw new Error("UNAUTHORIZED");
  }
  return auth;
}

export async function cleanupExpiredAdminSessions(): Promise<void> {
  if (!isDatabaseConfigured()) return;
  await ensureDatabaseReady();
  await dbQuery(`DELETE FROM admin_sessions WHERE expires_at <= NOW()`);
}
