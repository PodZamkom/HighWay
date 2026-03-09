'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { FileText, Link2, Loader2, Plus, Save, Settings2, Shield, TestTube2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { BITRIX_PHONE_TYPES, BITRIX_TEMPLATE_VARIABLES, type BitrixHeaderSetting, type BitrixSettings } from '@/types/bitrix';

interface BitrixSettingsResponse {
  settings: BitrixSettings;
  error?: string;
}

interface ActionResponse {
  success?: boolean;
  error?: string;
  message?: string;
  issues?: string[];
  settings?: BitrixSettings;
}

function makeHeaderRow(): BitrixHeaderSetting {
  return {
    id: `header_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: '',
    value: '',
    enabled: true,
  };
}

function parseAdditionalFields(value: string): Record<string, string> {
  if (!value.trim()) return {};
  const parsed = JSON.parse(value);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Дополнительные поля должны быть объектом');
  }

  const normalized: Record<string, string> = {};
  for (const [key, raw] of Object.entries(parsed as Record<string, unknown>)) {
    if (!key.trim()) continue;
    normalized[key.trim()] = typeof raw === 'string' ? raw : String(raw ?? '');
  }
  return normalized;
}

function stringifyAdditionalFields(value: Record<string, string>): string {
  return JSON.stringify(value, null, 2);
}

export function AdminBitrixPageClient() {
  const router = useRouter();
  const [draft, setDraft] = useState<BitrixSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showWebhookValue, setShowWebhookValue] = useState(false);

  useEffect(() => {
    void loadSettings();
  }, [router]);

  const additionalFieldsError = useMemo(() => {
    if (!draft) return null;
    try {
      parseAdditionalFields(draft.additionalFieldsJson || '{}');
      return null;
    } catch {
      return 'Дополнительные поля должны быть в формате ключ-значение';
    }
  }, [draft]);

  const additionalFieldRows = useMemo(() => {
    if (!draft) return [];
    try {
      const parsed = parseAdditionalFields(draft.additionalFieldsJson || '{}');
      return Object.entries(parsed).map(([key, value], index) => ({
        id: `${key}-${index}`,
        key,
        value,
      }));
    } catch {
      return [];
    }
  }, [draft]);

  const webhookError = useMemo(() => {
    if (!draft || !draft.webhookUrl) return null;
    try {
      new URL(draft.webhookUrl);
      return null;
    } catch {
      return 'Webhook URL должен быть валидным абсолютным URL';
    }
  }, [draft]);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/bitrix-settings', { cache: 'no-store' });
      const data = (await res.json()) as BitrixSettingsResponse;
      if (res.status === 401) {
        router.replace('/admin/login?next=/admin/bitrix');
        return;
      }
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка загрузки');
      }
      setDraft(data.settings);
    } catch (cause: any) {
      setError(cause?.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  const update = <K extends keyof BitrixSettings>(key: K, value: BitrixSettings[K]) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const updateHeader = (id: string, key: keyof BitrixHeaderSetting, value: string | boolean) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        headers: prev.headers.map((row) => (row.id === id ? { ...row, [key]: value } : row)),
      };
    });
  };

  const addHeader = () => {
    setDraft((prev) => (prev ? { ...prev, headers: [...prev.headers, makeHeaderRow()] } : prev));
  };

  const removeHeader = (id: string) => {
    setDraft((prev) => (prev ? { ...prev, headers: prev.headers.filter((row) => row.id !== id) } : prev));
  };

  const updateAdditionalField = (currentKey: string, nextKey: string, nextValue: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      try {
        const parsed = parseAdditionalFields(prev.additionalFieldsJson || '{}');
        delete parsed[currentKey];
        const safeKey = nextKey.trim() || currentKey;
        parsed[safeKey] = nextValue;
        return {
          ...prev,
          additionalFieldsJson: stringifyAdditionalFields(parsed),
        };
      } catch {
        return prev;
      }
    });
  };

  const addAdditionalField = () => {
    setDraft((prev) => {
      if (!prev) return prev;
      try {
        const parsed = parseAdditionalFields(prev.additionalFieldsJson || '{}');
        const base = 'UF_CRM_CUSTOM_FIELD';
        let key = `${base}_${Object.keys(parsed).length + 1}`;
        while (key in parsed) {
          key = `${base}_${Math.floor(Math.random() * 10000)}`;
        }
        parsed[key] = '';
        return {
          ...prev,
          additionalFieldsJson: stringifyAdditionalFields(parsed),
        };
      } catch {
        return prev;
      }
    });
  };

  const removeAdditionalField = (fieldKey: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      try {
        const parsed = parseAdditionalFields(prev.additionalFieldsJson || '{}');
        delete parsed[fieldKey];
        return {
          ...prev,
          additionalFieldsJson: stringifyAdditionalFields(parsed),
        };
      } catch {
        return prev;
      }
    });
  };

  const saveSettings = async () => {
    if (!draft) return;

    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/admin/bitrix-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const data = (await res.json()) as ActionResponse;
      if (!res.ok) {
        const firstIssue = Array.isArray(data.issues) && data.issues.length > 0 ? data.issues[0] : '';
        throw new Error(firstIssue || data.error || 'Ошибка сохранения');
      }
      setDraft(data.settings || draft);
      setMessage('Настройки Bitrix сохранены.');
    } catch (cause: any) {
      setError(cause?.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const testWebhook = async () => {
    if (!draft) return;

    setTesting(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/admin/bitrix-settings/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const data = (await res.json()) as ActionResponse;
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Проверка не пройдена');
      }
      setMessage(data.message || 'Webhook работает корректно.');
    } catch (cause: any) {
      setError(cause?.message || 'Ошибка проверки');
    } finally {
      setTesting(false);
    }
  };

  if (loading || !draft) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  const hasLocalValidationIssue = Boolean(additionalFieldsError) || Boolean(webhookError);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Settings2 className="text-orange-400" />
              Настройки Bitrix CRM
            </h1>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={testWebhook}
                disabled={testing || hasLocalValidationIssue}
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-700 px-4 py-2 text-sm font-semibold hover:bg-zinc-600 transition-colors disabled:opacity-60"
              >
                {testing ? <Loader2 size={16} className="animate-spin" /> : <TestTube2 size={16} />}
                {testing ? 'Проверка...' : 'Проверить webhook'}
              </button>
              <button
                onClick={saveSettings}
                disabled={saving || hasLocalValidationIssue}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold hover:bg-green-500 transition-colors disabled:opacity-60"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
          <p className="mt-2 text-sm text-zinc-400">
            Управляйте интеграцией форм с Bitrix: webhook, формат заявки, шаблоны заголовков и дополнительные поля.
          </p>
          {message ? <p className="mt-3 text-sm text-emerald-400">{message}</p> : null}
          {error ? <p className="mt-3 text-sm text-rose-400">{error}</p> : null}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="Общие параметры" icon={<Shield size={18} className="text-orange-400" />}>
            <label className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm">
              <span className="text-zinc-200">Интеграция включена</span>
              <input
                type="checkbox"
                checked={draft.enabled}
                onChange={(event) => update('enabled', event.target.checked)}
                className="h-4 w-4 accent-orange-500"
              />
            </label>

            <Input
              label="Таймаут запроса (мс)"
              value={draft.timeoutMs}
              type="number"
              onChange={(value) => update('timeoutMs', Number(value) || 10000)}
            />

            <label className="mt-3 flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm">
              <span className="text-zinc-200">REGISTER_SONET_EVENT</span>
              <input
                type="checkbox"
                checked={draft.registerSonetEvent}
                onChange={(event) => update('registerSonetEvent', event.target.checked)}
                className="h-4 w-4 accent-orange-500"
              />
            </label>
          </Section>

          <Section title="Webhook и заголовки" icon={<Link2 size={18} className="text-orange-400" />}>
            <label className="mb-1 block text-sm text-zinc-400">Webhook URL</label>
            <div className="flex gap-2">
              <input
                type={showWebhookValue ? 'text' : 'password'}
                value={draft.webhookUrl}
                onChange={(event) => update('webhookUrl', event.target.value)}
                placeholder="https://portal.bitrix24.ru/rest/1/xxx/crm.deal.add"
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-orange-500"
              />
              <button
                type="button"
                onClick={() => setShowWebhookValue((prev) => !prev)}
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-zinc-300 hover:border-orange-500"
              >
                {showWebhookValue ? 'Скрыть' : 'Показать'}
              </button>
            </div>
            {webhookError ? <p className="mt-2 text-xs text-rose-400">{webhookError}</p> : null}

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-300">Доп. HTTP-заголовки</p>
                <button
                  type="button"
                  onClick={addHeader}
                  className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-700"
                >
                  <Plus size={12} />
                  Добавить
                </button>
              </div>

              {draft.headers.length === 0 ? (
                <p className="text-xs text-zinc-500">Можно оставить пусто, обычно хватает стандартного Content-Type.</p>
              ) : (
                draft.headers.map((row) => (
                  <div key={row.id} className="grid grid-cols-1 items-center gap-2 rounded-lg border border-white/10 bg-black/20 p-2 sm:grid-cols-[auto,1fr,1fr,auto]">
                    <input
                      type="checkbox"
                      checked={row.enabled}
                      onChange={(event) => updateHeader(row.id, 'enabled', event.target.checked)}
                      className="h-4 w-4 accent-orange-500"
                    />
                    <input
                      type="text"
                      value={row.name}
                      onChange={(event) => updateHeader(row.id, 'name', event.target.value)}
                      placeholder="Header-Name"
                      className="rounded-md border border-white/10 bg-black/30 px-2 py-1.5 text-xs text-zinc-100 outline-none focus:border-orange-500"
                    />
                    <input
                      type="text"
                      value={row.value}
                      onChange={(event) => updateHeader(row.id, 'value', event.target.value)}
                      placeholder="value"
                      className="rounded-md border border-white/10 bg-black/30 px-2 py-1.5 text-xs text-zinc-100 outline-none focus:border-orange-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeHeader(row.id)}
                      className="rounded-md border border-rose-500/30 bg-rose-500/10 p-1.5 text-rose-300 hover:bg-rose-500/20"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </Section>

          <Section title="Заголовок и поля сделки" icon={<FileText size={18} className="text-orange-400" />}>
            <Input
              label="TITLE префикс"
              value={draft.titlePrefix}
              onChange={(value) => update('titlePrefix', value)}
            />
            <Input
              label="TITLE шаблон"
              value={draft.titleTemplate}
              onChange={(value) => update('titleTemplate', value)}
            />
            <Input
              label="SOURCE_ID"
              value={draft.sourceId}
              onChange={(value) => update('sourceId', value)}
            />
            <Input
              label="ASSIGNED_BY_ID"
              type="number"
              value={draft.assignedById ?? ''}
              onChange={(value) => update('assignedById', value.trim() ? Number(value) || null : null)}
            />

            <div className="mt-3">
              <label className="mb-1 block text-sm text-zinc-400">PHONE.VALUE_TYPE</label>
              <select
                value={draft.phoneType}
                onChange={(event) => update('phoneType', event.target.value as BitrixSettings['phoneType'])}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-orange-500"
              >
                {BITRIX_PHONE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </Section>

          <Section title="Формат заявки" icon={<FileText size={18} className="text-orange-400" />}>
            <TextArea
              label="SOURCE_DESCRIPTION шаблон"
              value={draft.sourceDescriptionTemplate}
              rows={2}
              onChange={(value) => update('sourceDescriptionTemplate', value)}
            />
            <TextArea
              label="COMMENTS шаблон"
              value={draft.commentsTemplate}
              rows={6}
              onChange={(value) => update('commentsTemplate', value)}
            />
            <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm text-zinc-300">Дополнительные поля сделки</p>
                <button
                  type="button"
                  onClick={addAdditionalField}
                  className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-700"
                >
                  <Plus size={12} />
                  Добавить поле
                </button>
              </div>

              <div className="space-y-2">
                {additionalFieldRows.length === 0 ? (
                  <p className="text-xs text-zinc-500">Дополнительные поля не заданы.</p>
                ) : (
                  additionalFieldRows.map((row) => (
                    <div key={row.id} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr,1fr,auto]">
                      <input
                        type="text"
                        value={row.key}
                        onChange={(event) => updateAdditionalField(row.key, event.target.value, row.value)}
                        placeholder="Код поля"
                        className="rounded-md border border-white/10 bg-black/30 px-2 py-1.5 text-xs text-zinc-100 outline-none focus:border-orange-500"
                      />
                      <input
                        type="text"
                        value={row.value}
                        onChange={(event) => updateAdditionalField(row.key, row.key, event.target.value)}
                        placeholder="Значение"
                        className="rounded-md border border-white/10 bg-black/30 px-2 py-1.5 text-xs text-zinc-100 outline-none focus:border-orange-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeAdditionalField(row.key)}
                        className="rounded-md border border-rose-500/30 bg-rose-500/10 p-1.5 text-rose-300 hover:bg-rose-500/20"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
            {additionalFieldsError ? <p className="mt-2 text-xs text-rose-400">{additionalFieldsError}</p> : null}

            <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="text-xs text-zinc-400">Переменные для шаблонов:</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {BITRIX_TEMPLATE_VARIABLES.map((key) => (
                  <code key={key} className="rounded bg-black/40 px-2 py-1 text-xs text-orange-300">
                    {`{${key}}`}
                  </code>
                ))}
              </div>
            </div>
          </Section>
        </div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        {icon}
        {title}
      </h2>
      {children}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: 'text' | 'number';
}) {
  return (
    <div className="mt-3 first:mt-0">
      <label className="mb-1 block text-sm text-zinc-400">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-orange-500"
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows,
  mono = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
  mono?: boolean;
}) {
  return (
    <div className="mt-3 first:mt-0">
      <label className="mb-1 block text-sm text-zinc-400">{label}</label>
      <textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-orange-500 ${mono ? 'font-mono' : ''}`}
      />
    </div>
  );
}
