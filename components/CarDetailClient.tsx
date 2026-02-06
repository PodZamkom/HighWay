"use client";

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Activity, Tag, Zap } from 'lucide-react';
import { LeadFormModal } from '@/components/LeadFormModal';
import { importedCarsDb } from '@/data/cars_imported_db';

type CarDetailClientProps = {
    carId?: string;
};

export function CarDetailClient({ carId }: CarDetailClientProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const params = useParams<{ id?: string | string[] }>();
    const resolvedId = carId ?? (Array.isArray(params?.id) ? params?.id?.[0] : params?.id);
    const car = resolvedId ? importedCarsDb.find((c) => c.id === resolvedId) : undefined;

    const currencySymbol = (currency: string) => {
        switch (currency) {
            case 'EUR': return '€';
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

    const availabilityLabel = (availability: string) => {
        switch (availability) {
            case 'InStock': return 'В Минске';
            case 'EnRoute': return 'В Пути';
            case 'OnOrder': return 'Под Заказ';
            default: return availability;
        }
    };

    const priceTypeLabel = (priceType: string) => {
        switch (priceType) {
            case 'FOB': return 'Цена (FOB)';
            case 'EXW': return 'Цена (EXW)';
            case 'OnRoad': return 'Цена (OnRoad)';
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

    if (!resolvedId) {
        return (
            <div className="bg-zinc-950 min-h-screen pb-20 pt-24 text-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8">
                        <h1 className="text-2xl font-bold mb-2">Загрузка...</h1>
                        <p className="text-zinc-400">Получаем данные автомобиля.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!car) {
        return (
            <div className="bg-zinc-950 min-h-screen pb-20 pt-24 text-white">
                <div className="max-w-7xl mx-auto px-6">
                    <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors">
                        Назад в каталог
                    </Link>
                    <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8">
                        <h1 className="text-2xl font-bold mb-2">Авто не найдено</h1>
                        <p className="text-zinc-400">Проверьте ссылку или вернитесь в каталог.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-zinc-950 min-h-screen pb-20 pt-24 text-white">
            <div className="max-w-7xl mx-auto px-6">

                {/* Breadcrumb */}
                <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft size={16} /> Назад в каталог
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                    {/* Left: Images */}
                    <div className="space-y-4">
                        <div className="rounded-3xl overflow-hidden border border-white/10 aspect-[4/3] relative bg-zinc-900">
                            {car.images[0] ? (
                                <img src={car.images[0]} alt={car.model} className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex items-center justify-center h-full text-zinc-600">Нет фото</div>
                            )}
                            <div className="absolute top-4 left-4 bg-black/50 backdrop-blur px-3 py-1 rounded text-xs font-bold border border-white/10 uppercase">
                                {car.market} • {conditionLabel(car.condition)}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 text-center">
                                <Activity className="mx-auto text-red-500 mb-2" />
                                <div className="text-2xl font-bold font-mono">{conditionLabel(car.condition)}</div>
                                <div className="text-xs text-zinc-500">Состояние</div>
                            </div>
                            <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 text-center">
                                <Tag className="mx-auto text-yellow-500 mb-2" />
                                <div className="text-2xl font-bold font-mono">
                                    {car.mileage_km ? `${car.mileage_km.toLocaleString()} км` : car.generation || car.year}
                                </div>
                                <div className="text-xs text-zinc-500">{car.mileage_km ? 'Пробег' : car.generation ? 'Поколение' : 'Год'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Info */}
                    <div>
                        <div className="mb-2 text-red-500 font-bold tracking-wider text-sm uppercase">{car.brand}</div>
                        <h1 className="text-5xl font-black tracking-tight mb-4">
                            {car.model} {car.generation ? <span className="text-zinc-600">{car.generation}</span> : null}
                        </h1>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="bg-white/10 px-3 py-1 rounded-full text-sm font-medium">{car.year}</div>
                            <div className="bg-white/10 px-3 py-1 rounded-full text-sm font-medium">{conditionLabel(car.condition)}</div>
                            <div className={`px-3 py-1 rounded-full text-sm font-bold ${car.availability === 'InStock' ? 'bg-green-500 text-black' : 'text-zinc-400 border border-white/20'}`}>
                                {availabilityLabel(car.availability)}
                            </div>
                        </div>

                        <div className="bg-zinc-900 rounded-2xl p-6 border border-white/10 mb-8">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-zinc-400">{priceTypeLabel(car.price_type)}</span>
                                <span className="text-3xl font-bold text-white">{currencySymbol(car.price_currency)}{formatPrice(car.price_value)} <span className="text-base text-zinc-400">{car.price_currency}</span></span>
                            </div>
                            <p className="text-xs text-zinc-500 text-right">Итог считается по текущему курсу</p>
                        </div>

                        {car.description ? (
                            <div className="mb-8">
                                <h3 className="font-bold mb-4">Описание</h3>
                                <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                                    {car.description}
                                </div>
                            </div>
                        ) : null}

                        <div className="flex gap-4">
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="flex-1 bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                Заказать расчет
                            </button>
                            <a
                                href="https://wa.me/375447772224"
                                target="_blank"
                                className="flex-1 bg-transparent border border-white/20 text-white font-bold py-4 rounded-xl hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                            >
                                <Zap size={18} className="text-green-500" /> Написать в WhatsApp
                            </a>
                        </div>

                    </div>
                </div>
            </div>

            <LeadFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`ЗАКАЗАТЬ ${car.brand}`}
                subtitle={`Оставьте заявку на расчет по модели ${car.model}${car.generation ? ` ${car.generation}` : ''} ${car.year}`}
            />
        </div>
    );
}
