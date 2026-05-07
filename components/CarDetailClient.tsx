"use client";

import { useMemo, useState } from 'react';
import { Zap } from 'lucide-react';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { LeadFormModal } from '@/components/LeadFormModal';
import { CarModel } from '@/types/car';
import { availabilityLabel, isInStockAvailability } from '@/lib/catalog/availability';

type CarDetailClientProps = {
    car: CarModel | null;
    catalogLabel: string;
    whatsappLink: string;
};

export function CarDetailClient({ car, catalogLabel, whatsappLink }: CarDetailClientProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const baseBreadcrumbs = [
        { label: 'Главная', href: '/' },
        { label: catalogLabel, href: '/catalog' },
    ];

    const currencySymbol = (currency: string) => {
        switch (currency) {
            case 'EUR': return '€';
            case 'BYN': return 'Br';
            case 'JPY': return '¥';
            case 'CNY': return '¥';
            case 'KRW': return '₩';
            default: return '$';
        }
    };

    const conditionLabel = (condition: string) => {
        switch (condition) {
            case 'New': return 'Новый';
            case 'Used': return 'Б/У';
            case 'Crashed': return 'Битый';
            default: return condition;
        }
    };

    const priceTypeLabel = (priceType: string) => {
        switch (priceType) {
            case 'FOB': return 'Без доставки';
            case 'EXW': return 'Без растаможки';
            case 'OnRoad': return 'Под ключ';
            case 'Estimate': return 'Оценка';
            default: return 'Цена';
        }
    };

    const formatPrice = (value: number | undefined) => {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            return '—';
        }
        return value.toLocaleString();
    };

    if (!car) {
        return (
            <div className="bg-white min-h-screen pb-20 pt-24 text-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <Breadcrumbs
                        items={[...baseBreadcrumbs, { label: 'Автомобиль не найден' }]}
                        tone="light"
                        className="mb-6"
                    />
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-8">
                        <h1 className="text-2xl font-bold mb-2">Авто не найдено</h1>
                        <p className="text-gray-500">Проверьте ссылку или вернитесь в каталог.</p>
                    </div>
                </div>

            </div>
        );
    }

    const images = (car.images || []).filter(Boolean);
    const mainImage = images[activeImageIndex] || images[0];

    const descriptionSections = useMemo(() => splitDescriptionSections(car.description || ''), [car.description]);
    const derivedSpecs = useMemo(() => deriveSpecsFromDescription(car.description || ''), [car.description]);
    const specItems = useMemo(() => buildSpecsList(car, car.description || ''), [car]);
    const quickSpecs = useMemo(
        () =>
            [
                { label: 'Поколение', value: car.generation },
                { label: 'Тип кузова', value: derivedSpecs.bodyType },
                { label: 'Тип двигателя', value: derivedSpecs.engineType },
                { label: 'Привод', value: derivedSpecs.drive },
                { label: 'Коробка', value: derivedSpecs.transmission },
                { label: 'Запас хода', value: derivedSpecs.rangeKm },
                { label: 'Мощность', value: derivedSpecs.power },
                { label: 'Емкость батареи', value: derivedSpecs.battery }
            ].filter((item) => item.value),
        [car.generation, derivedSpecs]
    );

    return (
        <div className="bg-white min-h-screen pb-20 pt-8 text-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <Breadcrumbs
                    items={[...baseBreadcrumbs, { label: `${car.brand} ${car.model}` }]}
                    tone="light"
                    className="mb-7"
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* Left: Images */}
                    <div className="space-y-4 lg:col-span-7">
                        <div className="rounded-xl overflow-hidden border border-gray-200 aspect-[4/3] relative bg-gray-100">
                            {mainImage ? (
                                <img src={mainImage} alt={car.model} className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400">Нет фото</div>
                            )}
                            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded text-xs font-bold border border-gray-200 uppercase text-gray-700">
                                {car.market} • {conditionLabel(car.condition)}
                            </div>
                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded text-xs font-bold border border-gray-200 text-gray-700">
                                {images.length} фото
                            </div>
                        </div>
                        {images.length > 1 ? (
                            <div className="flex gap-3 overflow-x-auto pb-2">
                                {images.map((img, index) => (
                                    <button
                                        key={`${img}-${index}`}
                                        onClick={() => setActiveImageIndex(index)}
                                        className={`relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${index === activeImageIndex ? 'border-orange-500' : 'border-gray-200 hover:border-orange-300'}`}
                                        aria-label={`Фото ${index + 1}`}
                                    >
                                        <img src={img} alt={`${car.model} ${index + 1}`} className="h-full w-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        ) : null}
                    </div>

                    {/* Right: Info */}
                    <div className="lg:col-span-5 space-y-6">
                        <div>
                            <div className="mb-2 text-orange-600 font-bold tracking-wider text-sm uppercase">{car.brand}</div>
                            <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-gray-900">
                                {car.model} {car.generation ? <span className="text-gray-400">{car.generation}</span> : null}
                            </h1>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium text-gray-700">{car.year}</div>
                            <div className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium text-gray-700">{conditionLabel(car.condition)}</div>
                            <div className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium text-gray-700">{car.market}</div>
                            <div className={`px-3 py-1 rounded-full text-sm font-bold ${isInStockAvailability(car.availability) ? 'bg-green-500 text-white' : 'text-gray-500 border border-gray-300'}`}>
                                {availabilityLabel(car.availability)}
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 sm:p-6">
                            <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                                <span className="text-gray-500">{priceTypeLabel(car.price_type)}</span>
                                <span className="break-words text-2xl font-bold text-gray-900 sm:text-right sm:text-3xl">
                                    <span className="whitespace-nowrap">
                                        {currencySymbol(car.price_currency)}
                                        {formatPrice(car.price_value)}
                                    </span>{" "}
                                    <span className="text-sm text-gray-400 sm:text-base">{car.price_currency}</span>
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 sm:text-right">Итог считается по текущему курсу</p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="flex-1 bg-orange-600 text-white font-bold py-4 rounded-xl hover:bg-orange-500 transition-colors shadow-lg shadow-orange-600/20"
                            >
                                Заказать расчет
                            </button>
                            {whatsappLink ? (
                                <a
                                    href={whatsappLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex-1 bg-white border-2 border-green-500 text-green-600 font-bold py-4 rounded-xl hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Zap size={18} /> WhatsApp
                                </a>
                            ) : null}
                        </div>

                        {quickSpecs.length ? (
                            <div>
                                <h3 className="font-bold text-gray-900 mb-3">Ключевые параметры</h3>
                                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                    {quickSpecs.map((item) => (
                                        <div key={item.label} className="flex items-start justify-between gap-3 border-b border-gray-100 py-2">
                                            <dt className="text-gray-400">{item.label}</dt>
                                            <dd className="text-gray-800 text-right max-w-[60%] line-clamp-2">{item.value}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>
                        ) : null}

                    </div>
                </div>

                <div className="mt-14 space-y-12">
                    {descriptionSections.intro ? (
                        <div>
                            <h3 className="font-bold text-gray-900 mb-4">Описание</h3>
                            <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                                {descriptionSections.intro}
                            </div>
                        </div>
                    ) : null}

                    {specItems.length ? (
                        <div>
                            <h3 className="font-bold text-gray-900 mb-4">Характеристики</h3>
                            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3 text-sm">
                                {specItems.map((item) => (
                                    <div key={item.label} className="flex items-start justify-between gap-4 border-b border-gray-100 py-2">
                                        <dt className="text-gray-400">{item.label}</dt>
                                        <dd className="text-gray-800 text-right max-w-[60%] line-clamp-2">{item.value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    ) : null}

                    {descriptionSections.sections.map((section) => (
                        <div key={section.title}>
                            <h3 className="font-bold text-gray-900 mb-4">{section.title}</h3>
                            <ul className="text-sm text-gray-600 leading-relaxed grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-2">
                                {section.items.map((item, index) => (
                                    <li key={`${section.title}-${index}`} className="flex gap-2">
                                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            <LeadFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`ЗАКАЗАТЬ ${car.brand}`}
                subtitle={`Оставьте заявку на расчет по модели ${car.model}${car.generation ? ` ${car.generation}` : ''} ${car.year}`}
                source={`car_detail_${car.slug}`}
            />
        </div>
    );
}

type SpecItem = { label: string; value: string };

function buildSpecsList(car: CarModel, description: string): SpecItem[] {
    const specs: SpecItem[] = [];
    const add = (label: string, value?: string) => {
        if (!value) return;
        specs.push({ label, value });
    };

    add('Марка', car.brand);
    add('Модель', car.model);
    add('Поколение', car.generation);
    add('Год выпуска', String(car.year));
    add('Состояние', conditionLabelStatic(car.condition));
    add('Рынок', car.market);
    add('Наличие', availabilityLabel(car.availability));
    add('Пробег', car.mileage_km ? `${car.mileage_km.toLocaleString()} км` : undefined);
    add('Тип цены', priceTypeLabelStatic(car.price_type));
    add('Валюта', car.price_currency);
    add('Кол-во фото', `${car.images?.length ?? 0}`);

    const derived = deriveSpecsFromDescription(description);
    add('Тип кузова', derived.bodyType);
    add('Тип двигателя', derived.engineType);
    add('Запас хода', derived.rangeKm);
    add('Мощность', derived.power);
    add('Привод', derived.drive);
    add('Коробка', derived.transmission);
    add('Емкость батареи', derived.battery);

    return specs;
}

function deriveSpecsFromDescription(description: string) {
    const rawText = normalizeSpace(description);
    const text = rawText.toLowerCase();
    const pickRaw = (regex: RegExp) => {
        const match = regex.exec(rawText);
        return match?.[1]?.trim();
    };

    const bodyType = pickRaw(/тип кузова[:\s]*([^.;]+)/i) || pickRaw(/кузов[:\s]*([^.;]+)/i);
    const driveRaw = pickRaw(/привод[:\s]*([^.;]+)/i);
    const transmissionRaw = pickRaw(/коробка передач[:\s]*([^.;]+)/i) || pickRaw(/трансмиссия[:\s]*([^.;]+)/i);
    const batteryRaw = pickRaw(/(?:аккумулятор|батаре[яи])[^0-9]*(\d+(?:[.,]\d+)?\s*кВт·?ч)/i);
    const rangeRaw = pickRaw(/запас хода[^0-9]*(\d{2,4}\s*км(?:\s*\([^)]*\))?)/i);
    const powerKw = pickRaw(/мощност[^0-9]*(\d{2,4})\s*кВт/i);
    const powerHp = pickRaw(/(\d{2,4})\s*л\.?\s*с\.?/i);

    let engineType: string | undefined;
    if (text.includes('erev') || text.includes('гибрид')) engineType = 'Гибрид (EREV/HEV)';
    else if (text.includes('электр')) engineType = 'Электро';
    else if (text.includes('бенз')) engineType = 'Бензин';
    else if (text.includes('дизел')) engineType = 'Дизель';

    let drive = driveRaw;
    if (!drive) {
        if (text.includes('awd') || text.includes('4wd') || text.includes('полный')) drive = 'Полный';
        else if (text.includes('rwd') || text.includes('задн')) drive = 'Задний';
        else if (text.includes('fwd') || text.includes('передн')) drive = 'Передний';
    }

    let transmission = transmissionRaw;
    if (!transmission) {
        if (text.includes('односкорост')) transmission = 'Односкоростная';
        else if (text.includes('автомат')) transmission = 'Автомат';
        else if (text.includes('робот')) transmission = 'Робот';
    }

    const compact = (value?: string) => {
        if (!value) return undefined;
        let trimmed = value.replace(/\s{2,}/g, ' ').trim();
        const lower = trimmed.toLowerCase();
        const markers = ['безопасность', 'дизайн', 'комфорт', 'производитель', 'дата выхода', 'разгон', 'максимальная скорость'];
        let cutIndex = trimmed.length;
        for (const marker of markers) {
            const idx = lower.indexOf(marker);
            if (idx >= 0 && idx < cutIndex) cutIndex = idx;
        }
        trimmed = trimmed.slice(0, cutIndex).trim();
        return trimmed.length > 80 ? `${trimmed.slice(0, 80)}…` : trimmed;
    };

    const battery = compact(batteryRaw);
    const rangeKm = compact(rangeRaw);
    const power = powerKw ? `${powerKw} кВт` : powerHp ? `${powerHp} л.с.` : undefined;

    return {
        bodyType: compact(bodyType),
        engineType,
        drive: compact(drive),
        transmission: compact(transmission),
        battery,
        rangeKm,
        power
    };
}

function splitDescriptionSections(description: string) {
    const text = description.trim();
    if (!text) return { intro: '', sections: [] as { title: string; items: string[] }[] };

    const markers = [
        { title: 'Характеристики', regex: /все характеристики:/i },
        { title: 'Безопасность и ассистенты', regex: /безопасность и ассистенты:/i },
        { title: 'Дизайн и комфорт', regex: /дизайн и комфорт:/i }
    ];

    const positions = markers
        .map((marker) => {
            const match = marker.regex.exec(text);
            return match ? { ...marker, index: match.index, length: match[0].length } : null;
        })
        .filter((item): item is { title: string; regex: RegExp; index: number; length: number } => !!item)
        .sort((a, b) => a.index - b.index);

    if (!positions.length) {
        return { intro: text, sections: [] };
    }

    const intro = text.slice(0, positions[0].index).trim();
    const sections = positions.map((pos, idx) => {
        const start = pos.index + pos.length;
        const end = positions[idx + 1]?.index ?? text.length;
        const raw = text.slice(start, end).trim();
        return {
            title: pos.title,
            items: splitToItems(raw)
        };
    }).filter(section => section.items.length);

    return { intro, sections };
}

function splitToItems(text: string) {
    return text
        .replace(/\s+/g, ' ')
        .replace(/[•●]/g, ';')
        .split(/\s*;\s*|\s*\n\s*|\.\s+/g)
        .map((item) => item.trim())
        .filter(Boolean);
}

function normalizeSpace(text: string) {
    return text.replace(/\s+/g, ' ').trim();
}

function conditionLabelStatic(condition: string) {
    switch (condition) {
        case 'New': return 'Новый';
        case 'Used': return 'Б/У';
        case 'Crashed': return 'Битый';
        default: return condition;
    }
}

function priceTypeLabelStatic(priceType: string) {
    switch (priceType) {
        case 'FOB': return 'Без доставки';
        case 'EXW': return 'Без растаможки';
        case 'OnRoad': return 'Под ключ';
        case 'Estimate': return 'Оценка';
        default: return 'Цена';
    }
}
