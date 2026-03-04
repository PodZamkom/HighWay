import { NextResponse } from 'next/server';
import { requireAdminApiAuth } from '@/lib/admin/api';
import {
  listPlatforms,
  listUploadedDocuments,
  readCalculatorConfig,
  writeCalculatorConfig,
} from '@/lib/calculatorDb';
import { DEFAULT_CALCULATOR_CONFIG } from '@/lib/calculatorDefaults';

export const runtime = 'nodejs';

function sanitizeNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function GET(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const config = readCalculatorConfig();
    const uploads = listUploadedDocuments();
    const platforms = listPlatforms();

    return NextResponse.json({
      config,
      uploads,
      platforms,
    });
  } catch (error) {
    console.error('Error reading calculator settings:', error);
    return NextResponse.json({ error: 'Failed to load calculator settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const body = await request.json();
    const source = body?.config ?? body;

    const nextConfig = {
      rates: {
        usd_byn: sanitizeNumber(source?.rates?.usd_byn, DEFAULT_CALCULATOR_CONFIG.rates.usd_byn),
        eur_usd: sanitizeNumber(source?.rates?.eur_usd, DEFAULT_CALCULATOR_CONFIG.rates.eur_usd),
      },
      fallback: {
        auction_fee_usd: sanitizeNumber(
          source?.fallback?.auction_fee_usd,
          DEFAULT_CALCULATOR_CONFIG.fallback.auction_fee_usd,
        ),
        delivery_to_usa_port_usd: sanitizeNumber(
          source?.fallback?.delivery_to_usa_port_usd,
          DEFAULT_CALCULATOR_CONFIG.fallback.delivery_to_usa_port_usd,
        ),
        ocean_to_klaipeda_usd: sanitizeNumber(
          source?.fallback?.ocean_to_klaipeda_usd,
          DEFAULT_CALCULATOR_CONFIG.fallback.ocean_to_klaipeda_usd,
        ),
        ocean_to_poti_usd: sanitizeNumber(
          source?.fallback?.ocean_to_poti_usd,
          DEFAULT_CALCULATOR_CONFIG.fallback.ocean_to_poti_usd,
        ),
        klaipeda_to_minsk_usd: sanitizeNumber(
          source?.fallback?.klaipeda_to_minsk_usd,
          DEFAULT_CALCULATOR_CONFIG.fallback.klaipeda_to_minsk_usd,
        ),
        poti_to_georgia_usd: sanitizeNumber(
          source?.fallback?.poti_to_georgia_usd,
          DEFAULT_CALCULATOR_CONFIG.fallback.poti_to_georgia_usd,
        ),
        customs_fee_byn: sanitizeNumber(
          source?.fallback?.customs_fee_byn,
          DEFAULT_CALCULATOR_CONFIG.fallback.customs_fee_byn,
        ),
        recycling_0_3_byn: sanitizeNumber(
          source?.fallback?.recycling_0_3_byn,
          DEFAULT_CALCULATOR_CONFIG.fallback.recycling_0_3_byn,
        ),
        recycling_3_5_byn: sanitizeNumber(
          source?.fallback?.recycling_3_5_byn,
          DEFAULT_CALCULATOR_CONFIG.fallback.recycling_3_5_byn,
        ),
        recycling_5_7_byn: sanitizeNumber(
          source?.fallback?.recycling_5_7_byn,
          DEFAULT_CALCULATOR_CONFIG.fallback.recycling_5_7_byn,
        ),
        recycling_7_plus_byn: sanitizeNumber(
          source?.fallback?.recycling_7_plus_byn,
          DEFAULT_CALCULATOR_CONFIG.fallback.recycling_7_plus_byn,
        ),
      },
      costs: {
        our_services_byn: sanitizeNumber(
          source?.costs?.our_services_byn,
          DEFAULT_CALCULATOR_CONFIG.costs.our_services_byn,
        ),
        svh_byn: sanitizeNumber(source?.costs?.svh_byn, DEFAULT_CALCULATOR_CONFIG.costs.svh_byn),
      },
      margins: {
        minsk_byn: sanitizeNumber(source?.margins?.minsk_byn, DEFAULT_CALCULATOR_CONFIG.margins.minsk_byn),
        klaipeda_byn: sanitizeNumber(
          source?.margins?.klaipeda_byn,
          DEFAULT_CALCULATOR_CONFIG.margins.klaipeda_byn,
        ),
        georgia_byn: sanitizeNumber(
          source?.margins?.georgia_byn,
          DEFAULT_CALCULATOR_CONFIG.margins.georgia_byn,
        ),
      },
      policies: {
        ai_model:
          typeof source?.policies?.ai_model === 'string' && source.policies.ai_model.trim()
            ? source.policies.ai_model.trim()
            : DEFAULT_CALCULATOR_CONFIG.policies.ai_model,
      },
    };

    writeCalculatorConfig(nextConfig);
    return NextResponse.json({ success: true, config: nextConfig });
  } catch (error) {
    console.error('Error saving calculator settings:', error);
    return NextResponse.json({ error: 'Failed to save calculator settings' }, { status: 500 });
  }
}
