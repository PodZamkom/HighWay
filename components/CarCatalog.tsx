"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Car, Zap, AlertTriangle, Check, Tag, LayoutGrid, Info } from 'lucide-react';
import { CarFamily, CarVariant, getPriceRange } from '../data/cars';
import { cars_db } from '../data/cars_db';
import { groupCarsIntoFamilies } from '../utils/car_mapper';
import siteContent from '../data/site.json';

// Get market themes from site.json
const MARKETS_CONFIG = siteContent.marketSection.markets;

const MARKET_THEMES: Record<string, { bg: string, text: string, border: string, label: string, image: string, description: string }> = {
    'China': {
        bg: 'bg-red-900/20',
        text: 'text-red-400',
        border: 'border-red-500/30',
        label: 'КИТАЙ',
        image: '/images/market-china.jpg',
        description: 'Лидеры технологий: Li Auto, Zeekr, Xiaomi. 0% пошлина на электромобили.'
    },
    'USA': {
        bg: 'bg-blue-900/20',
        text: 'text-blue-400',
        border: 'border-blue-500/30',
        label: 'США',
        image: '/images/market-usa.jpg',
        description: 'Аукционы Copart и Manheim. Лучшие предложения на Tesla, BMW и Ford.'
    },
    'Europe': {
        bg: 'bg-emerald-900/20',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
        label: 'ЕВРОПА',
        image: '/images/market-europe.jpg',
        description: 'Премиум бренды и идеальное состояние. BMW, Mercedes, Porsche.'
    },
    'Korea': {
        bg: 'bg-indigo-900/20',
        text: 'text-indigo-400',
        border: 'border-indigo-500/30',
        label: 'КОРЕЯ',
        image: '/images/market-korea.jpg',
        description: 'Прямой доступ к Encar. Популярные дизельные и электрические кроссоверы.'
    }
};

const tagColors: Record<string, string> = {
    'Электро': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    'Гибрид': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'ДВС': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'В наличии': 'bg-green-500/20 text-green-400 border-green-500/30',
    'Под заказ': 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
};

function formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(price);
}

interface VariantCardProps {
    variant: CarVariant;
    isSelected: boolean;
    onSelect: () => void;
}

