import { NextResponse } from 'next/server';
import { getAgePresets } from '@/lib/localCalculator';
import { listPlatforms, listTowRates } from '@/lib/calculatorDb';
import { readSiteContent } from '@/lib/siteContentStore';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const site = await readSiteContent();
    const basePlatforms = listPlatforms();

    const platforms = basePlatforms.length > 0
      ? basePlatforms.map((name) => ({ key: name, name }))
      : [site.calculator.form.options.platformDefault];

    const towRates = listTowRates({ limit: 1000 });
    const seenLocations = new Set<string>();
    const locations = towRates
      .map((row) => {
        const key = `${row.state}__${row.city}`;
        if (seenLocations.has(key)) return null;
        seenLocations.add(key);
        return {
          key,
          state: row.state,
          city: row.city,
          name: `${row.state} · ${row.city}`,
        };
      })
      .filter((x): x is { key: string; state: string; city: string; name: string } => Boolean(x))
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'));

    return NextResponse.json({
      transports: site.calculator.form.options.transports,
      auctions: site.calculator.form.options.auctions,
      deliveries: site.calculator.form.options.deliveries,
      platforms,
      locations,
      agePresets: getAgePresets(),
    });
  } catch (error) {
    console.error('Не удалось загрузить параметры калькулятора:', error);
    return NextResponse.json({ error: 'Не удалось загрузить параметры' }, { status: 500 });
  }
}
