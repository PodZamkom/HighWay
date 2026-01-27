export interface CarModel {
    id: string;
    brand: string;
    model: string;
    year: number;
    market: 'China' | 'USA' | 'Korea' | 'Europe';
    type: 'EV' | 'EREV' | 'ICE';
    price_fob: number; // Base price at auction/dealer in original currency (usually converted to USD or CNY)
    currency: 'USD' | 'CNY' | 'EUR' | 'KRW';
    trims: CarTrim[];
    availability: 'In Stock (Minsk)' | 'En Route' | 'On Order';
    images: string[];
    specs: {
        engine?: string; // e.g., "1.5L Turbo" or "Dual Motor"
        range_km?: number; // For EVs/EREVs
        acceleration_0_100?: number; // seconds
        drive: 'AWD' | 'RWD' | 'FWD';
    };
}

export interface CarTrim {
    name: string; // e.g., "Max", "Pro", "Ultra"
    price_adjustment: number; // Additive to base price
    features: string[]; // Key differentiating features
}

export interface ExchangeRates {
    CNY: number; // to USD
    EUR: number; // to USD
    BYN: number; // to USD
    RUB: number; // to USD (optional)
}
