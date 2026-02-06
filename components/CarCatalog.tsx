"use client";

import Link from 'next/link';
import { cars_db } from '@/data/cars_db';
import { useState } from 'react';

export function CarCatalog() {
    const [filterMarket, setFilterMarket] = useState<'All' | 'China' | 'USA' | 'Korea' | 'Europe'>('All');
    const [filterBrand, setFilterBrand] = useState('All');

    // Filter by market first
    const marketCars = filterMarket === 'All'
        ? cars_db
        : cars_db.filter(car => car.market === filterMarket);

    // Get unique brands for the current market selection
    const brands = ['All', ...new Set(marketCars.map(car => car.brand))].sort();

    // Finally filter by brand
    const filteredCars = filterBrand === 'All'
        ? marketCars
        : marketCars.filter(car => car.brand === filterBrand);

    const handleMarketChange = (m: any) => {
        setFilterMarket(m);
        setFilterBrand('All'); // Reset brand on market change
    };

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

    return (
        <section id="catalog" className="py-24 bg-zinc-950 border-t border-white/5">
            <div className="max-w-7xl mx-auto px-6">

                {/* Header & Filters */}
                <div className="space-y-8 mb-12">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
                            КАТАЛОГ АВТО
                        </h2>

                        <div className="flex bg-white/5 p-1 rounded-xl">
                            {['All', 'China', 'Europe', 'USA', 'Korea'].map((m) => (
                                <button
                                    key={m}
                                    onClick={() => handleMarketChange(m)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterMarket === m
                                        ? 'bg-white text-black shadow-lg'
                                        : 'text-zinc-400 hover:text-white'
                                        }`}
                                >
                                    {m === 'All' ? 'Все' : m === 'China' ? 'Китай' : m === 'USA' ? 'США' : m === 'Europe' ? 'Европа' : 'Корея'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Brand Selector */}
                    <div className="flex flex-wrap gap-2 justify-center border-t border-white/5 pt-8">
                        {brands.map((brand) => (
                            <button
                                key={brand}
                                onClick={() => setFilterBrand(brand)}
                                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${filterBrand === brand
                                    ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20'
                                    : 'bg-transparent border-white/10 text-zinc-500 hover:border-white/30 hover:text-white'
                                    }`}
                            >
                                {brand === 'All' ? 'Все марки' : brand}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredCars.map((car) => (
                        <Link href={`/catalog/${car.id}`} key={car.id} className="group block bg-zinc-900 rounded-2xl overflow-hidden border border-white/5 hover:border-white/20 transition-all hover:translate-y-[-4px]">
                            {/* Image Placeholder */}
                            <div className="aspect-[16/10] bg-zinc-800 relative overflow-hidden">
                                {car.images[0] ? (
                                    // In real app use next/image
                                    <img src={car.images[0]} alt={car.model} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-700">Нет фото</div>
                                )}

                                <div className="absolute top-4 right-4 flex gap-2">
                                    <span className={`px-2 py-1 text-xs font-bold rounded uppercase ${car.availability === 'InStock' ? 'bg-green-500 text-black' : 'bg-black/50 backdrop-blur text-white'
                                        }`}>
                                        {availabilityLabel(car.availability)}
                                    </span>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{car.brand} {car.model}</h3>
                                        {car.generation ? (
                                            <p className="text-sm text-zinc-400">{car.generation}</p>
                                        ) : null}
                                        <p className="text-sm text-zinc-500">{car.year} • {conditionLabel(car.condition)}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-red-500">{currencySymbol(car.price_currency)}{car.price_value.toLocaleString()}</div>
                                        <div className="text-[10px] text-zinc-600">{priceTypeLabel(car.price_type)} {car.price_currency}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 py-4 border-t border-white/5 mb-4">
                                    <div className="text-center">
                                        <div className="text-xs text-zinc-500">Состояние</div>
                                        <div className="font-mono text-white">{conditionLabel(car.condition)}</div>
                                    </div>
                                    <div className="text-center border-l border-white/5">
                                        <div className="text-xs text-zinc-500">Доступность</div>
                                        <div className="font-mono text-white">{availabilityLabel(car.availability)}</div>
                                    </div>
                                    <div className="text-center border-l border-white/5">
                                        <div className="text-xs text-zinc-500">{car.mileage_km ? 'Пробег' : car.generation ? 'Поколение' : 'Рынок'}</div>
                                        <div className="font-mono text-white">
                                            {car.mileage_km ? `${car.mileage_km.toLocaleString()} км` : car.generation ? car.generation : car.market}
                                        </div>
                                    </div>
                                </div>

                                <button className="w-full py-3 bg-white/5 text-white font-medium rounded-xl hover:bg-white hover:text-black transition-colors">
                                    Подробнее
                                </button>
                            </div>
                        </Link>
                    ))}
                </div>

            </div>
        </section>
    );
}
