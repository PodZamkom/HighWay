import { NextResponse } from "next/server";
import { inferMimeFromKey, readLocalAsset } from "@/lib/localMediaStorage";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path: parts } = await context.params;
  if (!parts || parts.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const key = parts.map((segment) => decodeURIComponent(segment)).join("/");
  if (key.includes("..")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const asset = await readLocalAsset(key);
  if (!asset) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(asset.data, {
    status: 200,
    headers: {
      "Content-Type": inferMimeFromKey(key),
      "Content-Length": String(asset.size),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
