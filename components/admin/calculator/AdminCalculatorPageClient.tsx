'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Brain, Calculator, Loader2, RefreshCw, Save, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type {
  AuctionFeeBracket,
  AuctionKey,
  CalcStageKey,
  CalculatorConfig,
  OceanRate,
  OceanRoute,
  StageMargin,
  TowRate,
  UploadedDocument,
  UsPort,
  Warehouse,
} from '@/types/calculator';

interface AdminCalculatorResponse {
  config: CalculatorConfig;
  uploads: UploadedDocument[];
  platforms: string[];
  towRates: TowRate[];
  oceanRates: OceanRate[];
  auctionFees: AuctionFeeBracket[];
  stageMargins: StageMargin[];
}

type TabKey = 'overview' | 'tow' | 'ocean' | 'auction' | 'margins' | 'land' | 'settings';

const TAB_LABELS: Record<TabKey, string> = {
  overview: 'Обзор',
  tow: 'Эвакуатор',
  ocean: 'Океан',
  auction: 'Аукционные сборы',
  margins: 'Маржа по этапам',
  land: 'Наземка',
  settings: 'Курсы / Fallback',
};

const STAGE_LABELS: Record<CalcStageKey, string> = {
  auction_price: 'Цена авто на аукционе',
  auction_fee: 'Аукционный сбор',
  tow: 'Эвакуатор до порта США',
  ocean: 'Морская доставка',
  land: 'Доставка до Минска',
  customs: 'Таможенная пошлина и сборы',
  util: 'Утилизационный сбор',
};

const VALID_WAREHOUSES: Warehouse[] = ['NEW JERSEY', 'GEORGIA', 'TEXAS', 'CALIFORNIA'];
const VALID_PORTS: UsPort[] = ['Newark', 'Savannah', 'Houston', 'Long Beach'];
const VALID_ROUTES: OceanRoute[] = ['klaipeda', 'poti'];
const VALID_AUCTIONS: AuctionKey[] = ['COPART', 'IAAI'];

