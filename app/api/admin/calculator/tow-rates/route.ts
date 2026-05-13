import { NextResponse } from 'next/server';
import { requireAdminApiAuth } from '@/lib/admin/api';
import { listTowRates, replaceTowRates } from '@/lib/calculatorDb';
import type { TowRate, Warehouse } from '@/types/calculator';

export const runtime = 'nodejs';

const VALID_WAREHOUSES: Warehouse[] = ['NEW JERSEY', 'GEORGIA', 'TEXAS', 'CALIFORNIA'];

export async function GET(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const url = new URL(request.url);
    const state = url.searchParams.get('state') || undefined;
    const query = url.searchParams.get('q') || undefined;
    const items = listTowRates({ state, query, limit: 2000 });
    return NextResponse.json({ items });
  } catch (error) {
    console.error('Failed to list tow rates:', error);
    return NextResponse.json({ error: 'Не удалось загрузить тарифы эвакуатора' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const body = await request.json();
    const raw: unknown[] = Array.isArray(body?.items) ? body.items : [];
    const rows: TowRate[] = raw
      .map((r: any) => ({
        state: String(r?.state || '').trim(),
        city: String(r?.city || '').trim(),
        zip: r?.zip ? String(r.zip).trim() : null,
        copartCost: typeof r?.copartCost === 'number' ? r.copartCost : r?.copartCost === null ? null : Number(r?.copartCost) || null,
        iaaiCost: typeof r?.iaaiCost === 'number' ? r.iaaiCost : r?.iaaiCost === null ? null : Number(r?.iaaiCost) || null,
        warehouse: (VALID_WAREHOUSES.includes(String(r?.warehouse) as Warehouse) ? r.warehouse : 'NEW JERSEY') as Warehouse,
        isActive: true,
      }))
      .filter((r) => r.state && r.city);

    if (rows.length > 5000) {
      return NextResponse.json({ error: 'Слишком много строк (>5000)' }, { status: 400 });
    }

    replaceTowRates(rows);
    return NextResponse.json({ success: true, count: rows.length });
  } catch (error) {
    console.error('Failed to save tow rates:', error);
    return NextResponse.json({ error: 'Не удалось сохранить тарифы' }, { status: 500 });
  }
}
