'use client';

import { useState, useEffect } from 'react';
import { Save, RefreshCw, Calculator, DollarSign, Truck, Shield } from 'lucide-react';

export default function AdminCalculatorPage() {
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/calculator');
            const data = await res.json();
            setSettings(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (section: string, key: string, value: string) => {
        setSettings((prev: any) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: Number(value)
            }
        }));
    };

    const saveSettings = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/calculator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });
            if (res.ok) {
                alert('Настройки сохранены!');
            } else {
                alert('Ошибка сохранения');
            }
        } catch (e) {
            console.error(e);
            alert('Ошибка сети');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">Загрузка...</div>;
    if (!settings) return <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">Ошибка загрузки</div>;

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Calculator className="text-red-500" />
                        Настройки калькулятора
                    </h1>
                    <button
                        onClick={saveSettings}
                        disabled={saving}
                        className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        {saving ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
                        {saving ? 'Сохранение...' : 'Сохранить'}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Курсы валют */}
                    <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-400">
                            <DollarSign size={20} />
                            Курсы валют
                        </h2>
                        <div className="space-y-4">
                            <Input
                                label="USD / BYN"
                                value={settings.rates.usd_byn}
                                onChange={(v) => handleChange('rates', 'usd_byn', v)}
                            />
                            <Input
                                label="EUR / USD"
                                value={settings.rates.eur_usd}
                                onChange={(v) => handleChange('rates', 'eur_usd', v)}
                            />
                            <Input
                                label="CNY / USD"
                                value={settings.rates.cny_usd}
                                onChange={(v) => handleChange('rates', 'cny_usd', v)}
                            />
                        </div>
                    </div>

                    {/* Комиссии и сборы */}
                    <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-400">
                            <Shield size={20} />
                            Комиссии и сборы (USD)
                        </h2>
                        <div className="space-y-4">
                            <Input
                                label="Аукционный сбор"
                                value={settings.fees.auction_fee}
                                onChange={(v) => handleChange('fees', 'auction_fee', v)}
                            />
                            <Input
                                label="Услуги брокера"
                                value={settings.fees.broker_fee}
                                onChange={(v) => handleChange('fees', 'broker_fee', v)}
                            />
                            <Input
                                label="Наша комиссия"
                                value={settings.fees.our_commission}
                                onChange={(v) => handleChange('fees', 'our_commission', v)}
                            />
                            <Input
                                label="Таможенное оформление (BYN)"
                                value={settings.fees.customs_processing}
                                onChange={(v) => handleChange('fees', 'customs_processing', v)}
                                hint="Обычно 120 BYN"
                            />
                        </div>
                    </div>

                    {/* Логистика */}
                    <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-yellow-400">
                            <Truck size={20} />
                            Логистика (USD)
                        </h2>
                        <div className="space-y-4">
                            <Input
                                label="Китай -> Минск (База)"
                                value={settings.fees.logistics_china_minsk}
                                onChange={(v) => handleChange('fees', 'logistics_china_minsk', v)}
                            />
                            <Input
                                label="Маржа на логистику"
                                value={settings.margins.sea_freight_markup}
                                onChange={(v) => handleChange('margins', 'sea_freight_markup', v)}
                                hint="Добавляется к стоимости доставки"
                            />
                        </div>
                    </div>

                    {/* Утильсбор */}
                    <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-purple-400">
                            <RefreshCw size={20} />
                            Утильсбор (BYN)
                        </h2>
                        <div className="space-y-4">
                            <Input
                                label="Авто до 3 лет"
                                value={settings.recycling.under_3_years}
                                onChange={(v) => handleChange('recycling', 'under_3_years', v)}
                            />
                            <Input
                                label="Авто старше 3 лет"
                                value={settings.recycling.over_3_years}
                                onChange={(v) => handleChange('recycling', 'over_3_years', v)}
                            />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

function Input({ label, value, onChange, hint }: { label: string, value: number, onChange: (v: string) => void, hint?: string }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-red-500 transition-colors"
                step="0.01"
            />
            {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
        </div>
    );
}