export function AdminCalculatorPageClient() {
  const router = useRouter();
  const [payload, setPayload] = useState<AdminCalculatorResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingKind, setUploadingKind] = useState<'rates' | 'ports' | null>(null);
  const [parsingId, setParsingId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>('overview');

  // Editable working state (mirrors payload entries, persists user edits before Save)
  const [towRates, setTowRates] = useState<TowRate[]>([]);
  const [oceanRates, setOceanRates] = useState<OceanRate[]>([]);
  const [auctionFees, setAuctionFees] = useState<AuctionFeeBracket[]>([]);
  const [stageMargins, setStageMargins] = useState<StageMargin[]>([]);
  const [towFilter, setTowFilter] = useState('');

  useEffect(() => {
    void fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const uploads = useMemo(() => payload?.uploads || [], [payload]);
  const platforms = useMemo(() => payload?.platforms || [], [payload]);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/calculator', { cache: 'no-store' });
      const data = await res.json();
      if (res.status === 401) {
        router.replace('/admin/login?next=/admin/calculator');
        return;
      }
      if (!res.ok) throw new Error(data?.error || 'Ошибка загрузки');
      setPayload(data);
      setTowRates(data.towRates || []);
      setOceanRates(seedOceanMatrix(data.oceanRates || []));
      setAuctionFees(data.auctionFees || []);
      setStageMargins(data.stageMargins || []);
    } catch (e: any) {
      setError(e?.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  const setConfigValue = (section: keyof CalculatorConfig, key: string, value: string) => {
    setPayload((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        config: {
          ...prev.config,
          [section]: {
            ...(prev.config[section] as any),
            [key]: key === 'ai_model' ? value : Number(value),
          },
        },
      };
    });
  };

  const setLandValue = (key: 'klaipeda_to_minsk_usd' | 'poti_to_minsk_usd', value: string) => {
    setPayload((prev) => {
      if (!prev) return prev;
      const land = prev.config.land || { klaipeda_to_minsk_usd: 1350, poti_to_minsk_usd: 2900 };
      return {
        ...prev,
        config: { ...prev.config, land: { ...land, [key]: Number(value) || 0 } },
      };
    });
  };

  const saveSettings = async () => {
    if (!payload) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: payload.config }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Ошибка сохранения');
      setMessage('Курсы и fallback-настройки сохранены.');
      await fetchSettings();
    } catch (e: any) {
      setError(e?.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const saveTow = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/calculator/tow-rates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: towRates }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Ошибка сохранения');
      setMessage(`Сохранено строк эвакуатора: ${data.count}.`);
      await fetchSettings();
    } catch (e: any) {
      setError(e?.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const saveOcean = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/calculator/ocean-rates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: oceanRates.filter((r) => r.cost > 0) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Ошибка сохранения');
      setMessage(`Морские тарифы сохранены: ${data.count} строк.`);
      await fetchSettings();
    } catch (e: any) {
      setError(e?.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const saveAuction = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/calculator/auction-fees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: auctionFees }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Ошибка сохранения');
      setMessage(`Аукционные сборы сохранены: ${data.count} строк.`);
      await fetchSettings();
    } catch (e: any) {
      setError(e?.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const saveMargins = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/calculator/stage-margins', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: stageMargins }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Ошибка сохранения');
      setMessage('Маржа по этапам сохранена.');
      await fetchSettings();
    } catch (e: any) {
      setError(e?.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const uploadDocument = async (kind: 'rates' | 'ports', file: File | null) => {
    if (!file) return;
    setUploadingKind(kind);
    setMessage(null);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('kind', kind);
      const res = await fetch('/api/admin/calculator/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Ошибка загрузки файла');
      setMessage(`Файл «${data.originalName}» загружен.`);
      await fetchSettings();
    } catch (e: any) {
      setError(e?.message || 'Ошибка загрузки файла');
    } finally {
      setUploadingKind(null);
    }
  };

  const parseDocument = async (fileId: number) => {
    setParsingId(fileId);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`/api/admin/calculator/parse/${fileId}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Ошибка AI-разбора');
      setMessage(data?.summary || 'Файл успешно разобран.');
      await fetchSettings();
    } catch (e: any) {
      setError(e?.message || 'Ошибка AI-разбора');
    } finally {
      setParsingId(null);
    }
  };

  // Tow editing
  const updateTowRow = (idx: number, patch: Partial<TowRate>) => {
    setTowRates((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };
  const addTowRow = () => {
    setTowRates((prev) => [
      ...prev,
      { state: '', city: '', zip: null, copartCost: null, iaaiCost: null, warehouse: 'NEW JERSEY', isActive: true },
    ]);
  };
  const removeTowRow = (idx: number) => {
    setTowRates((prev) => prev.filter((_, i) => i !== idx));
  };
  const visibleTowRows = useMemo(() => {
    const q = towFilter.trim().toLowerCase();
    if (!q) return towRates.slice(0, 500);
    return towRates
      .filter((r) =>
        [r.state, r.city, r.zip].some((v) => v && String(v).toLowerCase().includes(q)),
      )
      .slice(0, 500);
  }, [towRates, towFilter]);

  // Ocean editing
  const updateOceanRow = (idx: number, patch: Partial<OceanRate>) => {
    setOceanRates((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  // Auction fee editing
  const updateAuctionRow = (idx: number, patch: Partial<AuctionFeeBracket>) => {
    setAuctionFees((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };
  const addAuctionRow = () => {
    setAuctionFees((prev) => [
      ...prev,
      { auction: 'COPART', minPrice: 0, maxPrice: 49.99, flatFee: 0, pctFee: null, internetBidFee: 0, serviceFee: 0 },
    ]);
  };
  const removeAuctionRow = (idx: number) => {
    setAuctionFees((prev) => prev.filter((_, i) => i !== idx));
  };

  // Margins editing
  const updateMargin = (stage: CalcStageKey, patch: Partial<StageMargin>) => {
    setStageMargins((prev) => prev.map((m) => (m.stage === stage ? { ...m, ...patch } : m)));
  };

  if (loading || !payload) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  const { config } = payload;
  const land = config.land || { klaipeda_to_minsk_usd: 1350, poti_to_minsk_usd: 2900 };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calculator className="text-orange-400" />
            Калькулятор
          </h1>
        </div>
        <p className="mt-2 text-sm text-zinc-400">
          Тарифы по этапам импорта авто из США. Импорт xlsx через AI или ручное редактирование таблиц.
        </p>
        {message ? <p className="mt-3 text-sm text-emerald-400">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-400">{error}</p> : null}
      </div>

      <div className="flex flex-wrap gap-1.5 rounded-2xl border border-white/10 bg-zinc-900 p-2">
        {(Object.keys(TAB_LABELS) as TabKey[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              tab === key
                ? 'bg-orange-500/20 text-orange-200'
                : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            {TAB_LABELS[key]}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <Section title="Файлы ставок (AI-разбор)" icon={<Upload size={18} className="text-orange-400" />}>
          <div className="grid gap-2 sm:grid-cols-2">
            <UploadInput
              label="Загрузить ставки (rates)"
              busy={uploadingKind === 'rates'}
              onSelect={(file) => uploadDocument('rates', file)}
            />
            <UploadInput
              label="Загрузить порты (ports)"
              busy={uploadingKind === 'ports'}
              onSelect={(file) => uploadDocument('ports', file)}
            />
          </div>

          <div className="mt-4 space-y-2">
            {uploads.length === 0 ? (
              <p className="text-sm text-zinc-500">Файлы пока не загружены.</p>
            ) : (
              uploads.slice(0, 12).map((item) => (
                <div key={item.id} className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-medium text-zinc-100">{item.originalName}</div>
                      <div className="text-xs text-zinc-500">
                        {item.kind} · {item.status}
                      </div>
                    </div>
                    <button
                      onClick={() => parseDocument(item.id)}
                      disabled={parsingId === item.id}
                      className="inline-flex items-center gap-1 rounded-md bg-orange-600 px-3 py-1.5 text-xs font-semibold hover:bg-orange-500 transition-colors disabled:opacity-60"
                    >
                      {parsingId === item.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Brain size={12} />
                      )}
                      {parsingId === item.id ? 'Разбор...' : 'Разобрать ИИ'}
                    </button>
                  </div>
                  {item.error ? <p className="mt-2 text-xs text-rose-400">{item.error}</p> : null}
                </div>
              ))
            )}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Stat label="Строк эвакуатора" value={String(payload.towRates.length)} />
            <Stat label="Строк аукц. сборов" value={String(payload.auctionFees.length)} />
            <Stat label="Морских строк" value={String(payload.oceanRates.length)} />
          </div>

          <div className="mt-4">
            <p className="text-xs text-zinc-500 mb-2">Площадки из БД:</p>
            <div className="flex flex-wrap gap-2">
              {platforms.length > 0 ? (
                platforms.map((platform) => (
                  <span
                    key={platform}
                    className="rounded-md border border-white/15 bg-black/30 px-2 py-1 text-xs text-zinc-300"
                  >
                    {platform}
                  </span>
                ))
              ) : (
                <span className="text-sm text-zinc-500">Пока пусто.</span>
              )}
            </div>
          </div>
        </Section>
      ) : null}

      {tab === 'tow' ? (
        <Section
          title="Эвакуатор по локациям США"
          icon={<Upload size={18} className="text-orange-400" />}
          actions={<SaveButton onClick={saveTow} busy={saving} />}
        >
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={towFilter}
              onChange={(e) => setTowFilter(e.target.value)}
              placeholder="Фильтр по штату / городу / ZIP..."
              className="w-full max-w-sm rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-orange-500"
            />
            <button
              type="button"
              onClick={addTowRow}
              className="rounded-md bg-zinc-700 px-3 py-1.5 text-xs font-semibold hover:bg-zinc-600"
            >
              + Добавить
            </button>
            <span className="text-xs text-zinc-500">
              Строк: {towRates.length} (показано {visibleTowRows.length})
            </span>
          </div>

          <div className="max-h-[600px] overflow-auto rounded-xl border border-white/10">
            <table className="min-w-full text-xs">
              <thead className="sticky top-0 bg-black/60 text-left text-[10px] uppercase tracking-wide text-zinc-400">
                <tr>
                  <th className="px-2 py-2">Штат</th>
                  <th className="px-2 py-2">Город</th>
                  <th className="px-2 py-2">ZIP</th>
                  <th className="px-2 py-2">Copart $</th>
                  <th className="px-2 py-2">IAAI $</th>
                  <th className="px-2 py-2">Склад</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {visibleTowRows.map((row, visibleIdx) => {
                  const realIdx = towRates.indexOf(row);
                  return (
                    <tr key={`tow-${realIdx}`} className="border-t border-white/5 hover:bg-white/[0.02]">
                      <td className="px-2 py-1">
                        <input
                          type="text"
                          value={row.state}
                          onChange={(e) => updateTowRow(realIdx, { state: e.target.value })}
                          className="w-28 rounded bg-transparent px-1 py-0.5 text-zinc-200 outline-none focus:bg-black/30"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="text"
                          value={row.city}
                          onChange={(e) => updateTowRow(realIdx, { city: e.target.value })}
                          className="w-40 rounded bg-transparent px-1 py-0.5 text-zinc-200 outline-none focus:bg-black/30"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="text"
                          value={row.zip || ''}
                          onChange={(e) => updateTowRow(realIdx, { zip: e.target.value || null })}
                          className="w-24 rounded bg-transparent px-1 py-0.5 text-zinc-200 outline-none focus:bg-black/30"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="number"
                          value={row.copartCost ?? ''}
                          onChange={(e) =>
                            updateTowRow(realIdx, {
                              copartCost: e.target.value === '' ? null : Number(e.target.value) || 0,
                            })
                          }
                          className="w-20 rounded bg-transparent px-1 py-0.5 text-right text-zinc-200 outline-none focus:bg-black/30"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="number"
                          value={row.iaaiCost ?? ''}
                          onChange={(e) =>
                            updateTowRow(realIdx, {
                              iaaiCost: e.target.value === '' ? null : Number(e.target.value) || 0,
                            })
                          }
                          className="w-20 rounded bg-transparent px-1 py-0.5 text-right text-zinc-200 outline-none focus:bg-black/30"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <select
                          value={row.warehouse}
                          onChange={(e) => updateTowRow(realIdx, { warehouse: e.target.value as Warehouse })}
                          className="rounded bg-transparent px-1 py-0.5 text-zinc-200 outline-none focus:bg-black/30"
                        >
                          {VALID_WAREHOUSES.map((w) => (
                            <option key={w} value={w}>
                              {w}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1 text-right">
                        <button
                          type="button"
                          onClick={() => removeTowRow(realIdx)}
                          className="text-xs text-rose-400 hover:text-rose-300"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>
      ) : null}

      {tab === 'ocean' ? (
        <Section
          title="Морская доставка (порт США → Клайпеда / Поти)"
          icon={<Upload size={18} className="text-orange-400" />}
          actions={<SaveButton onClick={saveOcean} busy={saving} />}
        >
          <div className="overflow-auto rounded-xl border border-white/10">
            <table className="min-w-full text-xs">
              <thead className="bg-black/60 text-left text-[10px] uppercase tracking-wide text-zinc-400">
                <tr>
                  <th className="px-2 py-2">Порт США</th>
                  <th className="px-2 py-2">Направление</th>
                  <th className="px-2 py-2">Hazmat</th>
                  <th className="px-2 py-2">Стоимость, USD</th>
                </tr>
              </thead>
              <tbody>
                {oceanRates.map((row, idx) => (
                  <tr key={`ocean-${idx}`} className="border-t border-white/5">
                    <td className="px-2 py-1">
                      <select
                        value={row.port}
                        onChange={(e) => updateOceanRow(idx, { port: e.target.value as UsPort })}
                        className="rounded bg-transparent px-1 py-0.5 text-zinc-200 outline-none focus:bg-black/30"
                      >
                        {VALID_PORTS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1">
                      <select
                        value={row.destination}
                        onChange={(e) => updateOceanRow(idx, { destination: e.target.value as OceanRoute })}
                        className="rounded bg-transparent px-1 py-0.5 text-zinc-200 outline-none focus:bg-black/30"
                      >
                        {VALID_ROUTES.map((r) => (
                          <option key={r} value={r}>
                            {r === 'klaipeda' ? 'Клайпеда (Литва)' : 'Поти (Грузия)'}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="checkbox"
                        checked={row.hazmat}
                        onChange={(e) => updateOceanRow(idx, { hazmat: e.target.checked })}
                        className="h-4 w-4 accent-orange-500"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="number"
                        value={row.cost}
                        onChange={(e) => updateOceanRow(idx, { cost: Number(e.target.value) || 0 })}
                        className="w-28 rounded bg-transparent px-1 py-0.5 text-right text-zinc-200 outline-none focus:bg-black/30"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      ) : null}

      {tab === 'auction' ? (
        <Section
          title="Аукционные сборы (Copart / IAAI)"
          icon={<Calculator size={18} className="text-orange-400" />}
          actions={<SaveButton onClick={saveAuction} busy={saving} />}
        >
          <div className="mb-3 flex items-center gap-2">
            <button
              type="button"
              onClick={addAuctionRow}
              className="rounded-md bg-zinc-700 px-3 py-1.5 text-xs font-semibold hover:bg-zinc-600"
            >
              + Добавить
            </button>
            <span className="text-xs text-zinc-500">Строк: {auctionFees.length}</span>
          </div>

          <div className="max-h-[600px] overflow-auto rounded-xl border border-white/10">
            <table className="min-w-full text-xs">
              <thead className="sticky top-0 bg-black/60 text-left text-[10px] uppercase tracking-wide text-zinc-400">
                <tr>
                  <th className="px-2 py-2">Аукцион</th>
                  <th className="px-2 py-2">Мин $</th>
                  <th className="px-2 py-2">Макс $</th>
                  <th className="px-2 py-2">Flat $</th>
                  <th className="px-2 py-2">% (0.06=6%)</th>
                  <th className="px-2 py-2">Internet bid $</th>
                  <th className="px-2 py-2">Service $</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {auctionFees.map((row, idx) => (
                  <tr key={`af-${idx}`} className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="px-2 py-1">
                      <select
                        value={row.auction}
                        onChange={(e) => updateAuctionRow(idx, { auction: e.target.value as AuctionKey })}
                        className="rounded bg-transparent px-1 py-0.5 text-zinc-200 outline-none focus:bg-black/30"
                      >
                        {VALID_AUCTIONS.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                    </td>
                    {(['minPrice', 'maxPrice', 'flatFee', 'pctFee', 'internetBidFee', 'serviceFee'] as const).map(
                      (field) => (
                        <td key={field} className="px-2 py-1">
                          <input
                            type="number"
                            step="0.01"
                            value={(row as any)[field] ?? ''}
                            onChange={(e) =>
                              updateAuctionRow(idx, {
                                [field]:
                                  e.target.value === ''
                                    ? field === 'flatFee' || field === 'pctFee'
                                      ? null
                                      : 0
                                    : Number(e.target.value) || 0,
                              } as any)
                            }
                            className="w-24 rounded bg-transparent px-1 py-0.5 text-right text-zinc-200 outline-none focus:bg-black/30"
                          />
                        </td>
                      ),
                    )}
                    <td className="px-2 py-1 text-right">
                      <button
                        type="button"
                        onClick={() => removeAuctionRow(idx)}
                        className="text-xs text-rose-400 hover:text-rose-300"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      ) : null}

      {tab === 'margins' ? (
        <Section
          title="Маржа E-trade по этапам"
          icon={<RefreshCw size={18} className="text-orange-400" />}
          actions={<SaveButton onClick={saveMargins} busy={saving} />}
        >
          <p className="mb-3 text-xs text-zinc-500">
            Указывай маржу в USD за каждый этап. Итог автоматически добавляется к расчёту.
          </p>
          <div className="space-y-2">
            {(Object.keys(STAGE_LABELS) as CalcStageKey[]).map((stage) => {
              const m = stageMargins.find((x) => x.stage === stage) || { stage, marginUsd: 0, enabled: true };
              return (
                <div key={stage} className="flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-black/20 p-3">
                  <span className="min-w-[220px] text-sm text-zinc-200">{STAGE_LABELS[stage]}</span>
                  <input
                    type="number"
                    value={m.marginUsd}
                    onChange={(e) => updateMargin(stage, { marginUsd: Number(e.target.value) || 0 })}
                    className="w-32 rounded-md border border-white/10 bg-black/30 px-3 py-1.5 text-right text-sm text-zinc-100 outline-none focus:border-orange-500"
                  />
                  <span className="text-xs text-zinc-500">USD</span>
                  <label className="inline-flex items-center gap-1.5 text-xs text-zinc-300">
                    <input
                      type="checkbox"
                      checked={m.enabled}
                      onChange={(e) => updateMargin(stage, { enabled: e.target.checked })}
                      className="h-4 w-4 accent-orange-500"
                    />
                    Активна
                  </label>
                </div>
              );
            })}
            <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-3 text-sm text-orange-200">
              Итого маржа: $
              {stageMargins
                .filter((m) => m.enabled)
                .reduce((sum, m) => sum + Number(m.marginUsd || 0), 0)
                .toFixed(2)}
            </div>
          </div>
        </Section>
      ) : null}

      {tab === 'land' ? (
        <Section
          title="Наземная доставка"
          icon={<Calculator size={18} className="text-orange-400" />}
          actions={<SaveButton onClick={saveSettings} busy={saving} />}
        >
          <p className="mb-3 text-xs text-zinc-500">
            Стоимость наземной доставки от порта прибытия до Минска.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Клайпеда → Минск (USD)"
              value={land.klaipeda_to_minsk_usd}
              onChange={(v) => setLandValue('klaipeda_to_minsk_usd', v)}
            />
            <Input
              label="Поти → Минск (USD)"
              value={land.poti_to_minsk_usd}
              onChange={(v) => setLandValue('poti_to_minsk_usd', v)}
            />
          </div>
        </Section>
      ) : null}

      {tab === 'settings' ? (
        <>
          <Section title="Курсы и общие услуги" icon={<RefreshCw size={18} className="text-orange-400" />} actions={<SaveButton onClick={saveSettings} busy={saving} />}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="USD/BYN" value={config.rates.usd_byn} onChange={(v) => setConfigValue('rates', 'usd_byn', v)} />
              <Input label="EUR/USD" value={config.rates.eur_usd} onChange={(v) => setConfigValue('rates', 'eur_usd', v)} />
              <Input label="Стоимость наших услуг (BYN)" value={config.costs.our_services_byn} onChange={(v) => setConfigValue('costs', 'our_services_byn', v)} />
              <Input label="Расходы на СВХ (BYN)" value={config.costs.svh_byn} onChange={(v) => setConfigValue('costs', 'svh_byn', v)} />
              <Input label="OpenAI модель" value={config.policies.ai_model} onChange={(v) => setConfigValue('policies', 'ai_model', v)} />
            </div>
          </Section>

          <Section title="Fallback ставки (если в БД нет точного совпадения)" icon={<Calculator size={18} className="text-orange-400" />} actions={<SaveButton onClick={saveSettings} busy={saving} />}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Аукционный сбор (USD)" value={config.fallback.auction_fee_usd} onChange={(v) => setConfigValue('fallback', 'auction_fee_usd', v)} />
              <Input label="До порта США (USD)" value={config.fallback.delivery_to_usa_port_usd} onChange={(v) => setConfigValue('fallback', 'delivery_to_usa_port_usd', v)} />
              <Input label="Море до Клайпеды (USD)" value={config.fallback.ocean_to_klaipeda_usd} onChange={(v) => setConfigValue('fallback', 'ocean_to_klaipeda_usd', v)} />
              <Input label="Море до Поти (USD)" value={config.fallback.ocean_to_poti_usd} onChange={(v) => setConfigValue('fallback', 'ocean_to_poti_usd', v)} />
              <Input label="Таможенный сбор (BYN)" value={config.fallback.customs_fee_byn} onChange={(v) => setConfigValue('fallback', 'customs_fee_byn', v)} />
              <Input label="Утильсбор 0-3 (BYN)" value={config.fallback.recycling_0_3_byn} onChange={(v) => setConfigValue('fallback', 'recycling_0_3_byn', v)} />
              <Input label="Утильсбор 3-5 (BYN)" value={config.fallback.recycling_3_5_byn} onChange={(v) => setConfigValue('fallback', 'recycling_3_5_byn', v)} />
              <Input label="Утильсбор 5-7 (BYN)" value={config.fallback.recycling_5_7_byn} onChange={(v) => setConfigValue('fallback', 'recycling_5_7_byn', v)} />
              <Input label="Утильсбор 7+ (BYN)" value={config.fallback.recycling_7_plus_byn} onChange={(v) => setConfigValue('fallback', 'recycling_7_plus_byn', v)} />
            </div>
          </Section>
        </>
      ) : null}
    </div>
  );
}

function seedOceanMatrix(existing: OceanRate[]): OceanRate[] {
  const result: OceanRate[] = [];
  for (const port of VALID_PORTS) {
    for (const dest of VALID_ROUTES) {
      for (const hazmat of [false, true]) {
        const found = existing.find((r) => r.port === port && r.destination === dest && r.hazmat === hazmat);
        result.push(
          found || {
            port,
            destination: dest,
            hazmat,
            cost: 0,
            currency: 'USD',
          },
        );
      }
    }
  }
  return result;
}

function Section({
  title,
  icon,
  children,
  actions,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          {icon}
          {title}
        </h2>
        {actions}
      </div>
      {children}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | string;
  onChange: (value: string) => void;
}) {
  const isString = typeof value === 'string';

  return (
    <div>
      <label className="mb-1 block text-sm text-zinc-400">{label}</label>
      <input
        type={isString ? 'text' : 'number'}
        step={isString ? undefined : '0.01'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-orange-500"
      />
    </div>
  );
}

function UploadInput({
  label,
  busy,
  onSelect,
}: {
  label: string;
  busy: boolean;
  onSelect: (file: File | null) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 hover:border-orange-500 transition-colors">
      <Upload size={14} />
      {busy ? 'Загрузка...' : label}
      <input
        type="file"
        className="hidden"
        accept=".xlsx,.xls,.csv,.txt"
        onChange={(event) => onSelect(event.target.files?.[0] ?? null)}
        disabled={busy}
      />
    </label>
  );
}

function SaveButton({ onClick, busy }: { onClick: () => void; busy: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold hover:bg-green-500 transition-colors disabled:opacity-60"
    >
      {busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
      {busy ? 'Сохранение...' : 'Сохранить'}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-center">
      <div className="text-2xl font-bold text-orange-300">{value}</div>
      <div className="text-xs text-zinc-400">{label}</div>
    </div>
  );
}
