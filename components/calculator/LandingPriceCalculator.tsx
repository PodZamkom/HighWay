'use client';

import { useCalculatorStore } from '@/store/calculatorStore';
import { useEffect, useState } from 'react';
import { Check, Info, Loader2 } from 'lucide-react';

export function LandingPriceCalculator() {
    const {
        priceFob, engineType, isDecree140, settings, isLoadingSettings,
        setPriceFob, setEngineType, toggleDecree140,
        calculateFinalPrice, fetchSettings
    } = useCalculatorStore();

    const [result, setResult] = useState<any>(null);

    // Initial fetch
    useEffect(() => {
        fetchSettings();
    }, []);

    // Auto-calculate on change
    useEffect(() => {
        if (!isLoadingSettings) {
            setResult(calculateFinalPrice());
        }
    }, [priceFob, engineType, isDecree140, settings, isLoadingSettings, calculateFinalPrice]);

    if (!result || isLoadingSettings) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="animate-spin text-orange-500 w-8 h-8" />
            </div>
        );
    }

    // Prepare breakdown values for UI (grouping if needed)
    const servicesSum = result.details.recyclingFee + result.details.customsProcessing + result.details.brokerFee + result.details.commission;

    return (
        <div className="space-y-8">
            {/* Input Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Left Column: Inputs */}
                <div className="space-y-6">

                    {/* Engine Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">Тип двигателя</label>
                        <div className="flex bg-gray-100 rounded-lg p-1">
                            {(['EV', 'EREV', 'ICE'] as const).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setEngineType(type)}
                                    className={`flex-1 py-2 text-sm rounded-md transition-all font-medium ${engineType === type
                                        ? 'bg-orange-600 text-white shadow-lg'
                                        : 'text-gray-500 hover:text-gray-900'
                                        }`}
                                >
                                    {type === 'EV' ? 'Электро' : type === 'EREV' ? 'Гибрид' : 'ДВС'}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                            {engineType === 'EV' ? '0% таможенная пошлина.' : 'Таможня + НДС (или льгота).'}
                        </p>
                    </div>

                    {/* Price Slider/Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">Стоимость авто в Китае ($)</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min="5000"
                                max="150000"
                                step="500"
                                value={priceFob}
                                onChange={(e) => setPriceFob(Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                            />
                            <input
                                type="number"
                                value={priceFob}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    if (val >= 0) setPriceFob(val);
                                }}
                                className="w-24 bg-white border border-gray-300 rounded-lg p-2 text-right font-mono text-gray-900 focus:outline-none focus:border-orange-500"
                            />
                        </div>
                    </div>

                    {/* Toggles */}
                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isDecree140 ? 'bg-green-500 text-white' : 'bg-gray-300'}`}>
                                {isDecree140 && <Check size={12} />}
                            </div>
                            <span className="text-sm text-gray-700">Льгота (Указ 140)</span>
                        </div>
                        <button
                            onClick={toggleDecree140}
                            className={`w-12 h-6 rounded-full p-1 transition-colors ${isDecree140 ? 'bg-green-500' : 'bg-gray-300'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${isDecree140 ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>

                </div>

                {/* Right Column: Waterfall Breakdown */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Структура цены</h3>
                        <div className="space-y-3 text-sm">

                            <div className="flex justify-between">
                                <span className="text-gray-500">Цена авто (FOB)</span>
                                <span className="font-mono text-gray-900">${result.details.fob.toLocaleString()}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-500">Доставка + Аукцион</span>
                                <span className="font-mono text-gray-900">${result.logistics.toLocaleString()}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className={`text-gray-500 flex items-center gap-1 ${isDecree140 ? 'text-green-600' : ''}`}>
                                    Таможенные платежи
                                    {isDecree140 && <Info size={12} />}
                                </span>
                                <span className={`font-mono ${isDecree140 ? 'text-green-600' : 'text-gray-900'}`}>
                                    ${Math.round(result.customsDuty + (result.details.vat || 0)).toLocaleString()}
                                </span>
                            </div>
                            {/* Hint about VAT included if any */}
                            {(result.details.vat > 0) && (
                                <div className="text-right text-xs text-gray-400 -mt-2 mb-2">
                                    (Пошлина: ${Math.round(result.customsDuty).toLocaleString()} + НДС: ${Math.round(result.details.vat).toLocaleString()})
                                </div>
                            )}


                            <div className="flex justify-between">
                                <span className="text-gray-500">Утиль + Услуги + Комиссия</span>
                                <span className="font-mono text-gray-900">${Math.round(servicesSum).toLocaleString()}</span>
                            </div>

                            <div className="h-px bg-gray-200 my-4" />

                            <div className="flex justify-between items-end">
                                <span className="text-lg font-bold text-gray-900">Итого под ключ</span>
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-orange-600">
                                        ${Math.round(result.finalPriceUSD).toLocaleString()}
                                    </div>
                                    <div className="text-xs text-gray-400 font-mono mt-1">
                                        ≈ {Math.round(result.finalPriceBYN).toLocaleString()} BYN
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8">
                        <button className="w-full bg-orange-600 text-white font-bold py-3 rounded-xl hover:bg-orange-500 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20">
                            Получить детальный расчет
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
