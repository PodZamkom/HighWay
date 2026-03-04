import { NextResponse } from 'next/server';
import { normalizeBitrixSettings, readBitrixSettings, resolveBitrixMethodUrl } from '@/lib/bitrixSettingsStore';

type AnyObject = Record<string, unknown>;

function resolveCustomHeaders(headers: Array<{ name: string; value: string; enabled: boolean }>) {
  const result: Record<string, string> = {};

  for (const item of headers) {
    const name = item.name.trim();
    if (!item.enabled || !name) continue;
    if (name.toLowerCase() === 'content-type') continue;
    result[name] = item.value ?? '';
  }

  return result;
}

function validateAdditionalFields(rawJson: string): string | null {
  try {
    const parsed = JSON.parse(rawJson || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return 'Дополнительные поля должны быть JSON-объектом';
    }
    return null;
  } catch {
    return 'Дополнительные поля содержат невалидный JSON';
  }
}

export async function POST(request: Request) {
  try {
    let payload: unknown = null;
    try {
      payload = await request.json();
    } catch {
      payload = null;
    }

    const settings = payload ? normalizeBitrixSettings(payload) : await readBitrixSettings();
    if (!settings.enabled) {
      return NextResponse.json({ success: false, error: 'Интеграция отключена (enabled=false)' }, { status: 400 });
    }

    if (!settings.webhookUrl) {
      return NextResponse.json({ success: false, error: 'Webhook URL не заполнен' }, { status: 400 });
    }

    const additionalFieldsIssue = validateAdditionalFields(settings.additionalFieldsJson);
    if (additionalFieldsIssue) {
      return NextResponse.json({ success: false, error: additionalFieldsIssue }, { status: 400 });
    }

    const fieldsMethodUrl = resolveBitrixMethodUrl(settings.webhookUrl, 'crm.lead.fields');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), settings.timeoutMs);

    let response: Response;
    try {
      response = await fetch(fieldsMethodUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...resolveCustomHeaders(settings.headers),
        },
        signal: controller.signal,
        cache: 'no-store',
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const rawBody = await response.text();
    let data: AnyObject = {};
    if (rawBody) {
      try {
        data = JSON.parse(rawBody) as AnyObject;
      } catch {
        data = { rawBody };
      }
    }

    const apiError = typeof data.error === 'string' ? data.error : '';
    const apiErrorDescription = typeof data.error_description === 'string' ? data.error_description : '';
    if (!response.ok || apiError) {
      return NextResponse.json(
        {
          success: false,
          error: apiErrorDescription || apiError || `Ошибка webhook (${response.status})`,
          status: response.status,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook доступен, метод crm.lead.fields отвечает корректно.',
    });
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      return NextResponse.json({ success: false, error: 'Таймаут запроса к Bitrix' }, { status: 504 });
    }

    console.error('Bitrix webhook test failed:', error);
    return NextResponse.json({ success: false, error: 'Не удалось проверить webhook' }, { status: 500 });
  }
}
