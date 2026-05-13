import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { readCalculatorConfig } from '@/lib/calculatorDb';
import type { AuctionKey, ParseUrlResult } from '@/types/calculator';

export const runtime = 'nodejs';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const RATE_LIMIT_WINDOW_MS = 5000;
const CACHE_TTL_MS = 60 * 60 * 1000;
const CACHE_LIMIT = 200;

const lastCallByIp = new Map<string, number>();
const urlCache = new Map<string, { at: number; result: ParseUrlResult }>();

function getIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip')?.trim() ||
    'unknown'
  );
}

function pruneCache() {
  const now = Date.now();
  for (const [key, value] of urlCache) {
    if (now - value.at > CACHE_TTL_MS) urlCache.delete(key);
  }
  while (urlCache.size > CACHE_LIMIT) {
    const firstKey = urlCache.keys().next().value;
    if (firstKey === undefined) break;
    urlCache.delete(firstKey);
  }
}

function isAllowedHost(url: string): { ok: boolean; auction: AuctionKey | null } {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.endsWith('copart.com')) return { ok: true, auction: 'COPART' };
    if (host.endsWith('iaai.com') || host.endsWith('iaai.it')) return { ok: true, auction: 'IAAI' };
    return { ok: false, auction: null };
  } catch {
    return { ok: false, auction: null };
  }
}

function extractCopart($: cheerio.CheerioAPI): Partial<ParseUrlResult> {
  const priceText =
    $('[data-uname="lotdetailSellingbiddetails"]').first().text() ||
    $('.lot-info-price, .lot-info__current-bid').first().text() ||
    '';
  const priceMatch = priceText.replace(/[, ]+/g, '').match(/\$?(\d+(?:\.\d+)?)/);
  const carPrice = priceMatch ? Number(priceMatch[1]) : null;

  const locationText =
    $('[data-uname="lotdetailLocationvalue"]').first().text().trim() ||
    $('.lot-info__location').first().text().trim() ||
    '';

  const titleText =
    $('[data-uname="lotdetailMakeModel"]').first().text().trim() ||
    $('h1').first().text().trim() ||
    '';
  const yearMatch = titleText.match(/(19|20)\d{2}/);
  const year = yearMatch ? Number(yearMatch[0]) : null;

  return {
    auction: 'COPART',
    carPrice: carPrice && carPrice > 0 ? carPrice : null,
    locationCity: locationText.split(',')[0]?.trim() || null,
    locationState: locationText.split(',')[1]?.trim().slice(0, 2).toUpperCase() || null,
    locationZip: null,
    year,
    engine: null,
  };
}

function extractIAAI($: cheerio.CheerioAPI): Partial<ParseUrlResult> {
  const headings = $('.heading-2').toArray();
  const titleText = headings[0] ? $(headings[0]).text().trim() : $('h1').first().text().trim();
  const yearMatch = titleText.match(/(19|20)\d{2}/);
  const year = yearMatch ? Number(yearMatch[0]) : null;

  let carPrice: number | null = null;
  let locationText = '';
  $('.data-list__value').each((_: number, el) => {
    const label = $(el).prev('.data-list__label').text().toLowerCase();
    const value = $(el).text().trim();
    if (!value) return;
    if (label.includes('current bid') || label.includes('bid')) {
      const m = value.replace(/[, ]+/g, '').match(/\$?(\d+(?:\.\d+)?)/);
      if (m && Number(m[1]) > 0) carPrice = Number(m[1]);
    }
    if (label.includes('location') || label.includes('branch')) {
      locationText = value;
    }
  });

  return {
    auction: 'IAAI',
    carPrice,
    locationCity: locationText.split(',')[0]?.trim() || null,
    locationState: locationText.split(',')[1]?.trim().slice(0, 2).toUpperCase() || null,
    locationZip: null,
    year,
    engine: null,
  };
}

async function fallbackOpenAi(html: string, auction: AuctionKey): Promise<Partial<ParseUrlResult>> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return {};
  const config = readCalculatorConfig();
  const model = config.policies.ai_model || 'gpt-4.1-mini';
  try {
    const trimmed = html.replace(/<script[\s\S]*?<\/script>/gi, '').slice(0, 12000);
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'Извлеки из HTML-страницы аукциона авто JSON c полями: carPrice (USD, number|null), locationCity (string|null), locationState (двухбуквенный код, string|null), year (number|null), engine (cc, number|null). Только JSON, без пояснений.',
          },
          { role: 'user', content: trimmed },
        ],
      }),
    });
    if (!res.ok) return {};
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return {};
    const parsed = JSON.parse(content);
    return {
      auction,
      carPrice: typeof parsed?.carPrice === 'number' ? parsed.carPrice : Number(parsed?.carPrice) || null,
      locationCity: parsed?.locationCity || null,
      locationState: parsed?.locationState ? String(parsed.locationState).toUpperCase().slice(0, 2) : null,
      locationZip: parsed?.locationZip || null,
      year: typeof parsed?.year === 'number' ? parsed.year : Number(parsed?.year) || null,
      engine: typeof parsed?.engine === 'number' ? parsed.engine : Number(parsed?.engine) || null,
    };
  } catch (cause) {
    console.error('OpenAI fallback failed:', cause);
    return {};
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const url = String(body?.url || '').trim();
    if (!url) {
      return NextResponse.json({ success: false, error: 'Не указан URL' }, { status: 400 });
    }

    const { ok, auction } = isAllowedHost(url);
    if (!ok || !auction) {
      return NextResponse.json(
        { success: false, error: 'Поддерживаются только ссылки copart.com и iaai.com' },
        { status: 400 },
      );
    }

    const ip = getIp(request);
    const now = Date.now();
    const last = lastCallByIp.get(ip) || 0;
    if (now - last < RATE_LIMIT_WINDOW_MS) {
      return NextResponse.json(
        { success: false, error: 'Слишком часто, подождите несколько секунд' },
        { status: 429 },
      );
    }
    lastCallByIp.set(ip, now);

    pruneCache();
    const cached = urlCache.get(url);
    if (cached && now - cached.at < CACHE_TTL_MS) {
      return NextResponse.json({ success: true, data: cached.result, cached: true });
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,ru;q=0.8',
      },
      redirect: 'follow',
    });
    const html = await response.text();
    const $ = cheerio.load(html);

    const primary = auction === 'COPART' ? extractCopart($) : extractIAAI($);
    let result: ParseUrlResult = {
      auction: primary.auction || auction,
      carPrice: primary.carPrice ?? null,
      locationCity: primary.locationCity ?? null,
      locationState: primary.locationState ?? null,
      locationZip: primary.locationZip ?? null,
      year: primary.year ?? null,
      engine: primary.engine ?? null,
      raw: {},
    };

    const missingMost = !result.carPrice && !result.locationCity && !result.locationState;
    if (missingMost) {
      const fallback = await fallbackOpenAi(html, auction);
      result = {
        auction: fallback.auction || result.auction,
        carPrice: fallback.carPrice ?? result.carPrice,
        locationCity: fallback.locationCity ?? result.locationCity,
        locationState: fallback.locationState ?? result.locationState,
        locationZip: fallback.locationZip ?? result.locationZip,
        year: fallback.year ?? result.year,
        engine: fallback.engine ?? result.engine,
        raw: { source: 'openai-fallback' },
      };
    }

    urlCache.set(url, { at: now, result });
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Parse URL failed:', error);
    return NextResponse.json(
      { success: false, error: 'Не удалось разобрать ссылку аукциона' },
      { status: 500 },
    );
  }
}
