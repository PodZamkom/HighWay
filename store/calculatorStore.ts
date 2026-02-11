import { create } from 'zustand';

// Default Fallback Settings
const DEFAULT_SETTINGS = {
    rates: {
        usd_byn: 3.25,
        eur_usd: 1.08,
        cny_usd: 0.14
    },
    fees: {
        auction_fee: 500,
        logistics_china_minsk: 2800,
        broker_fee: 250,
        our_commission: 500,
        customs_processing: 120
    },
    recycling: {
        under_3_years: 544.5,
        over_3_years: 1089.0
    },
    margins: {
        sea_freight_markup: 0
    }
};

type CalculatorSettings = typeof DEFAULT_SETTINGS;

type CalculatorState = {
    priceFob: number;
    currency: 'USD' | 'CNY' | 'EUR';
    engineType: 'EV' | 'EREV' | 'ICE';
    engineVolume: number;
    carYear: number;
    isDecree140: boolean;

    settings: CalculatorSettings;
    isLoadingSettings: boolean;

    // Actions
    setPriceFob: (price: number) => void;
    setEngineType: (type: 'EV' | 'EREV' | 'ICE') => void;
    setEngineVolume: (volume: number) => void;
    setCarYear: (year: number) => void;
    toggleDecree140: () => void;

    fetchSettings: () => Promise<void>;

    // Computed
    calculateFinalPrice: () => {
        customsDuty: number;
        logistics: number;
        finalPriceUSD: number;
        finalPriceBYN: number;
        details: {
            fob: number;
            auctionFee: number;
            logistics: number;
            customsDuty: number;
            vat: number;
            recyclingFee: number;
            customsProcessing: number;
            brokerFee: number;
            commission: number;
            totalUSD: number;
        }
    };
};

export const useCalculatorStore = create<CalculatorState>((set, get) => ({
    priceFob: 25000,
    currency: 'USD',
    engineType: 'EREV',
    engineVolume: 1500,
    carYear: 2024, // < 3 years old by default
    isDecree140: false,

    settings: DEFAULT_SETTINGS,
    isLoadingSettings: false,

    setPriceFob: (price) => set({ priceFob: price }),
    setEngineType: (type) => set({ engineType: type }),
    setEngineVolume: (volume) => set({ engineVolume: volume }),
    setCarYear: (year) => set({ carYear: year }),
    toggleDecree140: () => set((state) => ({ isDecree140: !state.isDecree140 })),

    fetchSettings: async () => {
        set({ isLoadingSettings: true });
        try {
            const res = await fetch('/api/admin/calculator');
            if (res.ok) {
                const data = await res.json();
                set({ settings: data });
            }
        } catch (e) {
            console.error("Failed to fetch settings, using defaults", e);
        } finally {
            set({ isLoadingSettings: false });
        }
    },

    calculateFinalPrice: () => {
        const s = get();
        const { rates, fees, recycling, margins } = s.settings;

        // 1. Convert initial price to USD if needed
        let priceUSD = s.priceFob;
        if (s.currency === 'CNY') priceUSD = s.priceFob * rates.cny_usd;
        if (s.currency === 'EUR') priceUSD = s.priceFob * rates.eur_usd;

        // 2. Logistics
        const auctionFee = fees.auction_fee;
        const logistics = fees.logistics_china_minsk + margins.sea_freight_markup;

        // 3. Customs Calculation
        let customsDuty = 0;
        let vat = 0;
        const customsValue = priceUSD + logistics; // Basis for customs is Price + Shipping usually (CIF)

        const carAge = new Date().getFullYear() - s.carYear;
        const isUnder3Years = carAge <= 3;

        if (s.engineType === 'EV') {
            // EV: 0% Duty, 0% VAT (in some cases), but prompt implies standard rules. 
            // Usually EV is 0% duty in EAEU (Project until 2025 extension).
            // VAT: 0% for EVs is common with "decision N".
            // Let's assume 0 for both for EV.
            customsDuty = 0;
            vat = 0;
        } else {
            // EREV / ICE
            // "15% + VAT" rule logic from previous discussion/prompt implies Legal Entity flow or specific Hybrid rule.
            // Let's implement the 15% Duty + 20% VAT as requested in analysis plan for EREV.

            // Duty
            customsDuty = customsValue * 0.15;

            // Decree 140 applies to Duty
            if (s.isDecree140) {
                customsDuty = customsDuty * 0.5;
            }

            // VAT (20%) - typically applied to (CustomsValue + Duty)
            // If Decree 140 implies 50% off BOTH, then logic is specific. 
            // Standard Decree 140: 50% discount on customs payments (Duty + VAT).
            // Let's apply 50% to final VAT too if Decree 140 is on.

            const baseVat = (customsValue + customsDuty) * 0.20;
            vat = s.isDecree140 ? baseVat * 0.5 : baseVat;
        }

        // 4. Local Fees
        const recyclingFee = isUnder3Years ? recycling.under_3_years : recycling.over_3_years;
        const customsProcessing = fees.customs_processing / rates.usd_byn; // Convert BYN to USD
        const broker = fees.broker_fee;
        const commission = fees.our_commission;

        const totalUSD = priceUSD + auctionFee + logistics + customsDuty + vat + (recyclingFee / rates.usd_byn) + customsProcessing + broker + commission;
        const totalBYN = totalUSD * rates.usd_byn;

        return {
            customsDuty,
            logistics: logistics + auctionFee,
            finalPriceUSD: totalUSD,
            finalPriceBYN: totalBYN,
            details: {
                fob: priceUSD,
                auctionFee,
                logistics,
                customsDuty,
                vat,
                recyclingFee: recyclingFee / rates.usd_byn, // in USD
                customsProcessing, // in USD
                brokerFee: broker,
                commission,
                totalUSD
            }
        };
    }
}));
