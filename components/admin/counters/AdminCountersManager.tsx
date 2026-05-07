"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import type { AnalyticsCounter, AnalyticsCounterPlace } from "@/types/cms";

const PLACE_LABELS: Record<AnalyticsCounterPlace, string> = {
  head: "<head>",
  "body-start": "после <body>",
  "body-end": "перед </body>",
};

const PLACES: AnalyticsCounterPlace[] = ["head", "body-start", "body-end"];

type StatusKind = "idle" | "saving" | "success" | "error";

function newCounter(): AnalyticsCounter {
  return {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `counter-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: "Новый счётчик",
    place: "head",
    enabled: true,
    code: "",
    notes: "",
  };
}

function statusMessage(status: StatusKind, error: string | null): string | null {
  if (status === "saving") return "Сохранение...";
  if (status === "success") return "Сохранено";
  if (status === "error") return error || "Не удалось сохранить";
  return null;
}

export function AdminCountersManager() {
  const router = useRouter();
  const [counters, setCounters] = useState<AnalyticsCounter[]>([]);
  const [serverCounters, setServerCounters] = useState<AnalyticsCounter[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<StatusKind>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/admin/cms/analytics/counters", { cache: "no-store" });
        if (res.status === 401) {
          router.replace("/admin/login?next=/admin/counters");
          return;
        }
        const payload = await res.json();
        if (!res.ok) {
          throw new Error(payload?.error || "Не удалось загрузить счётчики");
        }
        if (cancelled) return;
        const initial = Array.isArray(payload.counters) ? (payload.counters as AnalyticsCounter[]) : [];
        setCounters(initial);
        setServerCounters(initial);
      } catch (cause: any) {
        if (!cancelled) setError(cause?.message || "Ошибка загрузки");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const dirty = useMemo(() => JSON.stringify(counters) !== JSON.stringify(serverCounters), [counters, serverCounters]);
  const enabledCount = counters.filter((c) => c.enabled).length;

  const updateCounter = (id: string, patch: Partial<AnalyticsCounter>) => {
    setCounters((prev) => prev.map((counter) => (counter.id === id ? { ...counter, ...patch } : counter)));
  };

  const removeCounter = (id: string) => {
    setCounters((prev) => prev.filter((counter) => counter.id !== id));
  };

  const addCounter = () => {
    setCounters((prev) => [...prev, newCounter()]);
  };

  const save = async () => {
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch("/api/admin/cms/analytics/counters", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ counters }),
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || "Не удалось сохранить");
      }
      const next = Array.isArray(payload.counters) ? (payload.counters as AnalyticsCounter[]) : counters;
      setCounters(next);
      setServerCounters(next);
      setStatus("success");
      setTimeout(() => setStatus("idle"), 1500);
    } catch (cause: any) {
      setStatus("error");
      setError(cause?.message || "Ошибка сохранения");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 text-center text-sm text-zinc-400">
        Загрузка счётчиков...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Счётчики и пиксели</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Активных: <span className="font-semibold text-white">{enabledCount}</span> из {counters.length}.
            Поддерживаются произвольные <code className="rounded bg-zinc-900 px-1">&lt;script&gt;</code>/
            <code className="rounded bg-zinc-900 px-1">&lt;noscript&gt;</code> — Yandex.Metrika, GTM, Google Analytics, Pixel и т.д.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={addCounter}
            className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:border-orange-400 hover:text-white"
          >
            <Plus size={14} /> Добавить
          </button>
          <button
            type="button"
            onClick={save}
            disabled={status === "saving" || !dirty}
            className="inline-flex items-center gap-1 rounded-lg bg-orange-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-zinc-700"
          >
            {status === "saving" ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {dirty ? "Сохранить" : "Сохранено"}
          </button>
        </div>
      </div>

      {statusMessage(status, error) ? (
        <p className={`mb-4 text-xs ${status === "error" ? "text-rose-400" : "text-zinc-300"}`}>
          {statusMessage(status, error)}
        </p>
      ) : null}

      {counters.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-zinc-900/40 p-8 text-center text-sm text-zinc-400">
          Пока нет ни одного счётчика. Нажмите «Добавить» чтобы вставить первый.
        </div>
      ) : (
        <div className="space-y-4">
          {counters.map((counter) => (
            <article
              key={counter.id}
              className="rounded-2xl border border-white/10 bg-zinc-900 p-4"
            >
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_120px_auto] md:items-center">
                <input
                  value={counter.name}
                  onChange={(event) => updateCounter(counter.id, { name: event.target.value })}
                  placeholder="Название (Yandex Metrika, GTM, Pixel...)"
                  className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm font-semibold text-white outline-none transition focus:border-orange-500"
                />
                <select
                  value={counter.place}
                  onChange={(event) => updateCounter(counter.id, { place: event.target.value as AnalyticsCounterPlace })}
                  className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-orange-500"
                >
                  {PLACES.map((place) => (
                    <option key={place} value={place}>
                      {PLACE_LABELS[place]}
                    </option>
                  ))}
                </select>
                <label className="inline-flex select-none items-center gap-2 text-xs font-semibold text-zinc-200">
                  <input
                    type="checkbox"
                    checked={counter.enabled}
                    onChange={(event) => updateCounter(counter.id, { enabled: event.target.checked })}
                    className="h-4 w-4 accent-orange-500"
                  />
                  Включён
                </label>
                <button
                  type="button"
                  onClick={() => removeCounter(counter.id)}
                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-rose-300 transition hover:border-rose-500/40 hover:text-rose-200"
                >
                  <Trash2 size={14} /> Удалить
                </button>
              </div>

              <textarea
                value={counter.code}
                onChange={(event) => updateCounter(counter.id, { code: event.target.value })}
                rows={8}
                spellCheck={false}
                className="mt-3 w-full rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-xs text-zinc-200 outline-none transition focus:border-orange-500"
                placeholder='<script>...</script> или <noscript>...</noscript>'
              />

              <input
                value={counter.notes ?? ""}
                onChange={(event) => updateCounter(counter.id, { notes: event.target.value })}
                placeholder="Заметка (необязательно — например: Yandex Metrika ID 12345)"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-zinc-300 outline-none transition focus:border-orange-500"
              />

              {counter.updatedAt ? (
                <p className="mt-2 text-[10px] uppercase tracking-wide text-zinc-500">
                  Обновлено: {new Date(counter.updatedAt).toLocaleString("ru-RU")}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
