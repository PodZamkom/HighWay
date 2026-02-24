import { NextResponse } from "next/server";
import type { SiteContent } from "@/types/site";
import { readSiteContent, writeSiteContent } from "@/lib/siteContentStore";

export async function GET() {
  try {
    const content = await readSiteContent();
    return NextResponse.json(content);
  } catch (error) {
    console.error("Error reading site content:", error);
    return NextResponse.json({ error: "Failed to load site content" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const nextContent = (await request.json()) as SiteContent;
    await writeSiteContent(nextContent);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving site content:", error);
    return NextResponse.json({ error: "Failed to save site content" }, { status: 500 });
  }
}
