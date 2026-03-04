import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/admin/api";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "admin");

function sanitizeFilename(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9._-]/g, "-");
}

export async function POST(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image uploads are allowed" }, { status: 400 });
    }

    const extension = path.extname(file.name) || ".bin";
    const baseName = path.basename(file.name, extension);
    const uniqueName = `${sanitizeFilename(baseName)}-${randomUUID()}${sanitizeFilename(extension)}`;
    const bytes = await file.arrayBuffer();

    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(path.join(UPLOAD_DIR, uniqueName), Buffer.from(bytes));

    return NextResponse.json({ success: true, path: `/uploads/admin/${uniqueName}` });
  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
