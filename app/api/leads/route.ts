import { NextResponse } from 'next/server';
import { readBitrixSettings, resolveBitrixMethodUrl } from '@/lib/bitrixSettingsStore';
import { readAmocrmSettings } from '@/lib/amocrmSettingsStore';
import { readCrmProviderSettings } from '@/lib/crmProviderStore';
import { AmocrmError, createLead as createAmocrmLead } from '@/lib/amocrmClient';
import type { BitrixSettings } from '@/types/bitrix';
import type { AmocrmSettings } from '@/types/amocrm';

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

interface NormalizedLead {
  name: string;
  phone: string;
  preferredMessenger: string;
  source: string;
  pageUrl: string;
  comment: string;
}

function asTrimmedString(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

function normalizeMessenger(value: string): string {
  const normalized = value.toLowerCase();
  if (normalized === 'telegram') return 'Telegram';
  if (normalized === 'whatsapp') return 'WhatsApp';
  if (normalized === 'phone' || normalized === 'call' || normalized === 'telephone') return 'Телефон';
  return value;
}

function applyTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, variableName: string) => variables[variableName] || '');
}

function parseAdditionalFields(raw: unknown): AnyObject {
  let parsed: unknown = {};
  if (typeof raw === 'string') {
    parsed = JSON.parse(raw || '{}');
  } else {
    parsed = raw ?? {};
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Additional fields must be JSON object');
  }
  return parsed as AnyObject;
}

function resolveDealStageDefaults(additionalFields: AnyObject): { stageId: string; categoryId: number | null } {
  const rawCategory = additionalFields.CATEGORY_ID;
  let categoryId: number | null = null;
  if (typeof rawCategory === 'number' && Number.isFinite(rawCategory)) {
    categoryId = Math.trunc(rawCategory);
  } else if (typeof rawCategory === 'string' && rawCategory.trim()) {
    const parsed = Number(rawCategory.trim());
    if (Number.isFinite(parsed)) categoryId = Math.trunc(parsed);
  }

  const rawStage = additionalFields.STAGE_ID;
  const stageIdFromAdditional = typeof rawStage === 'string' ? rawStage.trim() : '';
  const defaultStageId = categoryId && categoryId > 0 ? `C${categoryId}:NEW` : 'NEW';

  return {
    stageId: stageIdFromAdditional || defaultStageId,
    categoryId,
  };
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

/* ----------------------------- BITRIX DISPATCH ---------------------------- */

type BitrixDispatchResult =
  | { success: true; dealId: unknown }
  | { success: false; error: string; status: number };

async function submitToBitrix(
  settings: BitrixSettings,
  lead: NormalizedLead,
): Promise<BitrixDispatchResult> {
  if (!settings.enabled) {
    return { success: false, error: 'Bitrix отключён', status: 503 };
  }
  if (!settings.webhookUrl) {
    return { success: false, error: 'Bitrix не настроен (нет webhook)', status: 500 };
  }

  const templateVars = {
    titlePrefix: settings.titlePrefix,
    source: lead.source,
    name: lead.name,
    phone: lead.phone,
    messenger: lead.preferredMessenger,
    contactMethod: lead.preferredMessenger,
    pageUrl: lead.pageUrl,
    comment: lead.comment,
  };

  const title = applyTemplate(settings.titleTemplate, templateVars).trim() || `${settings.titlePrefix}: ${lead.source}`;
  const sourceDescription = applyTemplate(settings.sourceDescriptionTemplate, templateVars).trim() || lead.source;
  const comments = applyTemplate(settings.commentsTemplate, templateVars).trim();
  const commentsWithContact = [
    `Имя: ${lead.name}`,
    `Телефон: ${lead.phone}`,
    comments,
  ].filter(Boolean).join('\n');

  let additionalFields: AnyObject = {};
  try {
    additionalFields = parseAdditionalFields(settings.additionalFieldsJson);
  } catch (error) {
    console.error('Invalid additionalFieldsJson:', error);
    return { success: false, error: 'Bitrix settings invalid', status: 500 };
  }

  const { stageId } = resolveDealStageDefaults(additionalFields);

  const fields: AnyObject = {
    TITLE: title,
    STAGE_ID: stageId,
    SOURCE_DESCRIPTION: sourceDescription,
    COMMENTS: commentsWithContact,
  };

  if (settings.sourceId) fields.SOURCE_ID = settings.sourceId;
  if (typeof settings.assignedById === 'number' && Number.isFinite(settings.assignedById) && settings.assignedById > 0) {
    fields.ASSIGNED_BY_ID = settings.assignedById;
  }
  Object.assign(fields, additionalFields);

  if (typeof fields.STAGE_ID !== 'string' || !fields.STAGE_ID.trim()) {
    fields.STAGE_ID = stageId;
  } else {
    fields.STAGE_ID = fields.STAGE_ID.trim();
  }

  const dealAddUrl = resolveBitrixMethodUrl(settings.webhookUrl, 'crm.deal.add');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), settings.timeoutMs);

  try {
    const response = await fetch(dealAddUrl, {
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
    });

    const rawPayload = await response.text();
    let payload: Record<string, unknown> = {};
    if (rawPayload) {
      try { payload = JSON.parse(rawPayload); } catch { payload = { rawPayload }; }
    }

    const payloadError = typeof payload.error === 'string' ? payload.error : '';
    const payloadErrorDescription = typeof payload.error_description === 'string' ? payload.error_description : '';

    if (!response.ok || payloadError) {
      console.error('Bitrix deal creation failed', {
        status: response.status,
        error: payloadError,
        errorDescription: payloadErrorDescription,
      });
      return {
        success: false,
        error: payloadErrorDescription || payloadError || 'CRM rejected deal request',
        status: 502,
      };
    }

    return { success: true, dealId: payload.result ?? null };
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      return { success: false, error: 'Bitrix request timed out', status: 504 };
    }
    console.error('Bitrix submit failed:', error);
    return { success: false, error: 'Failed to submit deal to Bitrix', status: 500 };
  } finally {
    clearTimeout(timeoutId);
  }
}

