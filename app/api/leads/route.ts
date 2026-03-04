import { NextResponse } from 'next/server';

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

function asTrimmedString(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().slice(0, maxLength);
}

function resolveBitrixLeadAddUrl(): string {
  const explicitUrl = process.env.BITRIX_LEAD_ADD_URL?.trim();
  if (explicitUrl) {
    return explicitUrl;
  }

  const webhookBase = process.env.BITRIX_WEBHOOK_URL?.trim();
  if (!webhookBase) {
    return '';
  }

  return `${webhookBase.replace(/\/+$/, '')}/crm.lead.add.json`;
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

export async function POST(request: Request) {
  const leadAddUrl = resolveBitrixLeadAddUrl();
  if (!leadAddUrl) {
    console.error('Bitrix lead URL is not configured');
    return NextResponse.json(
      { success: false, error: 'CRM integration is not configured' },
      { status: 500 },
    );
  }

  try {
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
    const titlePrefix = process.env.BITRIX_LEAD_TITLE_PREFIX?.trim() || 'Заявка с сайта';
    const sourceId = process.env.BITRIX_SOURCE_ID?.trim() || 'WEB';
    const assignedById = Number(process.env.BITRIX_ASSIGNED_BY_ID);

    const comments = [
      `Источник формы: ${source}`,
      `Предпочтительный мессенджер: ${preferredMessenger}`,
      pageUrl ? `Страница: ${pageUrl}` : '',
      comment ? `Комментарий: ${comment}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const fields: Record<string, unknown> = {
      TITLE: `${titlePrefix}: ${source}`,
      NAME: name,
      PHONE: [{ VALUE: phone, VALUE_TYPE: 'WORK' }],
      SOURCE_ID: sourceId,
      SOURCE_DESCRIPTION: pageUrl || source,
      COMMENTS: comments,
    };

    if (Number.isFinite(assignedById) && assignedById > 0) {
      fields.ASSIGNED_BY_ID = assignedById;
    }

    const response = await fetch(leadAddUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields,
        params: {
          REGISTER_SONET_EVENT: 'Y',
        },
      }),
      cache: 'no-store',
    });

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
        { success: false, error: 'CRM rejected lead request' },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true, leadId: payload.result ?? null });
  } catch (error) {
    console.error('Lead submit failed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit lead' },
      { status: 500 },
    );
  }
}
