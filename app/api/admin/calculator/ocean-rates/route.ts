import { NextResponse } from 'next/server';
import { requireAdminApiAuth } from '@/lib/admin/api';
import { listOceanRates, replaceOceanRates } from '@/lib/calculatorDb';
import type { OceanRate, OceanRoute, UsPort } from '@/types/calculator';

export const runtime = 'nodejs';

const VALID_PORTS: UsPort[] = ['Newark', 'Savannah', 'Houston', 'Long Beach'];
const VALID_ROUTES: OceanRoute[] = ['klaipeda', 'poti'];

export async function GET(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    return NextResponse.json({ items: listOceanRates() });
  } catch (error) {
    console.error('Failed to list ocean rates:', error);
    return NextResponse.json({ error: 'Не удалось загрузить морские тарифы' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const body = await request.json();
    const raw: unknown[] = Array.isArray(body?.items) ? body.items : [];
    const rows: OceanRate[] = raw
      .map((r: any): OceanRate => ({
        port: (VALID_PORTS.includes(String(r?.port) as UsPort) ? r.port : 'Newark') as UsPort,
        destination: (VALID_ROUTES.includes(String(r?.destination) as OceanRoute) ? r.destination : 'klaipeda') as OceanRoute,
        hazmat: Boolean(r?.hazmat),
        cost: Number(r?.cost) || 0,
        currency: 'USD',
      }))
      .filter((r) => r.cost > 0);

    replaceOceanRates(rows);
    return NextResponse.json({ success: true, count: rows.length });
  } catch (error) {
    console.error('Failed to save ocean rates:', error);
    return NextResponse.json({ error: 'Не удалось сохранить морские тарифы' }, { status: 500 });
  }
}
