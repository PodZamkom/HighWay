'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, Info, Loader2 } from 'lucide-react';
import type { CalculatorDeliveryOption, CalculatorFormContent, CalculatorSelectOption } from '@/types/site';

type CalculatorForm = {
    transport: string;
    platform: string;
    auction: string;
    deliveryTo: string;
    carPrice: number;
    year: number | null;
    age: number;
    engine: number;
    enginePower: number;
    preferential: boolean;
    isGibrid: boolean;
    isSUV: boolean;
    isConnectableGibrid: boolean;
    fuel: 'gasoline' | 'diesel';
    weight: number;
    length: number;
    boatType: string;
    trailerWithBoat: boolean;
    NDSReturn: boolean;
    deliveryViaGermany: boolean;
    deliveryViaPoti: boolean;
    deliveryMethod: 'autovoz' | 'tent' | null;
    ptsRF: boolean;
    isRetroAuto: boolean;
    deliveryToHome: boolean;
    isOffside: boolean;
    commercialRecyclingFee: number;
};

type CalculatorResult = {
    carPrice: string;
    carPrice_CUR: string;
    auctionFee: string;
    auctionFee_CUR: string;
    deliveryToPortUSA: string;
    deliveryToPortUSA_CUR: string;
    deliveryFromPortUSA: string;
    deliveryFromPortUSA_CUR: string;
    fromKlaipeda: string;
    fromKlaipeda_CUR: string;
    ourServicePrice: string;
    ourServicePrice_CUR: string;
    customDuty: string;
    customDuty_CUR: string;
    customFee: string;
    customFee_CUR: string;
    junkFee: string;
    junkFee_CUR: string;
    svxServicePrice: string;
    svxServicePrice_CUR: string;
    resultPrice: string;
    resultPrice_CUR: string;
};

type CalculatorApiResponse = {
    success: boolean;
    data?: CalculatorResult;
};

const API_BASE = 'https://old.westmotors.by/themes/autousa/is/wm-calculator/calculator/api';

const DEFAULT_FORM: CalculatorForm = {
    transport: 'auto',
    platform: '',
    auction: 'Copart',
    deliveryTo: 'by',
    carPrice: 3000,
    year: null,
    age: 1,
    engine: 2000,
    enginePower: 90,
    preferential: false,
    isGibrid: false,
    isSUV: false,
    isConnectableGibrid: false,
    fuel: 'gasoline',
    weight: 0,
    length: 0,
    boatType: 'motor',
    trailerWithBoat: true,
    NDSReturn: false,
    deliveryViaGermany: true,
    deliveryViaPoti: false,
    deliveryMethod: 'autovoz',
    ptsRF: false,
    isRetroAuto: false,
    deliveryToHome: false,
    isOffside: false,
    commercialRecyclingFee: 0,
};

interface LandingPriceCalculatorProps {
    content: CalculatorFormContent;
}

function parseNumber(value: string | number | null | undefined): number {
    if (value == null) return 0;
    if (typeof value === 'number') return value;

    const normalized = value.replace(/\s+/g, '').replace(/,/g, '').replace(/[^\d.-]/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
}

function isPositive(value: string | number | null | undefined): boolean {
    return parseNumber(value) > 0;
}

function applyTemplate(template: string, city: string): string {
    return template.replace('{city}', city);
}

function rowLabelDeliveryFromPort(
    form: CalculatorForm,
    delivery: CalculatorDeliveryOption | undefined,
    content: CalculatorFormContent
): string {
    if (form.deliveryViaPoti) return content.rowLabels.deliveryFromPortToPoti;
    if (!delivery) return content.rowLabels.deliveryFromPortDefault;
    return applyTemplate(content.rowLabels.deliveryFromPortToCityTemplate, delivery.cityName);
}

function rowLabelFromKlaipeda(
    form: CalculatorForm,
    delivery: CalculatorDeliveryOption | undefined,
    content: CalculatorFormContent
): string {
    if (!delivery) return content.rowLabels.deliveryToDestinationDefault;
    const destination = delivery.cityNameOld ?? delivery.name;

    if (form.deliveryViaPoti || form.deliveryTo === 'kz' || form.deliveryTo === 'kz_as') {
        return applyTemplate(content.rowLabels.deliveryFromPotiToTemplate, destination);
    }

    return applyTemplate(content.rowLabels.deliveryFromKlaipedaToTemplate, destination);
}

function sanitizePriceInput(value: number): number {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100000, Math.round(value)));
}

