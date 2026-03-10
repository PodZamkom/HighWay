import { NextResponse } from 'next/server';
import { requireAdminApiAuth } from '@/lib/admin/api';
import { BitrixHealthError, runBitrixHealthCheck } from '@/lib/bitrixHealth';
import { normalizeBitrixSettings, readBitrixSettings } from '@/lib/bitrixSettingsStore';

export async function POST(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    let payload: unknown = null;
    try {
      payload = await request.json();
    } catch {
      payload = null;
    }

    const settings = payload ? normalizeBitrixSettings(payload) : await readBitrixSettings();
    const result = await runBitrixHealthCheck(settings);
    return NextResponse.json({ success: true, message: result.message });
  } catch (error: any) {
    if (error instanceof BitrixHealthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }

    console.error('Bitrix webhook test failed:', error);
    return NextResponse.json({ success: false, error: 'Не удалось проверить webhook' }, { status: 500 });
  }
}
