import { NextResponse } from 'next/server';
import { requireAdminApiAuth } from '@/lib/admin/api';
import { readStageMargins, writeStageMargins } from '@/lib/calculatorDb';
import type { CalcStageKey, StageMargin } from '@/types/calculator';

export const runtime = 'nodejs';

const VALID_STAGES: CalcStageKey[] = [
  'auction_price',
  'auction_fee',
  'tow',
  'ocean',
  'land',
  'customs',
  'util',
];

export async function GET(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    return NextResponse.json({ items: readStageMargins() });
  } catch (error) {
    console.error('Failed to read stage margins:', error);
    return NextResponse.json({ error: 'Не удалось загрузить маржу' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const body = await request.json();
    const raw: unknown[] = Array.isArray(body?.items) ? body.items : [];
    const rows: StageMargin[] = raw
      .filter((r: any) => VALID_STAGES.includes(r?.stage as CalcStageKey))
      .map((r: any): StageMargin => ({
        stage: r.stage as CalcStageKey,
        marginUsd: Number(r?.marginUsd) || 0,
        enabled: r?.enabled !== false,
      }));

    writeStageMargins(rows);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save stage margins:', error);
    return NextResponse.json({ error: 'Не удалось сохранить маржу' }, { status: 500 });
  }
}
