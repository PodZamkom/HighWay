import { create } from 'zustand';

// Constants for 2024/2025 Rates (Approximate, can be updated via API later)
export const RATES = {
    USD_BYN: 3.25,
    EUR_USD: 1.08,
    CNY_USD: 0.14,
    AUCTION_FEE_CHINA: 500, // USD
    LOGISTICS_CHINA_MINSK: 2800, // USD (Average)
    BROKER_FEE: 250, // USD
    OUR_COMMISSION: 500, // USD (Promotion)
    RECYCLING_FEE: 500, // USD (Approx for personal use under 3 years)
};

type CalculatorState = {
    priceFob: number; // Auction price in USD
    currency: 'USD' | 'CNY' | 'EUR';
    engineType: 'EV' | 'EREV' | 'ICE';
    engineVolume: number; // in cc, e.g., 1500 for 1.5L
    carYear: number;
    isDecree140: boolean; // 50% customs discount

    // Actions
    setPriceFob: (price: number) => void;
    setEngineType: (type: 'EV' | 'EREV' | 'ICE') => void;
    setEngineVolume: (volume: number) => void;
    setCarYear: (year: number) => void;
    toggleDecree140: () => void;

    // Computed (Helper to get final calc)
    calculateFinalPrice: () => {
        customsDuty: number;
        logistics: number;
        finalPriceUSD: number;
        breakdown: any;
    };
};

export const useCalculatorStore = create<CalculatorState>((set, get) => ({
    priceFob: 25000,
    currency: 'USD',
    engineType: 'EREV',
    engineVolume: 1500, // Standard limit for many hybrids
    carYear: 2024,
    isDecree140: false,

    setPriceFob: (price) => set({ priceFob: price }),
    setEngineType: (type) => set({ engineType: type }),
    setEngineVolume: (volume) => set({ engineVolume: volume }),
    setCarYear: (year) => set({ carYear: year }),
    toggleDecree140: () => set((state) => ({ isDecree140: !state.isDecree140 })),

    calculateFinalPrice: () => {
        const s = get();
        // 1. Base Logic
        let customsDuty = 0;
        const carAge = new Date().getFullYear() - s.carYear;

        // 2. Customs Calculation (Simplified for RB 2025 context)
        if (s.engineType === 'EV') {
            customsDuty = 0; // 0% Duty for EVs
        } else {
            // ICE or EREV (Hybrid treated as ICE for customs usually unless plug-in specific rules apply, 
            // but in RB/EAEU, Series Hybrids (EREV) like Li Auto are often treated by engine volume if they have an ICE generator).
            // 2025 Rule: If age < 3 years: 48% but not less than X euro/cc OR 15% (if EV rules change).
            // Let's assume standard "New Car (<3 years)" rule for now: 15% duty (if value-based) or strict Euro/cc table.
            // EAEU usually: 15% duty for legal entities, but specific rates for individuals.
            // INDIVIDUALS (<3 years): 48% of value OR Euro/cc minimum. 
            // HOWEVER, for "EREV" (Series Hybrid) it's often contested. 
            // Let's implement the "15% + VAT" (Legal) vs "48% or Euro/cc" (Personal) logic?
            // User prompt said: "ICE/Hybrids (15% + VAT in 2025)". 

            // Let's stick to the prompt's implied logic or standard 15% flat for now if implicit 'Legal Entity' import flow 
            // OR the "Individual" flow which is most common.
            // Let's use a simplified "Personal Import" heuristic for < 3 years:
            // 48% of cost, but min 3.5 Euro/cc (example).
            // ACTUAL RB PRACTICE for Li Auto (EREV): Often 15% Duty + 20% VAT (if classified properly) or simple rules.

            // To keep it "Trusted" but simple for the MVP, let's use:
            // Duty = 15% of Price (Common for EVs/Hybrids in some contexts) OR standard individual rates.
            // Let's default to a safe estimate: 15% Duty + 20% VAT for "New Cars" via Legal channel, 
            // Or 48% for individuals.
            // The prompt mentions "Decree 140", which implies Personal Import.
            // Personal Import < 3 years: 48% of value, but not less than...

            // Let's simplified algorithm for MVP based on PRICE percentage for clarity:
            // Assume Duty ~ 48% for ICE/EREV implies high cost.
            // BUT Li L9 is EREV.

            // REVISION: Li Auto L7/L9 are "Hybrids". 
            // Duty: 15%. VAT: 20%. 
            // Total multiplier ~ x1.38 (on top of price+shipping).

            // Let's implement: Duty = Price * 0.15. VAT = (Price + Duty) * 0.20.
            if (s.engineType === 'EREV' || s.engineType === 'ICE') {
                const dutyRate = 0.15;
                const vatRate = 0.20; // VAT in Belarus

                let duty = s.priceFob * dutyRate;

                // Decree 140: 50% discount on Customs Duty AND VAT.
                if (s.isDecree140) {
                    duty = duty * 0.5;
                }
                customsDuty = duty;

                // VAT applies to (Price + Logistics + Duty) typically, or just Price+Duty. 
                // Let's simplify: VAT on (FOB + Cost).
                // Actually in RB, VAT is for Legal entities. Personal imports pay flat "Single Customs Payment" (STP).
                // STP for <3 years: 48% of value.
                // IF THIS IS "EREV", it might be treated as EV (0%) in some windows, but prompt says "Prices have risen... new 2025 taxes".
                // Use: 48% of FOB for Personal.

                // User Prompt Implies: "Ev (0%), Hybrids (15% + VAT)". This logic suggests the "Legal Entity" path or specific Hybrid rule.
                // Let's stick to prompt's numbers: "15% + VAT".

                // Re-calculate with Decree 140 on "15% + VAT":
                // Decree 140 cuts the final customs bill by 50%.

                const baseCustoms = (s.priceFob * 0.15) + ((s.priceFob * 1.15) * 0.20);
                // i.e., ~38% total tax.

                customsDuty = s.isDecree140 ? baseCustoms * 0.5 : baseCustoms;
            }
        }

        const logistics = RATES.LOGISTICS_CHINA_MINSK + RATES.AUCTION_FEE_CHINA;
        const services = RATES.BROKER_FEE + RATES.OUR_COMMISSION + RATES.RECYCLING_FEE;

        // Final
        const finalPriceUSD = s.priceFob + logistics + customsDuty + services;

        return {
            customsDuty,
            logistics,
            finalPriceUSD,
            breakdown: {
                fob: s.priceFob,
                logistics,
                customs: customsDuty,
                services
            }
        };
    }
}));
