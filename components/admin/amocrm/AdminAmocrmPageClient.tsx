"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  FileText,
  KeyRound,
  Link2,
  Loader2,
  RefreshCw,
  Save,
  Settings2,
  TestTube2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  AMOCRM_TEMPLATE_VARIABLES,
  type AmocrmMeta,
  type AmocrmSettings,
} from "@/types/amocrm";
import { CrmProviderToggle } from "@/components/admin/common/CrmProviderToggle";

interface AmocrmSettingsResponse {
  settings: AmocrmSettings;
  error?: string;
}

interface ActionResponse {
  success?: boolean;
  error?: string;
  message?: string;
  issues?: string[];
  settings?: AmocrmSettings;
  meta?: AmocrmMeta;
}

export function AdminAmocrmPageClient() {
  const router = useRouter();
  const [draft, setDraft] = useState<AmocrmSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [meta, setMeta] = useState<AmocrmMeta | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    void loadSettings();
  }, [router]);

  const subdomainError = useMemo(() => {
    if (!draft || !draft.subdomain) return null;
    if (!/^[a-z0-9-]+$/.test(draft.subdomain)) {
      return "Поддомен: только латиница, цифры и дефис";
    }
    return null;
  }, [draft]);

  const tagsString = useMemo(() => (draft ? draft.tags.join(", ") : ""), [draft]);

  async function loadSettings() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/amocrm-settings", { cache: "no-store" });
      const data = (await res.json()) as AmocrmSettingsResponse;
      if (res.status === 401) {
        router.replace("/admin/login?next=/admin/amocrm");
        return;
      }
      if (!res.ok) throw new Error(data.error || "Ошибка загрузки");
      setDraft(data.settings);
    } catch (cause: any) {
      setError(cause?.message || "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }

  function update<K extends keyof AmocrmSettings>(key: K, value: AmocrmSettings[K]) {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function updateTagsString(raw: string) {
    const tags = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    update("tags", tags);
  }

  async function saveSettings() {
    if (!draft) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/amocrm-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = (await res.json()) as ActionResponse;
      if (!res.ok) {
        const firstIssue = Array.isArray(data.issues) && data.issues.length > 0 ? data.issues[0] : "";
        throw new Error(firstIssue || data.error || "Ошибка сохранения");
      }
      setDraft(data.settings || draft);
      setMessage("Настройки amoCRM сохранены.");
    } catch (cause: any) {
      setError(cause?.message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  async function testConnection() {
    if (!draft) return;
    setTesting(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/amocrm-settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = (await res.json()) as ActionResponse;
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Проверка не пройдена");
      }
      setMessage(data.message || "amoCRM отвечает корректно.");
    } catch (cause: any) {
      setError(cause?.message || "Ошибка проверки");
    } finally {
      setTesting(false);
    }
  }

  async function loadMeta() {
    if (!draft) return;
    setLoadingMeta(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/amocrm-settings/meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = (await res.json()) as ActionResponse;
      if (!res.ok || !data.success || !data.meta) {
        throw new Error(data.error || "Не удалось загрузить воронки");
      }
      setMeta(data.meta);
      setMessage(`Загружено: ${data.meta.pipelines.length} воронок, ${data.meta.users.length} пользователей`);
    } catch (cause: any) {
      setError(cause?.message || "Ошибка загрузки данных amoCRM");
    } finally {
      setLoadingMeta(false);
    }
  }

  if (loading || !draft) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  const selectedPipeline = meta?.pipelines.find((p) => p.id === draft.pipelineId);
  const hasIssue = Boolean(subdomainError);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <CrmProviderToggle pageProvider="amocrm" />

      <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Settings2 className="text-orange-400" />
            Настройки amoCRM
          </h1>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={testConnection}
              disabled={testing || hasIssue}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-700 px-4 py-2 text-sm font-semibold hover:bg-zinc-600 transition-colors disabled:opacity-60"
            >
              {testing ? <Loader2 size={16} className="animate-spin" /> : <TestTube2 size={16} />}
              {testing ? "Проверка..." : "Проверить токен"}
            </button>
            <button
              onClick={saveSettings}
              disabled={saving || hasIssue}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold hover:bg-green-500 transition-colors disabled:opacity-60"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        </div>
        <p className="mt-2 text-sm text-zinc-400">
          Подключение к amoCRM: поддомен, долгосрочный токен, воронка и шаблоны полей сделки.
        </p>
        {message ? <p className="mt-3 text-sm text-emerald-400">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-400">{error}</p> : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Подключение" icon={<KeyRound size={18} className="text-orange-400" />}>
          <label className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm">
            <span className="text-zinc-200">Интеграция включена</span>
            <input
              type="checkbox"
              checked={draft.enabled}
              onChange={(event) => update("enabled", event.target.checked)}
              className="h-4 w-4 accent-orange-500"
            />
          </label>

          <Input
            label="Поддомен amoCRM"
            placeholder="iliaevkevich"
            value={draft.subdomain}
            onChange={(value) => update("subdomain", value)}
            hint="Без https:// и .amocrm.ru — только имя поддомена"
          />
          {subdomainError ? <p className="-mt-2 text-xs text-rose-400">{subdomainError}</p> : null}

          <div className="mt-3">
            <label className="mb-1 block text-sm text-zinc-400">Долгосрочный токен (Bearer)</label>
            <div className="flex gap-2">
              <input
                type={showToken ? "text" : "password"}
                value={draft.accessToken}
                onChange={(event) => update("accessToken", event.target.value)}
                placeholder="eyJ0eXAi..."
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-xs text-zinc-100 outline-none focus:border-orange-500"
              />
              <button
                type="button"
                onClick={() => setShowToken((prev) => !prev)}
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-zinc-300 hover:border-orange-500"
              >
                {showToken ? "Скрыть" : "Показать"}
              </button>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              amoCRM → Настройки → Интеграции → Создать → Внешняя интеграция → вкладка «Ключи и доступы» → Долгосрочный токен
            </p>
          </div>

          <Input
            label="Таймаут запроса (мс)"
            type="number"
            value={draft.timeoutMs}
            onChange={(value) => update("timeoutMs", Number(value) || 10000)}
          />
        </Section>

        <Section title="Воронка и ответственный" icon={<Link2 size={18} className="text-orange-400" />}>
          <button
            type="button"
            onClick={loadMeta}
            disabled={loadingMeta || !draft.subdomain || !draft.accessToken}
            className="mb-3 inline-flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-100 hover:bg-zinc-700 disabled:opacity-60"
          >
            {loadingMeta ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Загрузить воронки и пользователей из amoCRM
          </button>

          {meta ? (
            <>
              <div>
                <label className="mb-1 block text-sm text-zinc-400">Воронка (pipeline)</label>
                <select
                  value={draft.pipelineId ?? ""}
                  onChange={(event) => {
                    const id = event.target.value ? Number(event.target.value) : null;
                    update("pipelineId", id);
                    update("statusId", null);
                  }}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-orange-500"
                >
                  <option value="">— выберите воронку —</option>
                  {meta.pipelines.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.isMain ? "(основная)" : ""} — #{p.id}
                    </option>
                  ))}
                </select>
              </div>

              {selectedPipeline ? (
                <div className="mt-3">
                  <label className="mb-1 block text-sm text-zinc-400">Статус (куда падает заявка)</label>
                  <select
                    value={draft.statusId ?? ""}
                    onChange={(event) =>
                      update("statusId", event.target.value ? Number(event.target.value) : null)
                    }
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-orange-500"
                  >
                    <option value="">— первый этап воронки —</option>
                    {selectedPipeline.statuses.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} — #{s.id}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="mt-3">
                <label className="mb-1 block text-sm text-zinc-400">Ответственный</label>
                <select
                  value={draft.responsibleUserId ?? ""}
                  onChange={(event) =>
                    update("responsibleUserId", event.target.value ? Number(event.target.value) : null)
                  }
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-orange-500"
                >
                  <option value="">— по умолчанию (воронки) —</option>
                  {meta.users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                      {u.email ? ` (${u.email})` : ""} — #{u.id}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <>
              <Input
                label="Pipeline ID (вручную)"
                type="number"
                value={draft.pipelineId ?? ""}
                onChange={(value) => update("pipelineId", value.trim() ? Number(value) || null : null)}
                hint="Можно подгрузить выпадайки кнопкой выше"
              />
              <Input
                label="Status ID (вручную)"
                type="number"
                value={draft.statusId ?? ""}
                onChange={(value) => update("statusId", value.trim() ? Number(value) || null : null)}
              />
              <Input
                label="Responsible User ID (вручную)"
                type="number"
                value={draft.responsibleUserId ?? ""}
                onChange={(value) => update("responsibleUserId", value.trim() ? Number(value) || null : null)}
              />
            </>
          )}
        </Section>

        <Section title="Шаблоны полей сделки" icon={<FileText size={18} className="text-orange-400" />}>
          <Input
            label="Название сделки (шаблон)"
            value={draft.leadNameTemplate}
            onChange={(value) => update("leadNameTemplate", value)}
          />

          <TextArea
            label="Примечание к сделке (шаблон)"
            value={draft.noteTemplate}
            rows={6}
            onChange={(value) => update("noteTemplate", value)}
          />

          <Input
            label="Теги (через запятую)"
            value={tagsString}
            onChange={updateTagsString}
            hint="Применяются ко всем созданным сделкам"
          />

          <label className="mt-3 flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm">
            <span className="text-zinc-200">Искать контакт по телефону (дедупликация)</span>
            <input
              type="checkbox"
              checked={draft.dedupeByPhone}
              onChange={(event) => update("dedupeByPhone", event.target.checked)}
              className="h-4 w-4 accent-orange-500"
            />
          </label>

          <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-3">
            <p className="text-xs text-zinc-400">Переменные для шаблонов:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {AMOCRM_TEMPLATE_VARIABLES.map((key) => (
                <code key={key} className="rounded bg-black/40 px-2 py-1 text-xs text-orange-300">
                  {`{${key}}`}
                </code>
              ))}
            </div>
          </div>
        </Section>

        <Section title="Памятка" icon={<KeyRound size={18} className="text-orange-400" />}>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-zinc-300">
            <li>
              Зайдите в amoCRM →&nbsp;
              <span className="font-mono text-orange-300">Настройки → Интеграции</span> (или amoМаркет → «...» → Создать интеграцию)
            </li>
            <li>«+ Создать» → «Внешняя интеграция»</li>
            <li>
              Заполните название, описание, redirect URI:&nbsp;
              <code className="rounded bg-black/40 px-1 text-xs text-orange-300">https://highwaymotors.site/admin/amocrm/callback</code>,
              включите «Предоставить доступ: Все», загрузите любой логотип 400×272, сохраните
            </li>
            <li>Откройте созданную интеграцию → вкладка «Ключи и доступы» → «Долгосрочный токен»</li>
            <li>Скопируйте токен и вставьте в поле выше, сохраните, нажмите «Проверить токен»</li>
            <li>Нажмите «Загрузить воронки», выберите воронку и стадию для входящих заявок</li>
            <li>Сверху переключите CRM на «amoCRM» (или «Обе» для постепенной миграции)</li>
          </ol>
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
  type = "text",
  placeholder,
  hint,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: "text" | "number";
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div className="mt-3 first:mt-0">
      <label className="mb-1 block text-sm text-zinc-400">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-orange-500"
      />
      {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
}) {
  return (
    <div className="mt-3 first:mt-0">
      <label className="mb-1 block text-sm text-zinc-400">{label}</label>
      <textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-orange-500"
      />
    </div>
  );
}
