import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin/constants";

const LEGACY_HOSTS = new Set(["highwaymotors.site", "www.highwaymotors.site"]);
const CANONICAL_HOST = "edelivery.by";

function isPublicAdminPath(pathname: string): boolean {
  return pathname === "/admin/login";
}

function isPublicAdminApiPath(pathname: string): boolean {
  return (
    pathname === "/api/admin/auth/login" ||
    pathname === "/api/admin/amocrm-settings/import-from-amocrm"
  );
}

export function proxy(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").toLowerCase().split(":")[0] ?? "";
  if (LEGACY_HOSTS.has(host)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.host = CANONICAL_HOST;
    redirectUrl.protocol = "https:";
    redirectUrl.port = "";
    return NextResponse.redirect(redirectUrl, 301);
  }

  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (isPublicAdminPath(pathname)) {
      return NextResponse.next();
    }

    const sessionCookie = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!sessionCookie) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/admin/login";
      redirectUrl.searchParams.set("next", `${pathname}${search}`);
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
  }

  if (pathname.startsWith("/api/admin")) {
    if (isPublicAdminApiPath(pathname)) {
      return NextResponse.next();
    }

    const sessionCookie = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
