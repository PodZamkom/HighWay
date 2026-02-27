import type {
  ParseFileKind,
  ParsedPortsResult,
  ParsedRatesResult,
  PortRuleInput,
  RateRuleInput,
} from '@/types/calculator';

function extractJson(text: string) {
  const codeBlock = text.match(/```json\s*([\s\S]*?)```/i);
  const direct = codeBlock?.[1] ?? text;
  const firstBrace = direct.indexOf('{');
  const lastBrace = direct.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error('AI response does not contain valid JSON object.');
  }
  return JSON.parse(direct.slice(firstBrace, lastBrace + 1));
}

function toNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeRate(item: any): RateRuleInput {
  return {
    auction: String(item?.auction ?? 'Any').trim() || 'Any',
    platform: String(item?.platform ?? 'Any').trim() || 'Any',
    minPrice: toNumber(item?.minPrice, 0),
    maxPrice: toNumber(item?.maxPrice, 999999),
    route: String(item?.route ?? 'delivery_to_usa_port').trim() || 'delivery_to_usa_port',
    amount: toNumber(item?.amount, 0),
    currency: String(item?.currency ?? 'USD').toUpperCase() === 'BYN' ? 'BYN' : 'USD',
  };
}

function normalizePort(item: any): PortRuleInput {
  return {
    origin: String(item?.origin ?? 'usa_port').trim() || 'usa_port',
    destination: String(item?.destination ?? 'klaipeda').trim() || 'klaipeda',
    routeType: String(item?.routeType ?? 'sea').trim() || 'sea',
    cost: toNumber(item?.cost, 0),
    currency: String(item?.currency ?? 'USD').toUpperCase() === 'BYN' ? 'BYN' : 'USD',
  };
}

function buildPrompt(kind: ParseFileKind) {
  if (kind === 'rates') {
    return [
      'You are parsing shipping and auction rates from automotive logistics tables.',
      'Return STRICT JSON only with shape:',
      '{ "summary": string, "platforms": string[], "rates": [{ "auction": string, "platform": string, "minPrice": number, "maxPrice": number, "route": string, "amount": number, "currency": "USD"|"BYN" }] }',
      'route must be one of: auction_fee, delivery_to_usa_port.',
      'If values are missing, use auction/platform = "Any", minPrice=0, maxPrice=999999.',
      'Ignore rows unrelated to shipping/auction pricing.',
    ].join('\n');
  }

  return [
    'You are parsing sea and land port logistics tables.',
    'Return STRICT JSON only with shape:',
    '{ "summary": string, "platforms": string[], "ports": [{ "origin": string, "destination": string, "routeType": string, "cost": number, "currency": "USD"|"BYN" }] }',
    'routeType must be one of: sea, land.',
    'Use origin values like: usa_port, klaipeda, poti.',
    'Use destination values like: klaipeda, poti, by, ge, ru, pl etc.',
  ].join('\n');
}

async function callOpenAI(input: {
  model: string;
  text: string;
  kind: ParseFileKind;
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set.');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: input.model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: buildPrompt(input.kind) },
        {
          role: 'user',
          content: `Parse this dataset and extract normalized rules:\n\n${input.text.slice(0, 200000)}`,
        },
      ],
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || 'OpenAI request failed.');
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('OpenAI returned empty content.');
  }
  return content;
}

export async function parseRatesWithAI(input: {
  text: string;
  model: string;
}): Promise<ParsedRatesResult> {
  const content = await callOpenAI({ kind: 'rates', model: input.model, text: input.text });
  const parsed = extractJson(content);

  const rates = Array.isArray(parsed?.rates) ? parsed.rates.map(normalizeRate).filter((item: RateRuleInput) => item.amount > 0) : [];
  const platforms = Array.isArray(parsed?.platforms)
    ? parsed.platforms.map((item: unknown) => String(item).trim()).filter(Boolean)
    : [];

  return {
    summary: String(parsed?.summary ?? '').trim() || `Parsed ${rates.length} rate rules`,
    rates,
    platforms,
  };
}

export async function parsePortsWithAI(input: {
  text: string;
  model: string;
}): Promise<ParsedPortsResult> {
  const content = await callOpenAI({ kind: 'ports', model: input.model, text: input.text });
  const parsed = extractJson(content);

  const ports = Array.isArray(parsed?.ports) ? parsed.ports.map(normalizePort).filter((item: PortRuleInput) => item.cost > 0) : [];
  const platforms = Array.isArray(parsed?.platforms)
    ? parsed.platforms.map((item: unknown) => String(item).trim()).filter(Boolean)
    : [];

  return {
    summary: String(parsed?.summary ?? '').trim() || `Parsed ${ports.length} port rules`,
    ports,
    platforms,
  };
}
