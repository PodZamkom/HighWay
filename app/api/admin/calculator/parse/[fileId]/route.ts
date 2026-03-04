import { NextResponse } from 'next/server';
import { requireAdminApiAuth } from '@/lib/admin/api';
import { parsePortsWithAI, parseRatesWithAI } from '@/lib/calculatorAi';
import { readCalculatorFileAsText } from '@/lib/calculatorFileReader';
import {
  addParseRun,
  getUploadedDocumentById,
  markUploadFailed,
  markUploadParsed,
  readCalculatorConfig,
  replacePlatforms,
  replacePortRules,
  replaceRateRules,
} from '@/lib/calculatorDb';

export const runtime = 'nodejs';

export async function POST(request: Request, context: { params: Promise<{ fileId: string }> }) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  const { fileId } = await context.params;
  const parsedId = Number(fileId);

  try {
    if (!Number.isFinite(parsedId) || parsedId <= 0) {
      return NextResponse.json({ error: 'Invalid file id' }, { status: 400 });
    }

    const file = getUploadedDocumentById(parsedId);
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const text = await readCalculatorFileAsText(file.path);
    if (!text.trim()) {
      throw new Error('Uploaded file is empty.');
    }

    const config = readCalculatorConfig();
    const model = config.policies.ai_model || 'gpt-4.1-mini';

    if (file.kind === 'rates') {
      const parsed = await parseRatesWithAI({ text, model });
      replaceRateRules(file.id, parsed.rates);
      replacePlatforms(parsed.platforms);
      markUploadParsed(file.id);
      addParseRun(file.id, 'parsed', parsed.summary, null);
      return NextResponse.json({ success: true, summary: parsed.summary, rates: parsed.rates.length, platforms: parsed.platforms.length });
    }

    const parsed = await parsePortsWithAI({ text, model });
    replacePortRules(file.id, parsed.ports);
    if (parsed.platforms.length > 0) {
      replacePlatforms(parsed.platforms);
    }
    markUploadParsed(file.id);
    addParseRun(file.id, 'parsed', parsed.summary, null);
    return NextResponse.json({ success: true, summary: parsed.summary, ports: parsed.ports.length, platforms: parsed.platforms.length });
  } catch (error: any) {
    if (Number.isFinite(parsedId) && parsedId > 0) {
      const message = error?.message || 'Parse failed';
      markUploadFailed(parsedId, message);
      addParseRun(parsedId, 'failed', 'Failed to parse uploaded file', message);
    }

    console.error('Calculator parse failed:', error);
    return NextResponse.json({ error: error?.message || 'Parse failed' }, { status: 500 });
  }
}
