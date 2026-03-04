import { NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/admin/auth";

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function requireAdminApiAuth(request: Request) {
  const auth = await getAdminSessionFromRequest(request);
  if (!auth) {
    return { ok: false as const, response: unauthorizedResponse() };
  }
  return { ok: true as const, auth };
}
