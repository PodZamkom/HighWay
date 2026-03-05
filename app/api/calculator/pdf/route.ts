import { NextResponse } from 'next/server';
import { calculateLocalPrice } from '@/lib/localCalculator';
import { buildCalculatorPdf } from '@/lib/calculatorPdf';
import type { CalculatorResultPayload } from '@/types/calculator';

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

function isCalculatorResultPayload(value: unknown): value is CalculatorResultPayload {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<CalculatorResultPayload>;
  const isLineItem = (line: unknown) => {
    if (!line || typeof line !== 'object') return false;
    const item = line as { label?: unknown; value?: unknown; currency?: unknown };
    return typeof item.label === 'string' && typeof item.value === 'number' && (item.currency === 'USD' || item.currency === 'BYN');
  };

  return Boolean(
    isLineItem(candidate.carPrice) &&
      isLineItem(candidate.auctionFee) &&
      isLineItem(candidate.deliveryToPortUSA) &&
      isLineItem(candidate.deliveryFromPortUSA) &&
      isLineItem(candidate.fromKlaipeda) &&
      isLineItem(candidate.ourServicePrice) &&
      isLineItem(candidate.customDuty) &&
      isLineItem(candidate.customFee) &&
      isLineItem(candidate.junkFee) &&
      isLineItem(candidate.svxServicePrice) &&
      isLineItem(candidate.total),
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const form = body?.form ?? body;
    const result = isCalculatorResultPayload(body?.result) ? body.result : calculateLocalPrice(form);
    const pdf = await buildCalculatorPdf(result);
    const timestamp = timestampForFileName();
    const russianFileName = `расчет-стоимости-${timestamp}.pdf`;
    const asciiFallbackFileName = `raschet-stoimosti-${timestamp}.pdf`;

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${asciiFallbackFileName}"; filename*=UTF-8''${encodeURIComponent(russianFileName)}`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Ошибка генерации PDF:', error);
    return NextResponse.json({ error: 'Не удалось сформировать документ' }, { status: 500 });
  }
}
