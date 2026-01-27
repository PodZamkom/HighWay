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
        <div className="text-white space-y-8">
            {/* Input Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Left Column: Inputs */}
                <div className="space-y-6">

                    {/* Engine Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Тип двигателя</label>
                        <div className="flex bg-white/5 rounded-lg p-1">
                            {(['EV', 'EREV', 'ICE'] as const).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setEngineType(type)}
                                    className={`flex-1 py-2 text-sm rounded-md transition-all ${engineType === type
                                            ? 'bg-red-600 text-white shadow-lg'
                                            : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    {type === 'EV' ? 'Электро' : type === 'EREV' ? 'Гибрид' : 'ДВС'}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            {engineType === 'EV' ? '0% таможенная пошлина.' : 'Таможня + НДС (или льгота).'}
                        </p>
                    </div>

                    {/* Price Slider/Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Стоимость авто в Китае ($)</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min="10000"
                                max="150000"
                                step="500"
                                value={priceFob}
                                onChange={(e) => setPriceFob(Number(e.target.value))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                            />
                            <input
                                type="number"
                                value={priceFob}
                                onChange={(e) => setPriceFob(Number(e.target.value))}
                                className="w-24 bg-transparent border border-gray-700 rounded p-2 text-right font-mono"
                            />
                        </div>
                    </div>

                    {/* Toggles */}
                    <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10">
                        <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isDecree140 ? 'bg-green-500' : 'bg-gray-600'}`}>
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
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10 flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold mb-4">Структура цены</h3>
                        <div className="space-y-3 text-sm">

                            <div className="flex justify-between">
                                <span className="text-gray-400">Цена авто (FOB)</span>
                                <span className="font-mono">${result.breakdown.fob.toLocaleString()}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-400">Доставка + Аукцион</span>
                                <span className="font-mono">${result.breakdown.logistics.toLocaleString()}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className={`text-gray-400 flex items-center gap-1 ${isDecree140 ? 'text-green-400' : ''}`}>
                                    Таможенные платежи
                                    {isDecree140 && <Info size={12} />}
                                </span>
                                <span className={`font-mono ${isDecree140 ? 'text-green-400' : ''}`}>
                                    ${Math.round(result.breakdown.customs).toLocaleString()}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-400">Утиль + Услуги + Комиссия</span>
                                <span className="font-mono">${result.breakdown.services.toLocaleString()}</span>
                            </div>

                            <div className="h-px bg-white/20 my-4" />

                            <div className="flex justify-between items-end">
                                <span className="text-lg font-bold">Итого под ключ</span>
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                                        ${Math.round(result.finalPriceUSD).toLocaleString()}
                                    </div>
                                    <div className="text-xs text-gray-500 font-mono mt-1">
                                        ≈ {Math.round(result.finalPriceUSD * RATES.USD_BYN).toLocaleString()} BYN
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8">
                        <button className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                            Получить детальный расчет
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
