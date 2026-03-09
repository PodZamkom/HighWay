import { NextResponse } from "next/server";

export async function GET(request: Request) {
  return NextResponse.redirect(new URL("/novosti", request.url), 301);
}

export async function HEAD(request: Request) {
  return NextResponse.redirect(new URL("/novosti", request.url), 301);
}
