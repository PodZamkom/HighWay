import { NextResponse } from 'next/server';
import { readBitrixSettings, resolveBitrixMethodUrl } from '@/lib/bitrixSettingsStore';

export const runtime = 'nodejs';

type LeadRequestBody = {
  name?: unknown;
  phone?: unknown;
  preferredMessenger?: unknown;
  source?: unknown;
  pageUrl?: unknown;
  page?: unknown;
  comment?: unknown;
};

type AnyObject = Record<string, unknown>;

function asTrimmedString(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().slice(0, maxLength);
}

function normalizeMessenger(value: string): string {
  const normalized = value.toLowerCase();
  if (normalized === 'telegram') {
    return 'Telegram';
  }
  if (normalized === 'whatsapp') {
    return 'WhatsApp';
  }
  return value;
}

function applyTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, variableName: string) => variables[variableName] || '');
}

function parseAdditionalFields(raw: string): AnyObject {
  const parsed = JSON.parse(raw || '{}');
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Additional fields must be JSON object');
  }
  return parsed as AnyObject;
}

function resolveCustomHeaders(headers: Array<{ name: string; value: string; enabled: boolean }>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const item of headers) {
    if (!item.enabled) continue;
    const name = item.name.trim();
    if (!name) continue;
    if (name.toLowerCase() === 'content-type') continue;
    result[name] = item.value ?? '';
  }
  return result;
}

export async function POST(request: Request) {
  try {
    const settings = await readBitrixSettings();
    if (!settings.enabled) {
      return NextResponse.json(
        { success: false, error: 'CRM integration is disabled' },
        { status: 503 },
      );
    }

    if (!settings.webhookUrl) {
      return NextResponse.json(
        { success: false, error: 'CRM integration is not configured' },
        { status: 500 },
      );
    }

    const body = (await request.json()) as LeadRequestBody;
    const name = asTrimmedString(body.name, 100);
    const phone = asTrimmedString(body.phone, 50);
    const preferredMessengerRaw = asTrimmedString(body.preferredMessenger, 50);
    const source = asTrimmedString(body.source, 150) || 'site_form';
    const pageUrl = asTrimmedString(body.pageUrl ?? body.page, 500);
    const comment = asTrimmedString(body.comment, 1000);

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, error: 'Name and phone are required' },
        { status: 400 },
      );
    }

    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 7) {
      return NextResponse.json(
        { success: false, error: 'Phone format looks invalid' },
        { status: 400 },
      );
    }

    const preferredMessenger = normalizeMessenger(preferredMessengerRaw || '-');
    const templateVars = {
      titlePrefix: settings.titlePrefix,
      source,
      name,
      phone,
      messenger: preferredMessenger,
      pageUrl,
      comment,
    };

    const title = applyTemplate(settings.titleTemplate, templateVars).trim() || `${settings.titlePrefix}: ${source}`;
    const sourceDescription = applyTemplate(settings.sourceDescriptionTemplate, templateVars).trim() || source;
    const comments = applyTemplate(settings.commentsTemplate, templateVars).trim();

    const fields: AnyObject = {
      TITLE: title,
      NAME: name,
      PHONE: [{ VALUE: phone, VALUE_TYPE: settings.phoneType }],
      SOURCE_DESCRIPTION: sourceDescription,
    };

    if (settings.sourceId) {
      fields.SOURCE_ID = settings.sourceId;
    }
    if (comments) {
      fields.COMMENTS = comments;
    }
    if (typeof settings.assignedById === 'number' && Number.isFinite(settings.assignedById) && settings.assignedById > 0) {
      fields.ASSIGNED_BY_ID = settings.assignedById;
    }

    try {
      Object.assign(fields, parseAdditionalFields(settings.additionalFieldsJson));
    } catch (error) {
      console.error('Invalid additionalFieldsJson:', error);
      return NextResponse.json(
        { success: false, error: 'CRM settings are invalid' },
        { status: 500 },
      );
    }

    const leadAddUrl = resolveBitrixMethodUrl(settings.webhookUrl, 'crm.lead.add');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), settings.timeoutMs);

    const response = await fetch(leadAddUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...resolveCustomHeaders(settings.headers),
      },
      body: JSON.stringify({
        fields,
        params: {
          REGISTER_SONET_EVENT: settings.registerSonetEvent ? 'Y' : 'N',
        },
      }),
      signal: controller.signal,
      cache: 'no-store',
    }).finally(() => clearTimeout(timeoutId));

    const rawPayload = await response.text();
    let payload: Record<string, unknown> = {};
    if (rawPayload) {
      try {
        payload = JSON.parse(rawPayload);
      } catch {
        payload = { rawPayload };
      }
    }

    const payloadError = typeof payload.error === 'string' ? payload.error : '';
    const payloadErrorDescription = typeof payload.error_description === 'string' ? payload.error_description : '';
    if (!response.ok || payloadError) {
      console.error('Bitrix lead creation failed', {
        status: response.status,
        error: payloadError,
        errorDescription: payloadErrorDescription,
      });

      return NextResponse.json(
        { success: false, error: payloadErrorDescription || payloadError || 'CRM rejected lead request' },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true, leadId: payload.result ?? null });
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      return NextResponse.json(
        { success: false, error: 'CRM request timed out' },
        { status: 504 },
      );
    }

    console.error('Lead submit failed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit lead' },
      { status: 500 },
    );
  }
}