/* ----------------------------- AMOCRM DISPATCH ---------------------------- */

type AmocrmDispatchResult =
  | { success: true; leadId: number; contactId: number }
  | { success: false; error: string; status: number };

async function submitToAmocrm(
  settings: AmocrmSettings,
  lead: NormalizedLead,
): Promise<AmocrmDispatchResult> {
  if (!settings.enabled) {
    return { success: false, error: 'amoCRM отключён', status: 503 };
  }
  if (!settings.subdomain || !settings.accessToken) {
    return { success: false, error: 'amoCRM не настроен (поддомен/токен)', status: 500 };
  }

  try {
    const result = await createAmocrmLead(settings, lead);
    return { success: true, leadId: result.leadId, contactId: result.contactId };
  } catch (error) {
    if (error instanceof AmocrmError) {
      return { success: false, error: error.message, status: error.status };
    }
    console.error('amoCRM submit failed:', error);
    return { success: false, error: 'Failed to submit lead to amoCRM', status: 500 };
  }
}

/* -------------------------------- HANDLER --------------------------------- */

export async function POST(request: Request) {
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

    const lead: NormalizedLead = {
      name,
      phone,
      preferredMessenger: normalizeMessenger(preferredMessengerRaw || '-'),
      source,
      pageUrl,
      comment,
    };

    const providerSettings = await readCrmProviderSettings();
    const provider = providerSettings.provider;

    const results: Record<string, unknown> = {};
    const errors: Array<{ provider: string; error: string }> = [];

    if (provider === 'bitrix' || provider === 'both') {
      const bitrixSettings = await readBitrixSettings();
      const bitrixResult = await submitToBitrix(bitrixSettings, lead);
      if (bitrixResult.success === true) {
        results.bitrixDealId = bitrixResult.dealId;
      } else {
        errors.push({ provider: 'bitrix', error: bitrixResult.error });
      }
    }

    if (provider === 'amocrm' || provider === 'both') {
      const amocrmSettings = await readAmocrmSettings();
      const amocrmResult = await submitToAmocrm(amocrmSettings, lead);
      if (amocrmResult.success === true) {
        results.amocrmLeadId = amocrmResult.leadId;
        results.amocrmContactId = amocrmResult.contactId;
      } else {
        errors.push({ provider: 'amocrm', error: amocrmResult.error });
      }
    }

    const hasAnySuccess = Object.keys(results).length > 0;
    const allFailed = !hasAnySuccess && errors.length > 0;

    if (allFailed) {
      const firstError = errors[0];
      return NextResponse.json(
        { success: false, error: firstError.error, errors, provider },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      provider,
      ...results,
      ...(errors.length > 0 ? { partialErrors: errors } : {}),
    });
  } catch (error: any) {
    console.error('Lead submit failed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit lead' },
      { status: 500 },
    );
  }
}
