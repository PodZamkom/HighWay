import { NextResponse } from 'next/server';
import { calculateLocalPrice } from '@/lib/localCalculator';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const form = body?.form ?? body;
    const data = calculateLocalPrice(form);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Локальный калькулятор завершился с ошибкой:', error);
    return NextResponse.json({ success: false, error: 'Не удалось выполнить расчет' }, { status: 500 });
  }
}
