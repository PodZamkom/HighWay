import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { createUploadedDocument } from '@/lib/calculatorDb';
import type { ParseFileKind } from '@/types/calculator';

export const runtime = 'nodejs';

const UPLOAD_DIR = path.join(process.cwd(), 'runtime', 'uploads', 'calculator');
const ALLOWED_EXTENSIONS = new Set(['.xlsx', '.xls', '.csv', '.txt']);

function sanitizeFilename(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9._-]/g, '-');
}

function inferKind(value: FormDataEntryValue | null): ParseFileKind {
  const kind = String(value || '').trim();
  return kind === 'ports' ? 'ports' : 'rates';
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const kind = inferKind(formData.get('kind'));

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json({ error: 'Only XLSX/XLS/CSV/TXT are allowed' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const baseName = sanitizeFilename(path.basename(file.name, ext));
    const uniqueName = `${baseName}-${randomUUID()}${ext}`;

    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const fullPath = path.join(UPLOAD_DIR, uniqueName);
    await fs.writeFile(fullPath, Buffer.from(bytes));

    const docId = createUploadedDocument({
      kind,
      path: fullPath,
      originalName: file.name,
      mime: file.type || 'application/octet-stream',
    });

    return NextResponse.json({
      success: true,
      id: docId,
      kind,
      path: fullPath,
      originalName: file.name,
    });
  } catch (error) {
    console.error('Calculator upload failed:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
