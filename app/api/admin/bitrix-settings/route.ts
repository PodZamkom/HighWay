import { NextResponse } from 'next/server';
import { requireAdminApiAuth } from '@/lib/admin/api';
import { normalizeBitrixSettings, readBitrixSettings, writeBitrixSettings } from '@/lib/bitrixSettingsStore';

function validateSettings(settings: ReturnType<typeof normalizeBitrixSettings>): string[] {
  const issues: string[] = [];

  if (settings.enabled && !settings.webhookUrl) {
    issues.push('Укажите webhook URL для Bitrix');
  }

  if (settings.webhookUrl) {
    try {
      new URL(settings.webhookUrl);
    } catch {
      issues.push('Webhook URL должен быть валидным абсолютным URL');
    }
  }

  try {
    const parsed = JSON.parse(settings.additionalFieldsJson || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      issues.push('Дополнительные поля должны быть объектом ключ-значение');
    }
  } catch {
    issues.push('Дополнительные поля заполнены некорректно');
  }

  return issues;
}

export async function GET(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const settings = await readBitrixSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error reading bitrix settings:', error);
    return NextResponse.json({ error: 'Failed to load bitrix settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authResult = await requireAdminApiAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const payload = (await request.json()) as unknown;
    const normalized = normalizeBitrixSettings(payload);
    const issues = validateSettings(normalized);

    if (issues.length > 0) {
      return NextResponse.json({ error: 'Validation failed', issues }, { status: 400 });
    }

    const settings = await writeBitrixSettings(normalized);
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Error saving bitrix settings:', error);
    return NextResponse.json({ error: 'Failed to save bitrix settings' }, { status: 500 });
  }
}
