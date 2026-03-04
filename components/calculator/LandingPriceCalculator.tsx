'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, Info, Loader2 } from 'lucide-react';
import { AGE_PRESETS } from '@/lib/calculatorDefaults';
import type {
  AgePreset,
  CalculatorOptionsResponse,
  CalculatorResultPayload,
  LocalCalculatorForm,
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
  const [form, setForm] = useState<LocalCalculatorForm>(DEFAULT_FORM);
  const [options, setOptions] = useState<CalculatorOptionsResponse | null>(null);
  const [result, setResult] = useState<CalculatorResultPayload | null>(null);
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
          throw new Error(data?.error || 'Failed to load options');
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
        const response = await fetch('/api/calculator/calculate', {
          method: 'POST',
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ form }),
          signal: controller.signal,
        });
        const data = await response.json();

        if (!response.ok || !data?.success || !data?.data) {
          throw new Error('Calculation failed');
        }

        setResult(data.data);
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
  }, [form, options, content.errors.calculationFailed]);

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
      const response = await fetch('/api/calculator/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form }),
      });

      if (!response.ok) {
        throw new Error('Failed to build PDF');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `E-TRADE-calculation-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const resultRows = useMemo(() => {
    if (!result) return [];
    return [
      result.carPrice,
      result.auctionFee,
      result.deliveryToPortUSA,
      result.deliveryFromPortUSA,
      result.fromKlaipeda,
      result.ourServicePrice,
    ];
  }, [result]);

  const customsRows = useMemo(() => {
    if (!result) return [];
    return [result.customDuty, result.customFee, result.junkFee, result.svxServicePrice];
  }, [result]);

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
                  value={form.carPrice}
                  min={0}
                  max={100000}
                  step={100}
                  onChange={(event) => updateForm({ carPrice: clamp(Number(event.target.value) || 0, 0, 100000) })}
                  className="mb-2 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xl font-semibold text-slate-900 outline-none focus:border-rose-400"
                />
                <input
                  type="range"
                  min={0}
                  max={100000}
                  step={100}
                  value={form.carPrice}
                  onChange={(event) => updateForm({ carPrice: clamp(Number(event.target.value), 0, 100000) })}
                  className="w-full accent-rose-500"
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
                          ? 'bg-rose-500 text-white'
                          : 'border border-slate-300 bg-white text-slate-700 hover:border-rose-300'
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
                          ? 'bg-rose-500 text-white'
                          : 'border border-slate-300 bg-white text-slate-700 hover:border-rose-300'
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
                    min={0}
                    max={40}
                    value={form.age}
                    onChange={(event) => onAgeInput(Number(event.target.value) || 0)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-base text-slate-900 outline-none focus:border-rose-400"
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
                <SelectField
                  label={content.labels.auction}
                  value={form.auction}
                  onChange={(value) => updateForm({ auction: value })}
                  options={options?.auctions || []}
                  withInfoIcon
                  disabled={isLoadingOptions}
                />
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
                    {content.labels.engine}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={12000}
                    step={10}
                    value={form.engine}
                    onChange={(event) => updateForm({ engine: clamp(Number(event.target.value) || 0, 0, 12000) })}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-rose-400"
                  />
                </div>
                <label className="mt-6 flex cursor-pointer items-center gap-2 text-xs text-slate-700 sm:mt-5">
                  <input
                    type="checkbox"
                    checked={form.preferential}
                    onChange={(event) => updateForm({ preferential: event.target.checked })}
                    className="h-4 w-4"
                  />
                  <span>{content.labels.preferential}</span>
                </label>
              </div>
            </div>
          </div>

          <div className={`h-full border-t border-slate-200 p-3 md:border-l md:border-t-0 md:p-4 ${mobileView === 'result' ? 'block' : 'hidden md:block'}`}>
            <div className="h-full overflow-y-auto rounded-lg border border-slate-100 bg-white p-3">
              {isLoadingResult && !result && (
                <div className="flex min-h-[260px] items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
                </div>
              )}

              {error && (
                <div className="rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">{error}</div>
              )}

              {result && !error && (
                <div className="space-y-3">
                  <h3 className="border-b border-rose-300 pb-1 text-base font-semibold text-slate-900">{content.labels.purchaseAndDelivery}</h3>
                  {resultRows.map((item, index) => (
                    <ResultRow key={`${item.label}-${index}`} label={item.label} value={formatMoney(item.value, item.currency)} />
                  ))}

                  <h3 className="border-b border-rose-300 pb-1 pt-2 text-base font-semibold text-slate-900">{content.labels.customsAndClearance}</h3>
                  {customsRows.map((item, index) => (
                    <ResultRow key={`${item.label}-${index}`} label={item.label} value={formatMoney(item.value, item.currency)} />
                  ))}

                  <div className="flex items-end justify-between border-t border-slate-200 pt-3 text-xl font-semibold">
                    <span className="text-slate-900">{content.labels.total}</span>
                    <span className="text-rose-500">{formatMoney(result.total.value, result.total.currency)}</span>
                  </div>

                  <p className="text-[11px] text-rose-500">{content.labels.disclaimer}</p>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={onDownloadPdf}
                      disabled={isDownloadingPdf || isLoadingResult}
                      className="inline-flex items-center gap-2 rounded-md border border-slate-900 px-3 py-1.5 text-xs text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      title={content.labels.downloadPdfTitle}
                    >
                      {isDownloadingPdf ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                      {content.labels.downloadPdfButton}
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
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-rose-400"
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
      <span className="whitespace-nowrap font-semibold text-rose-500">{value}</span>
    </div>
  );
}
