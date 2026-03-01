import { NextResponse } from "next/server";
import type { AdminContentPagesResponse } from "@/types/content-pages";
import {
  readContentPages,
  readSiteSeo,
  validateContentPagesUpdateRequest,
  writeContentPagesAndSeo,
} from "@/lib/contentPagesStore";

export async function GET() {
  try {
    const [pages, globalSeo] = await Promise.all([readContentPages(), readSiteSeo()]);
    const response: AdminContentPagesResponse = { pages, globalSeo };
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error reading content pages payload:", error);
    return NextResponse.json({ error: "Failed to load content pages" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as unknown;
    const validation = validateContentPagesUpdateRequest(payload);
    if (validation.ok === false) {
      return NextResponse.json(
        {
          error: "Validation failed",
          issues: validation.errors,
        },
        { status: 400 },
      );
    }

    await writeContentPagesAndSeo(validation.value.pages, validation.value.globalSeo);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving content pages payload:", error);
    return NextResponse.json({ error: "Failed to save content pages" }, { status: 500 });
  }
}
