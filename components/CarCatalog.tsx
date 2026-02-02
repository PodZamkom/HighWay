"use client";

import { CarModel } from '@/types/car';
import Link from 'next/link';
import { cars_db } from '@/data/cars_db';
import { useState } from 'react';
import { Filter } from 'lucide-react';

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
                                    <span className={`px-2 py-1 text-xs font-bold rounded uppercase ${car.availability === 'In Stock (Minsk)' ? 'bg-green-500 text-black' : 'bg-black/50 backdrop-blur text-white'
                                        }`}>
                                        {car.availability === 'In Stock (Minsk)' ? 'В Минске' : car.availability === 'En Route' ? 'В Пути' : 'Под Заказ'}
                                    </span>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{car.brand} {car.model}</h3>
                                        <p className="text-sm text-zinc-500">{car.year} • {car.type === 'EV' ? 'Электро' : car.type === 'EREV' ? 'Гибрид' : 'ДВС'}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-red-500">${car.price_fob.toLocaleString()}</div>
                                        <div className="text-[10px] text-zinc-600">Цена в Китае</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 py-4 border-t border-white/5 mb-4">
                                    <div className="text-center">
                                        <div className="text-xs text-zinc-500">Разгон</div>
                                        <div className="font-mono text-white">{car.specs.acceleration_0_100}s</div>
                                    </div>
                                    <div className="text-center border-l border-white/5">
                                        <div className="text-xs text-zinc-500">Запас хода</div>
                                        <div className="font-mono text-white">{car.specs.range_km}km</div>
                                    </div>
                                    <div className="text-center border-l border-white/5">
                                        <div className="text-xs text-zinc-500">Привод</div>
                                        <div className="font-mono text-white">{car.specs.drive}</div>
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
