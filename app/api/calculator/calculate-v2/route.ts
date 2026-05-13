import { NextResponse } from 'next/server';
import { calculateV2 } from '@/lib/localCalculator';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const form = body?.form ?? body;
    const data = calculateV2(form);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Calculator v2 failed:', error);
    return NextResponse.json({ success: false, error: 'Не удалось выполнить расчёт' }, { status: 500 });
  }
}
