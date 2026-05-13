'use client';

import { useEffect, useState } from 'react';
import { Download, Info, Loader2 } from 'lucide-react';
import { AGE_PRESETS } from '@/lib/calculatorDefaults';
import type {
  AgePreset,
  AuctionKey,
  CalcStageRow,
  CalculatorFormV2,
  CalculatorOptionsResponse,
  CalculatorResultV2,
  LocalCalculatorForm,
  OceanRoute,
} from '@/types/calculator';
import type { CalculatorFormContent } from '@/types/site';

const PRICE_PRESETS = [3000, 5000, 10000, 15000, 20000, 30000];

const DEFAULT_FORM: LocalCalculatorForm = {
  transport: 'auto',
  platform: '',
  auction: 'Copart',
  deliveryTo: 'by',
  carPrice: 3000,
  age: 1,
  agePreset: '0_3',
  engine: 2000,
  preferential: false,
};

interface LocationState {
  state: string;
  city: string;
  key: string;
}

const AUCTION_OPTIONS: { key: AuctionKey; name: string }[] = [
  { key: 'COPART', name: 'Copart' },
  { key: 'IAAI', name: 'IAAI' },
];

interface LandingPriceCalculatorProps {
  content: CalculatorFormContent;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function formatMoney(value: number, currency: 'USD' | 'BYN') {
  const amount = value.toLocaleString('ru-RU', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  });
  return `${amount} ${currency}`;
}

