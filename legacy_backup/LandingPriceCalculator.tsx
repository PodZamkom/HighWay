"use client";
import React, { useState, useMemo } from 'react';
import { useCalculatorStore } from '../store/calculatorStore';
import clsx from 'clsx';
import { calculateLandedPrice } from '../utils/priceCalculator';

interface LandingPriceCalculatorProps {
    basePriceFob: number; // In USD
    carType: 'EV' | 'EREV' | 'ICE';
    engineVolumeCc?: number; // Needed for ICE/EREV customs
}

export default function LandingPriceCalculator({ basePriceFob, carType, engineVolumeCc = 0 }: LandingPriceCalculatorProps) {
    const { exchangeRates } = useCalculatorStore();
    const [beneficiary, setBeneficiary] = useState<'physical' | 'physical_140' | 'legal'>('physical');

    const costs = useMemo(() => {
        return calculateLandedPrice(basePriceFob, carType, { beneficiary });
    }, [basePriceFob, carType, beneficiary]);

    return (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span>🧮</span> Честная цена под ключ
            </h3>

            {/* Inputs */}
            <div className="mb-6 space-y-3">
                <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                    <button
                        onClick={() => setBeneficiary('physical')}
                        className={clsx("flex-1 text-sm py-2 rounded-md transition-all", beneficiary === 'physical' ? "bg-white dark:bg-zinc-700 shadow-sm font-medium" : "text-zinc-500")}
                    >
                        Физ. лицо
                    </button>
                    <button
                        onClick={() => setBeneficiary('physical_140')}
                        className={clsx("flex-1 text-sm py-2 rounded-md transition-all", beneficiary === 'physical_140' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 shadow-sm font-medium" : "text-zinc-500")}
                    >
                        Льгота 140
                    </button>
                    <button
                        onClick={() => setBeneficiary('legal')}
                        className={clsx("flex-1 text-sm py-2 rounded-md transition-all", beneficiary === 'legal' ? "bg-white dark:bg-zinc-700 shadow-sm font-medium" : "text-zinc-500")}
                    >
                        Юр. лицо (с НДС)
                    </button>
                </div>
            </div>

            {/* Waterfall Breakdown */}
            <div className="space-y-2 text-sm">
                <Row label="Цена лота / с завода" value={basePriceFob} currency="$" />
                <Row label="Расходы по Китаю + Фрахт" value={costs.details.auctionFee + costs.details.logistics + costs.details.freight} currency="$" subtext="Аукционный сбор, доставка до порта/станции, ЖД/Море" />

                <div className="my-2 border-t border-dashed border-zinc-300 dark:border-zinc-700"></div>

                <Row label="Таможенная пошлина" value={costs.customsDuty} currency="$" highlight={costs.customsDuty === 0} />
                {costs.vat > 0 && <Row label="НДС (20%)" value={costs.vat} currency="$" />}
                <Row label="Утильсбор + Таможенное оформление" value={costs.details.recycleFee + costs.details.brokerService} currency="$" />
                <Row label="Комиссия Highway Motors" value={costs.details.commission} currency="$" />

                <div className="my-4 border-t border-zinc-300 dark:border-zinc-700"></div>

                <div className="flex justify-between items-end">
                    <span className="text-zinc-500 font-medium pb-1">Итого под ключ в Минске:</span>
                    <div className="text-right">
                        <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                            ${Math.round(costs.total).toLocaleString()}
                        </div>
                        {/* Approximate BYN */}
                        <div className="text-xs text-zinc-400">
                            ≈ {Math.round(costs.total * exchangeRates.BYN).toLocaleString()} BYN
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const Row = ({ label, value, currency, subtext, highlight }: { label: string, value: number, currency: string, subtext?: string, highlight?: boolean }) => (
    <div className="flex justify-between items-start">
        <div>
            <div className="text-zinc-600 dark:text-zinc-300">{label}</div>
            {subtext && <div className="text-[10px] text-zinc-400 max-w-[200px] leading-tight">{subtext}</div>}
        </div>
        <div className={clsx("font-medium", highlight ? "text-emerald-500" : "text-zinc-900 dark:text-zinc-100")}>
            {value > 0 ? `${currency}${Math.round(value).toLocaleString()}` : "0 " + currency}
        </div>
    </div>
);
