import fs from 'fs/promises';
import path from 'path';
import type { BitrixHeaderSetting, BitrixPhoneType, BitrixSettings } from '@/types/bitrix';

const BITRIX_SETTINGS_FILE = path.join(process.cwd(), 'data', 'bitrix-settings.json');
const MIN_TIMEOUT_MS = 1000;
const MAX_TIMEOUT_MS = 30000;

function toStringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function toBooleanValue(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') return true;
    if (normalized === 'false' || normalized === '0') return false;
  }
  return fallback;
}

function toNumberValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizePhoneType(value: unknown, fallback: BitrixPhoneType): BitrixPhoneType {
  const normalized = toStringValue(value).toUpperCase();
  if (normalized === 'WORK' || normalized === 'MOBILE' || normalized === 'HOME' || normalized === 'FAX' || normalized === 'OTHER') {
    return normalized;
  }
  return fallback;
}

function normalizeHeaders(value: unknown): BitrixHeaderSetting[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const result: BitrixHeaderSetting[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const item = value[index];
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;

    const name = toStringValue(row.name).slice(0, 120);
    const headerValue = toStringValue(row.value).slice(0, 2000);
    const id = toStringValue(row.id) || `header_${Date.now()}_${index}`;

    if (!name && !headerValue) {
      continue;
    }

    result.push({
      id,
      name,
      value: headerValue,
      enabled: toBooleanValue(row.enabled, true),
    });
  }

  return result.slice(0, 20);
}

function resolveEnvLeadAddUrl(): string {
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

function normalizeAdditionalFields(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim() || '{}';
  }
  if (value && typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return '{}';
    }
  }
  return '{}';
}

export function defaultBitrixSettings(): BitrixSettings {
  const envAssignedById = toNumberValue(process.env.BITRIX_ASSIGNED_BY_ID);

  return {
    enabled: Boolean(resolveEnvLeadAddUrl()),
    webhookUrl: resolveEnvLeadAddUrl(),
    timeoutMs: 10000,
    headers: [],
    titlePrefix: process.env.BITRIX_LEAD_TITLE_PREFIX?.trim() || 'Заявка с сайта',
    titleTemplate: '{titlePrefix}: {source}',
    sourceId: process.env.BITRIX_SOURCE_ID?.trim() || 'WEB',
    assignedById: envAssignedById && envAssignedById > 0 ? Math.trunc(envAssignedById) : null,
    phoneType: 'WORK',
    sourceDescriptionTemplate: '{pageUrl}',
    commentsTemplate: 'Источник формы: {source}\nПредпочтительный мессенджер: {messenger}\nСтраница: {pageUrl}\nКомментарий: {comment}',
    additionalFieldsJson: '{}',
    registerSonetEvent: true,
  };
}

export function normalizeBitrixSettings(input: unknown): BitrixSettings {
  const defaults = defaultBitrixSettings();
  if (!input || typeof input !== 'object') {
    return defaults;
  }

  const value = input as Record<string, unknown>;
  const timeoutValue = toNumberValue(value.timeoutMs);
  const assignedByRaw = toNumberValue(value.assignedById);

  return {
    enabled: toBooleanValue(value.enabled, defaults.enabled),
    webhookUrl: toStringValue(value.webhookUrl),
    timeoutMs:
      timeoutValue && timeoutValue >= MIN_TIMEOUT_MS && timeoutValue <= MAX_TIMEOUT_MS
        ? Math.trunc(timeoutValue)
        : defaults.timeoutMs,
    headers: normalizeHeaders(value.headers),
    titlePrefix: toStringValue(value.titlePrefix) || defaults.titlePrefix,
    titleTemplate: toStringValue(value.titleTemplate) || defaults.titleTemplate,
    sourceId: toStringValue(value.sourceId) || defaults.sourceId,
    assignedById: assignedByRaw && assignedByRaw > 0 ? Math.trunc(assignedByRaw) : null,
    phoneType: normalizePhoneType(value.phoneType, defaults.phoneType),
    sourceDescriptionTemplate: toStringValue(value.sourceDescriptionTemplate) || defaults.sourceDescriptionTemplate,
    commentsTemplate: toStringValue(value.commentsTemplate) || defaults.commentsTemplate,
    additionalFieldsJson: normalizeAdditionalFields(value.additionalFieldsJson),
    registerSonetEvent: toBooleanValue(value.registerSonetEvent, defaults.registerSonetEvent),
  };
}

export function resolveBitrixMethodUrl(currentUrl: string, methodName: string): string {
  const normalized = currentUrl.trim();
  if (!normalized) {
    return '';
  }

  try {
    const parsed = new URL(normalized);
    const methodPath = `/${methodName}.json`;
    const isMethodUrl = /\/crm\.[^/]+\.json$/i.test(parsed.pathname);
    parsed.pathname = isMethodUrl
      ? parsed.pathname.replace(/\/crm\.[^/]+\.json$/i, methodPath)
      : `${parsed.pathname.replace(/\/+$/, '')}${methodPath}`;
    parsed.search = '';
    return parsed.toString();
  } catch {
    return normalized;
  }
}

export async function readBitrixSettings(): Promise<BitrixSettings> {
  try {
    const raw = await fs.readFile(BITRIX_SETTINGS_FILE, 'utf-8');
    return normalizeBitrixSettings(JSON.parse(raw));
  } catch (error: any) {
    if (error?.code !== 'ENOENT') {
      console.error('Failed to read bitrix settings, fallback to defaults:', error);
    }
    const fallback = defaultBitrixSettings();
    await writeBitrixSettings(fallback);
    return fallback;
  }
}

export async function writeBitrixSettings(nextSettings: unknown): Promise<BitrixSettings> {
  const normalized = normalizeBitrixSettings(nextSettings);
  await fs.writeFile(BITRIX_SETTINGS_FILE, `${JSON.stringify(normalized, null, 2)}\n`, 'utf-8');
  return normalized;
}
