export type Market = 'China' | 'USA' | 'Korea' | 'Europe';
export type Condition = 'New' | 'Used' | 'Crashed';
export type Availability = 'InStock' | 'EnRoute' | 'OnOrder';
export type PriceType = 'FOB' | 'EXW' | 'OnRoad' | 'Estimate';
export type CarType = 'EV' | 'EREV' | 'ICE' | 'HEV';

export interface CarModel {
    id: string;
    slug: string;
    brand: string;
    model: string;
    priority?: number;
    generation?: string;
    year: number;
    condition: Condition;
    mileage_km?: number;
    price_value: number;
    price_currency: 'USD' | 'EUR' | 'BYN' | 'JPY' | 'CNY' | 'KRW';
    price_type: PriceType;
    availability: Availability;
    market: Market;
    type?: CarType;
    body_type?: string;
    transmission?: string;
    drive?: string;
    images: string[];
    description?: string;
}

export interface ExchangeRates {
    CNY: number; // to USD
    EUR: number; // to USD
    BYN: number; // to USD
    RUB: number; // to USD (optional)
}
