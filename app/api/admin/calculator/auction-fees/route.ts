import { NextResponse } from 'next/server';
import { requireAdminApiAuth } from '@/lib/admin/api';
import { listAuctionFeeBrackets, replaceAuctionFeeBrackets } from '@/lib/calculatorDb';
import type { AuctionFeeBracket, AuctionKey } from '@/types/calculator';

export const runtime = 'nodejs';

const VALID_AUCTIONS: AuctionKey[] = ['COPART', 'IAAI', 'MANHEIM'];

export async function GET(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    return NextResponse.json({ items: listAuctionFeeBrackets() });
  } catch (error) {
    console.error('Failed to list auction fees:', error);
    return NextResponse.json({ error: 'Не удалось загрузить аукционные сборы' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const body = await request.json();
    const raw: unknown[] = Array.isArray(body?.items) ? body.items : [];
    const rows: AuctionFeeBracket[] = raw
      .map((r: any): AuctionFeeBracket => ({
        auction: (VALID_AUCTIONS.includes(String(r?.auction).toUpperCase() as AuctionKey)
          ? String(r.auction).toUpperCase()
          : 'COPART') as AuctionKey,
        minPrice: Number(r?.minPrice) || 0,
        maxPrice: Number(r?.maxPrice) || 0,
        flatFee: r?.flatFee === null || r?.flatFee === undefined ? null : Number(r.flatFee) || null,
        pctFee: r?.pctFee === null || r?.pctFee === undefined ? null : Number(r.pctFee) || null,
        internetBidFee: Number(r?.internetBidFee) || 0,
        serviceFee: Number(r?.serviceFee) || 0,
      }))
      .filter((r) => r.maxPrice > r.minPrice && (r.flatFee !== null || r.pctFee !== null));

    replaceAuctionFeeBrackets(rows);
    return NextResponse.json({ success: true, count: rows.length });
  } catch (error) {
    console.error('Failed to save auction fees:', error);
    return NextResponse.json({ error: 'Не удалось сохранить аукционные сборы' }, { status: 500 });
  }
}
