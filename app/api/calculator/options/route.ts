import { NextResponse } from 'next/server';
import { getAgePresets } from '@/lib/localCalculator';
import { listPlatforms } from '@/lib/calculatorDb';
import { readSiteContent } from '@/lib/siteContentStore';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const site = await readSiteContent();
    const basePlatforms = listPlatforms();

    const platforms = basePlatforms.length > 0
      ? basePlatforms.map((name) => ({ key: name, name }))
      : [site.calculator.form.options.platformDefault];

    return NextResponse.json({
      transports: site.calculator.form.options.transports,
      auctions: site.calculator.form.options.auctions,
      deliveries: site.calculator.form.options.deliveries,
      platforms,
      agePresets: getAgePresets(),
    });
  } catch (error) {
    console.error('Failed to load calculator options:', error);
    return NextResponse.json({ error: 'Failed to load options' }, { status: 500 });
  }
}
