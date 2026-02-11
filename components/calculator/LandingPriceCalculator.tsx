'use client';

import { useCalculatorStore, RATES } from '@/store/calculatorStore';
import { useEffect, useState } from 'react';
import { Check, Info } from 'lucide-react';

export function LandingPriceCalculator() {
    const {
        priceFob, engineType, isDecree140,
        setPriceFob, setEngineType, toggleDecree140,
        calculateFinalPrice
    } = useCalculatorStore();

    const [result, setResult] = useState<any>(null);

    // Auto-calculate on change
    useEffect(() => {
        setResult(calculateFinalPrice());
    }, [priceFob, engineType, isDecree140, calculateFinalPrice]);

    if (!result) return null;

    return (
        <div className="space-y-8 text-zinc-900 dark:text-white">
            {/* Input Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Left Column: Inputs */}
                <div className="space-y-6">

                    {/* Engine Type */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-zinc-600 dark:text-gray-400">Тип двигателя</label>
                        <div className="flex rounded-lg bg-black/5 p-1 dark:bg-white/5">
                            {(['EV', 'EREV', 'ICE'] as const).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setEngineType(type)}
                                    className={`flex-1 py-2 text-sm rounded-md transition-all ${engineType === type
                                            ? 'bg-red-600 text-white shadow-lg'
                                            : 'text-zinc-500 hover:text-zinc-900 dark:text-gray-400 dark:hover:text-white'
                                        }`}
                                >
                                    {type === 'EV' ? 'Электро' : type === 'EREV' ? 'Гибрид' : 'ДВС'}
                                </button>
                            ))}
                        </div>
                        <p className="mt-2 text-xs text-zinc-500 dark:text-gray-500">
                            {engineType === 'EV' ? '0% таможенная пошлина.' : 'Таможня + НДС (или льгота).'}
                        </p>
                    </div>

                    {/* Price Slider/Input */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-zinc-600 dark:text-gray-400">Стоимость авто в Китае ($)</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min="10000"
                                max="150000"
                                step="500"
                                value={priceFob}
                                onChange={(e) => setPriceFob(Number(e.target.value))}
                                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-300 accent-red-500 dark:bg-gray-700"
                            />
                            <input
                                type="number"
                                value={priceFob}
                                onChange={(e) => setPriceFob(Number(e.target.value))}
                                className="w-24 rounded border border-zinc-300 bg-transparent p-2 text-right font-mono dark:border-gray-700"
                            />
                        </div>
                    </div>

                    {/* Toggles */}
                    <div className="flex items-center justify-between rounded-xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5">
                        <div className="flex items-center gap-3">
                            <div className={`flex h-5 w-5 items-center justify-center rounded-full ${isDecree140 ? 'bg-green-500' : 'bg-gray-600'}`}>
                                {isDecree140 && <Check size={12} />}
                            </div>
                            <span className="text-sm">Льгота (Указ 140)</span>
                        </div>
                        <button
                            onClick={toggleDecree140}
                            className={`w-12 h-6 rounded-full p-1 transition-colors ${isDecree140 ? 'bg-green-500' : 'bg-gray-600'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${isDecree140 ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>

                </div>

                {/* Right Column: Waterfall Breakdown */}
                <div className="flex flex-col justify-between rounded-2xl border border-black/10 bg-black/5 p-6 dark:border-white/10 dark:bg-white/5">
                    <div>
                        <h3 className="text-lg font-bold mb-4">Структура цены</h3>
                        <div className="space-y-3 text-sm">

                            <div className="flex justify-between">
                                <span className="text-zinc-600 dark:text-gray-400">Цена авто (FOB)</span>
                                <span className="font-mono">${result.breakdown.fob.toLocaleString()}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-zinc-600 dark:text-gray-400">Доставка + Аукцион</span>
                                <span className="font-mono">${result.breakdown.logistics.toLocaleString()}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className={`flex items-center gap-1 text-zinc-600 dark:text-gray-400 ${isDecree140 ? 'text-green-500 dark:text-green-400' : ''}`}>
                                    Таможенные платежи
                                    {isDecree140 && <Info size={12} />}
                                </span>
                                <span className={`font-mono ${isDecree140 ? 'text-green-400' : ''}`}>
                                    ${Math.round(result.breakdown.customs).toLocaleString()}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-zinc-600 dark:text-gray-400">Утиль + Услуги + Комиссия</span>
                                <span className="font-mono">${result.breakdown.services.toLocaleString()}</span>
                            </div>

                            <div className="my-4 h-px bg-black/10 dark:bg-white/20" />

                            <div className="flex justify-between items-end">
                                <span className="text-lg font-bold">Итого под ключ</span>
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                                        ${Math.round(result.finalPriceUSD).toLocaleString()}
                                    </div>
                                    <div className="mt-1 text-xs font-mono text-zinc-500 dark:text-gray-500">
                                        ≈ {Math.round(result.finalPriceUSD * RATES.USD_BYN).toLocaleString()} BYN
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8">
                        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 font-bold text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-gray-200">
                            Получить детальный расчет
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
