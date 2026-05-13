import { NextResponse } from 'next/server';
import { calculateV2 } from '@/lib/localCalculator';
import { buildCalculatorPdfV2, type PdfMode } from '@/lib/calculatorPdf';
import type { CalculatorResultV2 } from '@/types/calculator';

export const runtime = 'nodejs';

function timestampForFileName() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${y}${m}${d}-${hh}${mm}`;
}

function isResultV2(value: unknown): value is CalculatorResultV2 {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<CalculatorResultV2>;
  return Array.isArray(v.stages) && typeof v.totalCost === 'number' && typeof v.total === 'number';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const form = body?.form ?? body;
    const mode: PdfMode = body?.mode === 'internal' ? 'internal' : 'client';
    const result = isResultV2(body?.result) ? body.result : calculateV2(form);

    const pdf = await buildCalculatorPdfV2(result, mode);
    const timestamp = timestampForFileName();
    const russianFileName = `расчет-${mode === 'internal' ? 'internal' : 'клиент'}-${timestamp}.pdf`;
    const asciiFallbackFileName = `raschet-${mode}-${timestamp}.pdf`;

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${asciiFallbackFileName}"; filename*=UTF-8''${encodeURIComponent(russianFileName)}`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('PDF v2 generation failed:', error);
    return NextResponse.json({ error: 'Не удалось сформировать документ' }, { status: 500 });
  }
}
