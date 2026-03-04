import { NextResponse } from 'next/server';
import { calculateLocalPrice } from '@/lib/localCalculator';
import { buildCalculatorPdf } from '@/lib/calculatorPdf';

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const form = body?.form ?? body;
    const result = calculateLocalPrice(form);
    const pdf = await buildCalculatorPdf(result);

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="E-TRADE-calculation-${timestampForFileName()}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('PDF generation failed:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