function VariantCard({ variant, isSelected, onSelect }: VariantCardProps) {
    return (
        <motion.button
            onClick={onSelect}
            className={`w-full p-4 rounded-xl border-2 transition-all duration-300 text-left ${isSelected
                ? 'border-cyan-500 bg-cyan-500/10'
                : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                }`}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        {isSelected && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center"
                            >
                                <Check className="w-3 h-3 text-black" />
                            </motion.div>
                        )}
                        <h4 className="font-semibold text-white">{variant.name}</h4>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{variant.specs}</p>
                    <p className="text-xs text-gray-500">{variant.condition}</p>

                    <div className="flex flex-wrap gap-1.5 mt-3">
                        {variant.tags.map((tag) => (
                            <span
                                key={tag}
                                className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${tagColors[tag] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                                    }`}
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="text-right">
                    <span className="text-xl font-bold text-white">
                        {formatPrice(variant.price_usd)}
                    </span>
                </div>
            </div>
        </motion.button>
    );
}

interface ConfigModalProps {
    family: CarFamily;
    onClose: () => void;
}

function ConfigModal({ family, onClose }: ConfigModalProps) {
    const [selectedVariant, setSelectedVariant] = useState<CarVariant>(family.variants[0]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-zinc-900 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/10 shadow-2xl shadow-black/50"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Image */}
                <div className="relative h-72 overflow-hidden">
                    <img
                        src={family.image}
                        alt={family.model}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />

                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white transition-all hover:rotate-90"
                    >
                        <X size={24} />
                    </button>

                    <div className="absolute bottom-6 left-8">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-cyan-500 text-black text-[10px] font-bold rounded uppercase">
                                {family.market}
                            </span>
                        </div>
                        <h2 className="text-4xl font-black text-white tracking-tighter uppercase">{family.brand} {family.model}</h2>
                    </div>
                </div>

                {/* Taxes Banner */}
                <div className="px-8 py-3 bg-amber-500/10 border-y border-amber-500/20 flex items-center gap-3">
                    <AlertTriangle size={18} className="text-amber-500" />
                    <p className="text-amber-500 text-xs font-bold uppercase tracking-widest">
                        ВНИМАНИЕ: Цены включают НДС 20%. Доставка рассчитывается отдельно.
                    </p>
                </div>

                {/* Variants List */}
                <div className="p-8 pb-32 overflow-y-auto max-h-[calc(90vh-320px)] custom-scrollbar">
                    <div className="flex items-center gap-2 mb-6">
                        <LayoutGrid size={20} className="text-cyan-500" />
                        <h3 className="text-lg font-bold text-white uppercase tracking-tight">Доступные модификации</h3>
                    </div>

                    <div className="grid gap-3">
                        {family.variants.map((variant) => (
                            <VariantCard
                                key={variant.id}
                                variant={variant}
                                isSelected={selectedVariant.id === variant.id}
                                onSelect={() => setSelectedVariant(variant)}
                            />
                        ))}
                    </div>
                </div>

                {/* Fixed Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-8 pt-6 border-t border-white/10 bg-zinc-900/95 backdrop-blur-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Выбранная версия</p>
                        <p className="text-white font-bold">{selectedVariant.name}</p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Стоимость</p>
                            <p className="text-3xl font-black text-cyan-400 leading-none">
                                {formatPrice(selectedVariant.price_usd)}
                            </p>
                        </div>
                        <button className="h-14 px-8 bg-white text-black font-black uppercase text-sm rounded-2xl hover:bg-cyan-500 transition-all flex items-center gap-2 group">
                            ЗАКАЗАТЬ РАСЧЕТ
                            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

interface FamilyCardProps {
    family: CarFamily;
    onConfigure: () => void;
}

function FamilyCard({ family, onConfigure }: FamilyCardProps) {
    const priceRange = getPriceRange(family);
    const variantCount = family.variants.length;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group relative bg-zinc-900/40 border border-white/5 rounded-3xl overflow-hidden hover:border-white/20 transition-all duration-500"
        >
            <div className="relative h-60 overflow-hidden">
                <img
                    src={family.image}
                    alt={family.model}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />

                <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">{family.brand}</span>
                </div>

                <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-cyan-500/20 backdrop-blur-md border border-cyan-500/30">
                    <span className="text-xs font-bold text-cyan-400">{variantCount} версия</span>
                </div>
            </div>

            <div className="p-6">
                <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">{family.model}</h3>
                <p className="text-zinc-500 text-sm mb-6 line-clamp-2 h-10">{family.description}</p>

                <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-zinc-500 text-xs font-bold uppercase">от</span>
                    <span className="text-2xl font-black text-white">{formatPrice(priceRange.min)}</span>
                </div>

                <button
                    onClick={onConfigure}
                    className="w-full py-4 bg-white/5 border border-white/10 text-white font-bold uppercase text-xs tracking-widest rounded-2xl hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2"
                >
                    <Car size={16} />
                    Смотреть цены
                </button>
            </div>
        </motion.div>
    );
}

export function CarCatalog() {
    const [selectedFamily, setSelectedFamily] = useState<CarFamily | null>(null);

    const groupedFamilies = useMemo(() => {
        const families = groupCarsIntoFamilies(cars_db);
        const grouped: Record<string, CarFamily[]> = {};

        families.forEach(f => {
            if (!grouped[f.market]) grouped[f.market] = [];
            grouped[f.market].push(f);
        });

        return grouped;
    }, []);

    const markets = Object.keys(groupedFamilies).sort((a, b) => {
        const order = ['China', 'USA', 'Europe', 'Korea'];
        return order.indexOf(a) - order.indexOf(b);
    });

    return (
        <section id="catalog" className="py-24 bg-black">
            <div className="max-w-7xl mx-auto px-4">

                {/* Section Header */}
                <div className="max-w-2xl mb-20">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-1 bg-cyan-500" />
                        <span className="text-cyan-500 font-bold uppercase tracking-[0.3em] text-sm">
                            КАТАЛОГ 2026
                        </span>
                    </div>
                    <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase mb-6">
                        ВЫБЕРИ <br />СВОЙ <span className="text-outline-white text-transparent">АВТОМОБИЛЬ</span>
                    </h2>
                    <p className="text-zinc-500 text-lg">
                        Актуальные цены со всех мировых рынков. Мы отобрали лучшие модели по соотношению цены и качества.
                    </p>
                </div>

                {/* Market Groups */}
                {markets.map((market) => {
                    const theme = MARKET_THEMES[market] || {
                        bg: 'bg-zinc-900/40',
                        text: 'text-zinc-400',
                        border: 'border-white/10',
                        label: market.toUpperCase(),
                        image: '',
                        description: 'Автомобили с рынка ' + market
                    };
                    const families = groupedFamilies[market];

                    return (
                        <div key={market} className="mb-32">
                            {/* Market Header Banner */}
                            <div className={`relative mb-12 rounded-[2.5rem] overflow-hidden border ${theme.border} min-h-[300px] flex items-center`}>
                                {theme.image && (
                                    <>
                                        <img src={theme.image} alt={market} className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-luminosity" />
                                        <div className={`absolute inset-0 ${theme.bg} opacity-100`} />
                                    </>
                                )}
                                <div className="relative p-12 w-full">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                                        <div className="max-w-xl">
                                            <div className="flex items-center gap-3 mb-4">
                                                <span className={`px-4 py-1 rounded-full border ${theme.border} ${theme.bg} ${theme.text} text-xs font-black tracking-[0.2em]`}>
                                                    РЫНОК
                                                </span>
                                                <div className={`w-2 h-2 rounded-full animate-pulse ${theme.text.replace('text-', 'bg-')}`} />
                                            </div>
                                            <h3 className={`text-6xl md:text-8xl font-black ${theme.text} tracking-tighter uppercase mb-4`}>
                                                {theme.label}
                                            </h3>
                                            <p className="text-white/60 text-lg md:text-xl font-medium max-w-lg leading-relaxed">
                                                {theme.description}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4 bg-black/40 backdrop-blur-sm p-4 rounded-3xl border border-white/5">
                                            <div className="text-right">
                                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Всего моделей</p>
                                                <p className="text-3xl font-black text-white leading-none">{families.length}</p>
                                            </div>
                                            <div className="w-px h-10 bg-white/10" />
                                            <Info size={24} className={theme.text} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Families Grid */}
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {families.map((family) => (
                                    <FamilyCard
                                        key={family.id}
                                        family={family}
                                        onConfigure={() => setSelectedFamily(family)}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Configuration Modal */}
            <AnimatePresence>
                {selectedFamily && (
                    <ConfigModal
                        family={selectedFamily}
                        onClose={() => setSelectedFamily(null)}
                    />
                )}
            </AnimatePresence>

        </section>
    );
}
