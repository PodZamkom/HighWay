'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, Info, Loader2 } from 'lucide-react';

type SelectOption = {
    key: string;
    name: string;
};

type DeliveryOption = SelectOption & {
    cityName: string;
    cityNameOld?: string;
};

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

const TRANSPORTS: SelectOption[] = [
    { key: 'auto', name: 'Автомобиль' },
    { key: 'electro', name: 'Электромобиль' },
    { key: 'electro_suv', name: 'Электромобиль SUV' },
    { key: 'auto_suv', name: 'Внедорожник SUV' },
    { key: 'hybrid', name: 'Гибрид' },
    { key: 'hybrid_suv', name: 'Гибрид SUV' },
    { key: 'moto', name: 'Мотоцикл' },
    { key: 'moto-big', name: 'Большой мотоцикл' },
    { key: 'quadro', name: 'Квадроцикл' },
    { key: 'baggi', name: 'Багги' },
    { key: 'tricycle', name: 'Трицикл' },
];

const AUCTIONS: SelectOption[] = [
    { key: 'Copart', name: 'Copart' },
    { key: 'CrashedToys', name: 'CrashedToys (Copart)' },
    { key: 'Iaai', name: 'IAAI' },
    { key: 'RecRides', name: 'RecRides (IAAI)' },
    { key: 'Impact_canada', name: 'Impact (Канада)' },
    { key: 'Copart_canada', name: 'Copart Canada' },
];

const DELIVERIES: DeliveryOption[] = [
    { key: 'by', name: 'Беларусь, Минск', cityName: 'Клайпеды', cityNameOld: 'Минска' },
    { key: 'ru', name: 'Россия, Москва', cityName: 'Клайпеды', cityNameOld: 'Москвы' },
    { key: 'ru_spb', name: 'Россия, Санкт-Петербург', cityName: 'Клайпеды', cityNameOld: 'Санкт-Петербурга' },
    { key: 'ru_krd', name: 'Россия, Краснодар', cityName: 'Клайпеды', cityNameOld: 'Краснодара' },
    { key: 'ua', name: 'Украина, Одесса', cityName: 'Одессы' },
    { key: 'kg', name: 'Киргизия, Бишкек', cityName: 'Поти', cityNameOld: 'Бишкека' },
    { key: 'uz', name: 'Узбекистан, Ташкент', cityName: 'Поти', cityNameOld: 'Ташкента' },
    { key: 'az', name: 'Азербайджан, Баку', cityName: 'Поти', cityNameOld: 'Баку' },
    { key: 'kz', name: 'Казахстан, Алматы', cityName: 'Поти', cityNameOld: 'Алматы' },
    { key: 'kz_as', name: 'Казахстан, Астана', cityName: 'Поти', cityNameOld: 'Астаны' },
    { key: 'pl', name: 'Польша, Варшава', cityName: 'порта Бременхафен (Германия)' },
    { key: 'ge', name: 'Грузия, Поти', cityName: 'Поти' },
];

const AGES: SelectOption[] = [
    { key: '0', name: 'Менее года' },
    ...Array.from({ length: 15 }, (_, index) => ({ key: String(index + 1), name: String(index + 1) })),
    { key: '16', name: 'Более 15' },
];

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

function rowLabelDeliveryFromPort(form: CalculatorForm, delivery: DeliveryOption | undefined): string {
    if (form.deliveryViaPoti) return 'Доставка от порта до Поти';
    if (!delivery) return 'Доставка от порта';

    return `Доставка от порта до ${delivery.cityName}`;
}

function rowLabelFromKlaipeda(form: CalculatorForm, delivery: DeliveryOption | undefined): string {
    if (!delivery) return 'Доставка до конечного пункта';

    if (form.deliveryViaPoti || form.deliveryTo === 'kz' || form.deliveryTo === 'kz_as') {
        return `Доставка от Поти до ${delivery.cityNameOld ?? delivery.name}`;
    }

    return `Доставка от Клайпеды до ${delivery.cityNameOld ?? delivery.name}`;
}

function sanitizePriceInput(value: number): number {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100000, Math.round(value)));
}

