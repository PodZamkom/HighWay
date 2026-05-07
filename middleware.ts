import { NextResponse, type NextRequest } from "next/server";

const LEGACY_HOSTS = new Set([
  "highwaymotors.site",
  "www.highwaymotors.site",
]);

const CANONICAL_HOST = "edelivery.by";

export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").toLowerCase().split(":")[0] ?? "";

  if (LEGACY_HOSTS.has(host)) {
    const url = req.nextUrl.clone();
    url.host = CANONICAL_HOST;
    url.protocol = "https:";
    url.port = "";
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
