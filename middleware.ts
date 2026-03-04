import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin/constants";

function isPublicAdminPath(pathname: string): boolean {
  return pathname === "/admin/login";
}

function isPublicAdminApiPath(pathname: string): boolean {
  return pathname === "/api/admin/auth/login";
}

export function middleware(request: NextRequest) {
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
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