export function LandingPriceCalculator({ content }: LandingPriceCalculatorProps) {
  const pdfDownloadLabel = 'Скачать расчет';
  const [form, setForm] = useState<LocalCalculatorForm>(DEFAULT_FORM);
  const [auctionKey, setAuctionKey] = useState<AuctionKey>('COPART');
  const [location, setLocation] = useState<LocationState>({ state: '', city: '', key: '' });
  const [oceanRoute, setOceanRoute] = useState<OceanRoute>('klaipeda');
  const [isHazmat, setIsHazmat] = useState(false);
  const [options, setOptions] = useState<CalculatorOptionsResponse | null>(null);
  const [resultV2, setResultV2] = useState<CalculatorResultV2 | null>(null);
  const [isLoadingResult, setIsLoadingResult] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'form' | 'result'>('form');

  useEffect(() => {
    let active = true;

    const loadOptions = async () => {
      setIsLoadingOptions(true);
      try {
        const response = await fetch('/api/calculator/options', { cache: 'no-store' });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || 'Не удалось загрузить параметры');
        }

        if (!active) return;
        setOptions(data);
        setForm((prev) => ({
          ...prev,
          transport: data.transports?.[0]?.key || prev.transport,
          auction: data.auctions?.[0]?.key || prev.auction,
          deliveryTo: data.deliveries?.[0]?.key || prev.deliveryTo,
          platform: data.platforms?.[0]?.key || prev.platform,
        }));
      } catch {
        if (active) {
          setError(content.errors.connectionFailed);
        }
      } finally {
        if (active) {
          setIsLoadingOptions(false);
        }
      }
    };

    loadOptions();

    return () => {
      active = false;
    };
  }, [content.errors.connectionFailed]);

  useEffect(() => {
    if (!options) return;
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setIsLoadingResult(true);
      setError(null);

      try {
        const formV2: Partial<CalculatorFormV2> = {
          carPrice: form.carPrice,
          age: form.age,
          agePreset: form.agePreset,
          engine: form.engine,
          auction: auctionKey,
          auctionLocationState: location.state,
          auctionLocationCity: location.city,
          oceanRoute,
          isHazmat,
          containerType: 'open',
          titleType: 'clean',
          preferential: form.preferential,
          deliveryTo: form.deliveryTo,
          transport: form.transport,
          platform: form.platform,
        };

        const response = await fetch('/api/calculator/calculate-v2', {
          method: 'POST',
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ form: formV2 }),
          signal: controller.signal,
        });
        const data = await response.json();

        if (!response.ok || !data?.success || !data?.data) {
          throw new Error('Не удалось выполнить расчёт');
        }

        setResultV2(data.data as CalculatorResultV2);
      } catch {
        if (!controller.signal.aborted) {
          setError(content.errors.calculationFailed);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingResult(false);
        }
      }
    }, 180);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [form, auctionKey, location.state, location.city, oceanRoute, isHazmat, options, content.errors.calculationFailed]);

  const updateForm = (patch: Partial<LocalCalculatorForm>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const onAgePresetClick = (preset: AgePreset) => {
    const found = AGE_PRESETS.find((item) => item.key === preset);
    const age = found ? found.min : form.age;
    updateForm({ agePreset: preset, age });
  };

  const onAgeInput = (value: number) => {
    const age = clamp(value, 0, 40);
    updateForm({ age });
  };

  const onDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);

      const formV2: Partial<CalculatorFormV2> = {
        carPrice: form.carPrice,
        age: form.age,
        agePreset: form.agePreset,
        engine: form.engine,
        auction: auctionKey,
        auctionLocationState: location.state,
        auctionLocationCity: location.city,
        oceanRoute,
        isHazmat,
        containerType: 'open',
        titleType: 'clean',
        preferential: form.preferential,
        deliveryTo: form.deliveryTo,
        transport: form.transport,
        platform: form.platform,
      };

      const response = await fetch('/api/calculator/pdf-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form: formV2, result: resultV2, mode: 'client' }),
      });

      if (!response.ok) {
        throw new Error('Не удалось сформировать документ');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Расчет-стоимости-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:h-[75vh] md:min-h-[520px]">
      <div className="flex h-full flex-col">
        <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 p-1 md:hidden">
          <button
            type="button"
            onClick={() => setMobileView('form')}
            className={`rounded-md px-3 py-2 text-sm font-medium transition ${
              mobileView === 'form' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            Параметры
          </button>
          <button
            type="button"
            onClick={() => setMobileView('result')}
            className={`rounded-md px-3 py-2 text-sm font-medium transition ${
              mobileView === 'result' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            Расчет
          </button>
        </div>

        <div className="grid h-full grid-cols-1 md:grid-cols-[1.02fr_0.98fr]">
          <div className={`h-full overflow-y-auto p-3 md:p-4 ${mobileView === 'form' ? 'block' : 'hidden md:block'}`}>
            <div className="space-y-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <label className="mb-1 inline-flex items-center gap-1 text-[11px] uppercase tracking-wide text-slate-500">
                  {content.labels.carPrice}
                  <Info size={11} />
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={form.carPrice}
                  min={0}
                  max={100000}
                  step={100}
                  onChange={(event) => updateForm({ carPrice: clamp(Number(event.target.value) || 0, 0, 100000) })}
                  className="mb-2 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xl font-semibold text-slate-900 outline-none focus:border-orange-400"
                />
                <input
                  type="range"
                  min={0}
                  max={100000}
                  step={100}
                  value={form.carPrice}
                  onChange={(event) => updateForm({ carPrice: clamp(Number(event.target.value), 0, 100000) })}
                  className="w-full accent-orange-500"
                />
                <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                  <span>{content.labels.priceMin}</span>
                  <span>{content.labels.priceMax}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {PRICE_PRESETS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => updateForm({ carPrice: item })}
                      className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                        form.carPrice === item
                          ? 'bg-orange-500 text-white'
                          : 'border border-slate-300 bg-white text-slate-700 hover:border-orange-300'
                      }`}
                    >
                      {item.toLocaleString('ru-RU')}$
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <label className="mb-1 inline-flex items-center gap-1 text-[11px] uppercase tracking-wide text-slate-500">
                  {content.labels.age}
                  <Info size={11} />
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {AGE_PRESETS.map((preset) => (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => onAgePresetClick(preset.key)}
                      className={`rounded px-2 py-1.5 text-left text-xs font-medium transition ${
                        form.agePreset === preset.key
                          ? 'bg-orange-500 text-white'
                          : 'border border-slate-300 bg-white text-slate-700 hover:border-orange-300'
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
                <div className="mt-2">
                  <label className="mb-1 block text-[11px] uppercase tracking-wide text-slate-500">Точный возраст (лет)</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={40}
                    value={form.age}
                    onChange={(event) => onAgeInput(Number(event.target.value) || 0)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-base text-slate-900 outline-none focus:border-orange-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <SelectField
                  label={content.labels.transport}
                  value={form.transport}
                  onChange={(value) => updateForm({ transport: value })}
                  options={options?.transports || []}
                  withInfoIcon
                  disabled={isLoadingOptions}
                />
                <SelectField
                  label={content.labels.platform}
                  value={form.platform}
                  onChange={(value) => updateForm({ platform: value })}
                  options={options?.platforms || []}
                  fallbackLabel={content.labels.platformFallback}
                  withInfoIcon
                  disabled={isLoadingOptions}
                />
                <div>
                  <label className="mb-1 inline-flex items-center gap-1 text-[11px] uppercase tracking-wide text-slate-500">
                    {content.labels.auction}
                    <Info size={12} />
                  </label>
                  <select
                    value={auctionKey}
                    onChange={(event) => setAuctionKey(event.target.value as AuctionKey)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-orange-400"
                  >
                    {AUCTION_OPTIONS.map((item) => (
                      <option key={item.key} value={item.key}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 inline-flex items-center gap-1 text-[11px] uppercase tracking-wide text-slate-500">
                    Площадка авто (штат / город)
                    <Info size={12} />
                  </label>
                  <input
                    type="text"
                    list="calc-locations"
                    value={location.key}
                    onChange={(event) => {
                      const value = event.target.value;
                      const match = (options?.locations || []).find((l) => l.name === value || l.key === value);
                      if (match) {
                        setLocation({ state: match.state, city: match.city, key: match.name });
                      } else {
                        setLocation({ state: '', city: '', key: value });
                      }
                    }}
                    placeholder="Например: NJ - New Jersey · Newark"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-orange-400"
                  />
                  <datalist id="calc-locations">
                    {(options?.locations || []).map((item) => (
                      <option key={item.key} value={item.name} />
                    ))}
                  </datalist>
                </div>
                <SelectField
                  label={content.labels.deliveryTo}
                  value={form.deliveryTo}
                  onChange={(value) => updateForm({ deliveryTo: value })}
                  options={options?.deliveries || []}
                  withInfoIcon
                  disabled={isLoadingOptions}
                />
                <div>
                  <label className="mb-1 inline-flex items-center gap-1 text-[11px] uppercase tracking-wide text-slate-500">
                    Маршрут океан
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {([
                      { key: 'klaipeda', label: 'Клайпеда (Литва)' },
                      { key: 'poti', label: 'Поти (Грузия)' },
                    ] as { key: OceanRoute; label: string }[]).map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setOceanRoute(item.key)}
                        className={`rounded px-2 py-1.5 text-xs font-medium transition ${
                          oceanRoute === item.key
                            ? 'bg-orange-500 text-white'
                            : 'border border-slate-300 bg-white text-slate-700 hover:border-orange-300'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1 inline-flex items-center gap-1 text-[11px] uppercase tracking-wide text-slate-500">
                    {content.labels.engine}
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={12000}
                    step={10}
                    value={form.engine}
                    onChange={(event) => updateForm({ engine: clamp(Number(event.target.value) || 0, 0, 12000) })}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-orange-400"
                  />
                </div>
                <label className="mt-6 flex cursor-pointer items-center gap-2 text-xs text-slate-700 sm:mt-5">
                  <input
                    type="checkbox"
                    checked={form.preferential}
                    onChange={(event) => updateForm({ preferential: event.target.checked })}
                    className="h-4 w-4 accent-orange-500"
                  />
                  <span>{content.labels.preferential}</span>
                </label>
                <label className="mt-6 flex cursor-pointer items-center gap-2 text-xs text-slate-700 sm:mt-5">
                  <input
                    type="checkbox"
                    checked={isHazmat}
                    onChange={(event) => setIsHazmat(event.target.checked)}
                    className="h-4 w-4 accent-orange-500"
                  />
                  <span>Hazmat (электро / гибрид)</span>
                </label>
              </div>
            </div>
          </div>

          <div className={`h-full border-t border-slate-200 p-3 md:border-l md:border-t-0 md:p-4 ${mobileView === 'result' ? 'block' : 'hidden md:block'}`}>
            <div className="h-full overflow-y-auto rounded-lg border border-slate-100 bg-white p-3">
              {isLoadingResult && !resultV2 && (
                <div className="flex min-h-[260px] items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                </div>
              )}

              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">{error}</div>
              )}

              {resultV2 && !error && (
                <div className="space-y-3">
                  <h3 className="border-b border-orange-300 pb-1 text-base font-semibold text-slate-900">
                    {content.labels.purchaseAndDelivery}
                  </h3>
                  {resultV2.stages.map((stage) => (
                    <StageRow key={stage.key} stage={stage} />
                  ))}

                  <div className="flex items-end justify-between border-t border-slate-200 pt-3 text-xl font-semibold">
                    <span className="text-slate-900">{content.labels.total}</span>
                    <span className="text-orange-500">{formatMoney(resultV2.total, 'USD')}</span>
                  </div>

                  {resultV2.meta.port ? (
                    <p className="text-[11px] text-slate-500">
                      Маршрут: {resultV2.meta.port} → {resultV2.meta.route === 'poti' ? 'Поти' : 'Клайпеда'}
                      {resultV2.meta.hazmat ? ' · Hazmat' : ''}
                    </p>
                  ) : null}

                  <p className="text-[11px] text-orange-500">{content.labels.disclaimer}</p>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={onDownloadPdf}
                      disabled={isDownloadingPdf || isLoadingResult}
                      className="inline-flex items-center gap-2 rounded-md border border-slate-900 px-3 py-1.5 text-xs text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      title={pdfDownloadLabel}
                    >
                      {isDownloadingPdf ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                      {pdfDownloadLabel}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  fallbackLabel,
  withInfoIcon,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { key: string; name: string }[];
  fallbackLabel?: string;
  withInfoIcon?: boolean;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 inline-flex items-center gap-1 text-[11px] uppercase tracking-wide text-slate-500">
        {label}
        {withInfoIcon ? <Info size={12} /> : null}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-orange-400"
      >
        {options.length === 0 ? <option value="">{fallbackLabel || '—'}</option> : null}
        {options.map((item, index) => (
          <option key={`${item.key}-${index}`} value={item.key}>
            {item.name || fallbackLabel}
          </option>
        ))}
      </select>
    </div>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-slate-700">{label}</span>
      <span className="whitespace-nowrap font-semibold text-orange-500">{value}</span>
    </div>
  );
}

function StageRow({ stage }: { stage: CalcStageRow }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-slate-700">{stage.label}</span>
      <span className="whitespace-nowrap font-semibold text-orange-500">
        {(stage.cost + stage.margin).toLocaleString('ru-RU', { maximumFractionDigits: 0 })} USD
      </span>
    </div>
  );
}