export function LandingPriceCalculator({ content }: LandingPriceCalculatorProps) {
    const [form, setForm] = useState<CalculatorForm>(DEFAULT_FORM);
    const [platforms, setPlatforms] = useState<CalculatorSelectOption[]>([content.options.platformDefault]);
    const [result, setResult] = useState<CalculatorResult | null>(null);
    const [isLoadingResult, setIsLoadingResult] = useState(false);
    const [isLoadingPlatforms, setIsLoadingPlatforms] = useState(false);
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const deliveryOption = useMemo(
        () => content.options.deliveries.find((item) => item.key === form.deliveryTo),
        [form.deliveryTo, content.options.deliveries]
    );

    useEffect(() => {
        setPlatforms([content.options.platformDefault]);
    }, [content.options.platformDefault]);

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const fetchPlatforms = async () => {
            setIsLoadingPlatforms(true);
            try {
                const response = await fetch(`${API_BASE}/getPlatforms.php?auction=${encodeURIComponent(form.auction)}`, {
                    signal: controller.signal,
                });
                const data = (await response.json()) as CalculatorSelectOption[];

                if (!isMounted) return;

                const safeData = Array.isArray(data) && data.length > 0
                    ? data
                    : [content.options.platformDefault];

                setPlatforms(safeData);

                setForm((prev) => {
                    const hasCurrent = safeData.some((item) => item.key === prev.platform);
                    return hasCurrent ? prev : { ...prev, platform: safeData[0]?.key ?? '' };
                });
            } catch (fetchError) {
                if (controller.signal.aborted) return;
                if (!isMounted) return;

                setPlatforms([content.options.platformDefault]);
                setForm((prev) => ({ ...prev, platform: '' }));
            } finally {
                if (isMounted) {
                    setIsLoadingPlatforms(false);
                }
            }
        };

        fetchPlatforms();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [form.auction, content.options.platformDefault]);

    useEffect(() => {
        const controller = new AbortController();

        const timer = setTimeout(async () => {
            setIsLoadingResult(true);
            setError(null);

            try {
                const response = await fetch(`${API_BASE}/doCalculate.php`, {
                    method: 'POST',
                    cache: 'no-cache',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(form),
                    signal: controller.signal,
                });

                const data = (await response.json()) as CalculatorApiResponse;

                if (data.success && data.data) {
                    setResult(data.data);
                } else {
                    setError(content.errors.calculationFailed);
                }
            } catch (fetchError) {
                if (!controller.signal.aborted) {
                    setError(content.errors.connectionFailed);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoadingResult(false);
                }
            }
        }, 200);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [form, content.errors.calculationFailed, content.errors.connectionFailed]);

    const updateForm = (patch: Partial<CalculatorForm>) => {
        setForm((prev) => ({ ...prev, ...patch }));
    };

    const onTransportChange = (transport: string) => {
        const isHybrid = transport.includes('hybrid');
        const isSuv = transport.includes('suv') || transport === 'pickup';

        updateForm({
            transport,
            isGibrid: isHybrid,
            isSUV: isSuv,
        });
    };

    const onDownloadPdf = async () => {
        try {
            setIsDownloadingPdf(true);
            const response = await fetch(`${API_BASE}/doCalculate.php?as-pdf=1`, {
                method: 'POST',
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(form),
            });

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');

            link.href = url;
            link.download = `highway-calculation-${Date.now()}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } finally {
            setIsDownloadingPdf(false);
        }
    };

    const resultReady = result && !error;

    return (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-7">
                <CalculatorSelect
                    label={content.labels.transport}
                    value={form.transport}
                    onChange={(value) => onTransportChange(value)}
                    options={content.options.transports}
                    withInfoIcon
                />

                <div>
                    <label className="mb-2 inline-flex items-center gap-1 text-sm uppercase tracking-wide text-slate-400">
                        {content.labels.carPrice}
                        <Info size={12} />
                    </label>
                    <div className="mb-2 text-4xl font-light text-slate-900">{form.carPrice.toLocaleString('ru-RU')}</div>
                    <input
                        type="range"
                        min={0}
                        max={100000}
                        step={100}
                        value={form.carPrice}
                        onChange={(event) => updateForm({ carPrice: sanitizePriceInput(Number(event.target.value)) })}
                        className="w-full accent-rose-500"
                    />
                    <div className="mt-1 flex justify-between text-sm text-slate-400">
                        <span>{content.labels.priceMin}</span>
                        <span>{content.labels.priceMax}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <CalculatorSelect
                        label={content.labels.age}
                        value={String(form.age)}
                        onChange={(value) => updateForm({ age: Number(value) })}
                        options={content.options.ages}
                        withInfoIcon
                    />

                    <div>
                        <label className="mb-2 inline-flex items-center gap-1 text-sm uppercase tracking-wide text-slate-400">
                            {content.labels.engine}
                        </label>
                        <input
                            type="number"
                            min={0}
                            max={10000}
                            step={10}
                            value={form.engine}
                            onChange={(event) => updateForm({ engine: sanitizePriceInput(Number(event.target.value)) })}
                            className="w-full rounded-none border-b border-slate-300 bg-transparent px-0 py-2 text-3xl font-light text-slate-900 outline-none"
                        />
                    </div>
                </div>

                <CalculatorSelect
                    label={content.labels.platform}
                    value={form.platform}
                    onChange={(value) => updateForm({ platform: value })}
                    options={platforms}
                    fallbackLabel={content.labels.platformFallback}
                    disabled={isLoadingPlatforms}
                    withInfoIcon
                />

                <CalculatorSelect
                    label={content.labels.auction}
                    value={form.auction}
                    onChange={(value) => updateForm({ auction: value })}
                    options={content.options.auctions}
                    withInfoIcon
                />

                <CalculatorSelect
                    label={content.labels.deliveryTo}
                    value={form.deliveryTo}
                    onChange={(value) => updateForm({ deliveryTo: value })}
                    options={content.options.deliveries}
                    withInfoIcon
                />

                <div className="space-y-3 pt-1 text-lg text-slate-800">
                    <label className="flex cursor-pointer items-center gap-3">
                        <input
                            type="checkbox"
                            checked={form.preferential}
                            onChange={(event) => updateForm({ preferential: event.target.checked })}
                            className="h-4 w-4"
                        />
                        <span>{content.labels.preferential}</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-3">
                        <input
                            type="checkbox"
                            checked={form.isOffside}
                            onChange={(event) => updateForm({ isOffside: event.target.checked })}
                            className="h-4 w-4"
                        />
                        <span>{content.labels.offsite}</span>
                    </label>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                {!resultReady && !error && (
                    <div className="flex min-h-[420px] items-center justify-center">
                        <Loader2 className="h-9 w-9 animate-spin text-rose-500" />
                    </div>
                )}

                {error && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                        {error}
                    </div>
                )}

                {resultReady && result && (
                    <div className="space-y-4 text-base leading-[1.2] sm:text-xl">
                        <h3 className="border-b border-rose-300 pb-2 text-2xl font-light text-slate-900 sm:text-3xl">{content.labels.purchaseAndDelivery}</h3>

                        <ResultRow label={content.rowLabels.carPrice} value={result.carPrice} currency={result.carPrice_CUR} />
                        <ResultRow label={content.rowLabels.auctionFee} value={result.auctionFee} currency={result.auctionFee_CUR} />
                        <ResultRow label={content.rowLabels.deliveryToUsaPort} value={result.deliveryToPortUSA} currency={result.deliveryToPortUSA_CUR} />
                        <ResultRow
                            label={rowLabelDeliveryFromPort(form, deliveryOption, content)}
                            value={result.deliveryFromPortUSA}
                            currency={result.deliveryFromPortUSA_CUR}
                        />
                        <ResultRow
                            label={rowLabelFromKlaipeda(form, deliveryOption, content)}
                            value={result.fromKlaipeda}
                            currency={result.fromKlaipeda_CUR}
                            show={isPositive(result.fromKlaipeda)}
                        />
                        <ResultRow label={content.rowLabels.ourServicePrice} value={result.ourServicePrice} currency={result.ourServicePrice_CUR} />

                        <h3 className="border-b border-rose-300 pb-2 pt-4 text-2xl font-light text-slate-900 sm:text-3xl">{content.labels.customsAndClearance}</h3>

                        <ResultRow label={content.rowLabels.customDuty} value={result.customDuty} currency={result.customDuty_CUR} />
                        <ResultRow label={content.rowLabels.customFee} value={result.customFee} currency={result.customFee_CUR} show={isPositive(result.customFee)} />
                        <ResultRow label={content.rowLabels.junkFee} value={result.junkFee} currency={result.junkFee_CUR} show={isPositive(result.junkFee)} />
                        <ResultRow label={content.rowLabels.svxServicePrice} value={result.svxServicePrice} currency={result.svxServicePrice_CUR} show={isPositive(result.svxServicePrice)} />

                        <div className="flex items-end justify-between border-t border-slate-200 pt-4 text-2xl font-medium sm:text-3xl">
                            <span className="text-slate-900">{content.labels.total}</span>
                            <span className="text-rose-500">
                                {result.resultPrice} {result.resultPrice_CUR}
                            </span>
                        </div>

                        <p className="text-lg text-rose-500">{content.labels.disclaimer}</p>

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={onDownloadPdf}
                                disabled={isDownloadingPdf || isLoadingResult}
                                className="inline-flex items-center gap-2 rounded-md border border-blue-600 px-3 py-2 text-sm text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                                title={content.labels.downloadPdfTitle}
                            >
                                {isDownloadingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                                {content.labels.downloadPdfButton}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function CalculatorSelect({
    label,
    value,
    onChange,
    options,
    fallbackLabel,
    disabled,
    withInfoIcon = false,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: CalculatorSelectOption[];
    fallbackLabel?: string;
    disabled?: boolean;
    withInfoIcon?: boolean;
}) {
    return (
        <div>
            <label className="mb-2 inline-flex items-center gap-1 text-sm uppercase tracking-wide text-slate-400">
                {label}
                {withInfoIcon ? <Info size={12} /> : null}
            </label>
            <select
                className="w-full rounded-none border-b border-slate-300 bg-transparent px-0 py-3 text-3xl font-light text-slate-900 outline-none"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                disabled={disabled}
            >
                {options.map((item, index) => (
                    <option key={`${item.key}-${index}`} value={item.key}>
                        {item.name || fallbackLabel}
                    </option>
                ))}
            </select>
        </div>
    );
}

function ResultRow({
    label,
    value,
    currency,
    show = true,
}: {
    label: string;
    value: string;
    currency: string;
    show?: boolean;
}) {
    if (!show) {
        return null;
    }

    return (
        <div className="flex items-center justify-between gap-4 text-base font-light sm:text-xl">
            <span className="text-slate-800">{label}</span>
            <span className="whitespace-nowrap text-rose-500">
                {value} {currency}
            </span>
        </div>
    );
}