export function LandingPriceCalculator() {
    const [form, setForm] = useState<CalculatorForm>(DEFAULT_FORM);
    const [platforms, setPlatforms] = useState<SelectOption[]>([{ key: '', name: 'Выберите площадку' }]);
    const [result, setResult] = useState<CalculatorResult | null>(null);
    const [isLoadingResult, setIsLoadingResult] = useState(false);
    const [isLoadingPlatforms, setIsLoadingPlatforms] = useState(false);
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const deliveryOption = useMemo(
        () => DELIVERIES.find((item) => item.key === form.deliveryTo),
        [form.deliveryTo]
    );

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const fetchPlatforms = async () => {
            setIsLoadingPlatforms(true);
            try {
                const response = await fetch(`${API_BASE}/getPlatforms.php?auction=${encodeURIComponent(form.auction)}`, {
                    signal: controller.signal,
                });
                const data = (await response.json()) as SelectOption[];

                if (!isMounted) return;

                const safeData = Array.isArray(data) && data.length > 0
                    ? data
                    : [{ key: '', name: 'Выберите площадку' }];

                setPlatforms(safeData);

                setForm((prev) => {
                    const hasCurrent = safeData.some((item) => item.key === prev.platform);
                    return hasCurrent ? prev : { ...prev, platform: safeData[0]?.key ?? '' };
                });
            } catch (fetchError) {
                if (controller.signal.aborted) return;
                if (!isMounted) return;

                setPlatforms([{ key: '', name: 'Выберите площадку' }]);
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
    }, [form.auction]);

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
                    setError('Не удалось получить расчет. Проверьте параметры и попробуйте снова.');
                }
            } catch (fetchError) {
                if (!controller.signal.aborted) {
                    setError('Ошибка соединения с калькулятором.');
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
    }, [form]);

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
                <div>
                    <label className="mb-2 inline-flex items-center gap-1 text-sm uppercase tracking-wide text-slate-400">
                        Тип транспорта
                        <Info size={12} />
                    </label>
                    <select
                        className="w-full rounded-none border-b border-slate-300 bg-transparent px-0 py-3 text-3xl font-light text-slate-900 outline-none"
                        value={form.transport}
                        onChange={(event) => onTransportChange(event.target.value)}
                    >
                        {TRANSPORTS.map((item) => (
                            <option key={item.key} value={item.key}>
                                {item.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="mb-2 inline-flex items-center gap-1 text-sm uppercase tracking-wide text-slate-400">
                        Стоимость авто, $
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
                        <span>0 $</span>
                        <span>100 000 $</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                        <label className="mb-2 inline-flex items-center gap-1 text-sm uppercase tracking-wide text-slate-400">
                            Возраст авто, лет
                            <Info size={12} />
                        </label>
                        <select
                            className="w-full rounded-none border-b border-slate-300 bg-transparent px-0 py-2 text-3xl font-light text-slate-900 outline-none"
                            value={String(form.age)}
                            onChange={(event) => updateForm({ age: Number(event.target.value) })}
                        >
                            {AGES.map((item) => (
                                <option key={item.key} value={item.key}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="mb-2 inline-flex items-center gap-1 text-sm uppercase tracking-wide text-slate-400">
                            Объем двигателя, куб.см.
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

                <div>
                    <label className="mb-2 inline-flex items-center gap-1 text-sm uppercase tracking-wide text-slate-400">
                        Площадка
                        <Info size={12} />
                    </label>
                    <select
                        className="w-full rounded-none border-b border-slate-300 bg-transparent px-0 py-3 text-3xl font-light text-slate-900 outline-none"
                        value={form.platform}
                        onChange={(event) => updateForm({ platform: event.target.value })}
                        disabled={isLoadingPlatforms}
                    >
                        {platforms.map((item, index) => (
                            <option key={`${item.key}-${index}`} value={item.key}>
                                {item.name || 'Выберите площадку'}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="mb-2 inline-flex items-center gap-1 text-sm uppercase tracking-wide text-slate-400">
                        Выбор аукциона
                        <Info size={12} />
                    </label>
                    <select
                        className="w-full rounded-none border-b border-slate-300 bg-transparent px-0 py-3 text-3xl font-light text-slate-900 outline-none"
                        value={form.auction}
                        onChange={(event) => updateForm({ auction: event.target.value })}
                    >
                        {AUCTIONS.map((item) => (
                            <option key={item.key} value={item.key}>
                                {item.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="mb-2 inline-flex items-center gap-1 text-sm uppercase tracking-wide text-slate-400">
                        Доставка в
                        <Info size={12} />
                    </label>
                    <select
                        className="w-full rounded-none border-b border-slate-300 bg-transparent px-0 py-3 text-3xl font-light text-slate-900 outline-none"
                        value={form.deliveryTo}
                        onChange={(event) => updateForm({ deliveryTo: event.target.value })}
                    >
                        {DELIVERIES.map((item) => (
                            <option key={item.key} value={item.key}>
                                {item.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-3 pt-1 text-lg text-slate-800">
                    <label className="flex cursor-pointer items-center gap-3">
                        <input
                            type="checkbox"
                            checked={form.preferential}
                            onChange={(event) => updateForm({ preferential: event.target.checked })}
                            className="h-4 w-4"
                        />
                        <span>Льготная растаможка</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-3">
                        <input
                            type="checkbox"
                            checked={form.isOffside}
                            onChange={(event) => updateForm({ isOffside: event.target.checked })}
                            className="h-4 w-4"
                        />
                        <span>Offsite</span>
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
                        <h3 className="border-b border-rose-300 pb-2 text-2xl font-light text-slate-900 sm:text-3xl">Покупка и доставка</h3>

                        <ResultRow label="Стоимость авто" value={result.carPrice} currency={result.carPrice_CUR} />
                        <ResultRow label="Аукционный сбор" value={result.auctionFee} currency={result.auctionFee_CUR} />
                        <ResultRow label="Транспортировка в порт США" value={result.deliveryToPortUSA} currency={result.deliveryToPortUSA_CUR} />
                        <ResultRow
                            label={rowLabelDeliveryFromPort(form, deliveryOption)}
                            value={result.deliveryFromPortUSA}
                            currency={result.deliveryFromPortUSA_CUR}
                        />
                        <ResultRow
                            label={rowLabelFromKlaipeda(form, deliveryOption)}
                            value={result.fromKlaipeda}
                            currency={result.fromKlaipeda_CUR}
                            show={isPositive(result.fromKlaipeda)}
                        />
                        <ResultRow label="Стоимость наших услуг" value={result.ourServicePrice} currency={result.ourServicePrice_CUR} />

                        <h3 className="border-b border-rose-300 pb-2 pt-4 text-2xl font-light text-slate-900 sm:text-3xl">Растаможка и оформление</h3>

                        <ResultRow label="Таможенная пошлина" value={result.customDuty} currency={result.customDuty_CUR} />
                        <ResultRow label="Таможенный сбор" value={result.customFee} currency={result.customFee_CUR} show={isPositive(result.customFee)} />
                        <ResultRow label="Утилизационный сбор" value={result.junkFee} currency={result.junkFee_CUR} show={isPositive(result.junkFee)} />
                        <ResultRow label="Расходы на СВХ" value={result.svxServicePrice} currency={result.svxServicePrice_CUR} show={isPositive(result.svxServicePrice)} />

                        <div className="flex items-end justify-between border-t border-slate-200 pt-4 text-2xl font-medium sm:text-3xl">
                            <span className="text-slate-900">ИТОГО</span>
                            <span className="text-rose-500">
                                {result.resultPrice} {result.resultPrice_CUR}
                            </span>
                        </div>

                        <p className="text-lg text-rose-500">
                            * В расчет не входят комиссии за переводы. Все суммы действительны на дату расчёта и могут изменяться.
                        </p>

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={onDownloadPdf}
                                disabled={isDownloadingPdf || isLoadingResult}
                                className="inline-flex items-center gap-2 rounded-md border border-blue-600 px-3 py-2 text-sm text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                                title="Скачать PDF"
                            >
                                {isDownloadingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                                PDF
                            </button>
                        </div>
                    </div>
                )}
            </div>
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
