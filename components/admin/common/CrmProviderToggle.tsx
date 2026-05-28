"use client";

import { useEffect, useState } from "react";
import { Loader2, Radio, Save } from "lucide-react";
import type { CrmProvider, CrmProviderSettings } from "@/types/amocrm";

interface CrmProviderToggleProps {
  /** Optional: which provider is "highlighted" from current page context */
  pageProvider?: "bitrix" | "amocrm";
}

const PROVIDER_LABELS: Record<CrmProvider, string> = {
  bitrix: "Битрикс24",
  amocrm: "amoCRM",
  both: "Обе сразу",
};

const PROVIDER_HINT: Record<CrmProvider, string> = {
  bitrix: "Заявки идут только в Битрикс24",
  amocrm: "Заявки идут только в amoCRM",
  both: "Каждая заявка дублируется в обе CRM",
};

export function CrmProviderToggle({ pageProvider }: CrmProviderToggleProps) {
  const [provider, setProvider] = useState<CrmProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/crm-provider", { cache: "no-store" });
      const data = (await res.json()) as { settings?: CrmProviderSettings; error?: string };
      if (!res.ok) throw new Error(data.error || "Ошибка загрузки");
      setProvider(data.settings?.provider ?? "bitrix");
    } catch (cause: any) {
      setError(cause?.message || "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }

  async function save(next: CrmProvider) {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/crm-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: next }),
      });
      const data = (await res.json()) as { settings?: CrmProviderSettings; error?: string };
      if (!res.ok) throw new Error(data.error || "Ошибка сохранения");
      setProvider(data.settings?.provider ?? next);
      setMessage("Маршрут заявок обновлён.");
    } catch (cause: any) {
      setError(cause?.message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-zinc-900/80 px-5 py-4 text-sm text-zinc-400">
        <Loader2 className="animate-spin" size={16} />
        Загрузка маршрута заявок...
      </div>
    );
  }

  const currentLabel = provider ? PROVIDER_LABELS[provider] : "—";
  const currentHint = provider ? PROVIDER_HINT[provider] : "";

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/80 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Radio size={18} className="text-orange-400" />
            Куда отправлять заявки
          </h2>
          <p className="mt-1 text-xs text-zinc-400">{currentHint}</p>
        </div>
        <div className="text-right text-xs text-zinc-400">
          Сейчас активно: <span className="font-semibold text-orange-300">{currentLabel}</span>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {(Object.keys(PROVIDER_LABELS) as CrmProvider[]).map((option) => {
          const active = provider === option;
          const isPageMatch =
            (pageProvider === "bitrix" && option === "bitrix") ||
            (pageProvider === "amocrm" && option === "amocrm");
          return (
            <button
              key={option}
              type="button"
              disabled={saving}
              onClick={() => save(option)}
              className={`flex flex-col items-start gap-1 rounded-xl border px-4 py-3 text-left transition disabled:opacity-60 ${
                active
                  ? "border-orange-500/60 bg-orange-500/10 text-white"
                  : "border-white/10 bg-black/30 text-zinc-200 hover:border-orange-400/50 hover:bg-black/40"
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                {active ? <Save size={14} className="text-orange-300" /> : null}
                {PROVIDER_LABELS[option]}
                {isPageMatch ? (
                  <span className="ml-1 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
                    эта страница
                  </span>
                ) : null}
              </span>
              <span className="text-xs text-zinc-400">{PROVIDER_HINT[option]}</span>
            </button>
          );
        })}
      </div>

      {message ? <p className="mt-3 text-xs text-emerald-400">{message}</p> : null}
      {error ? <p className="mt-3 text-xs text-rose-400">{error}</p> : null}
    </div>
  );
}
