export type AgePreset = '0_3' | '3_5' | '5_7' | '7_plus';

export type ParseFileKind = 'rates' | 'ports';

export interface LocalCalculatorForm {
  transport: string;
  platform: string;
  auction: string;
  deliveryTo: string;
  carPrice: number;
  age: number;
  agePreset: AgePreset;
  engine: number;
  preferential: boolean;
}

export interface CalculatorOptionsResponse {
  transports: { key: string; name: string }[];
  auctions: { key: string; name: string }[];
  deliveries: { key: string; name: string; cityName: string; cityNameOld?: string }[];
  platforms: { key: string; name: string }[];
  agePresets: { key: AgePreset; name: string; min: number; max: number | null }[];
}

export interface CalculatorLineItem {
  label: string;
  value: number;
  currency: 'USD' | 'BYN';
}

export interface CalculatorResultPayload {
  carPrice: CalculatorLineItem;
  auctionFee: CalculatorLineItem;
  deliveryToPortUSA: CalculatorLineItem;
  deliveryFromPortUSA: CalculatorLineItem;
  fromKlaipeda: CalculatorLineItem;
  ourServicePrice: CalculatorLineItem;
  customDuty: CalculatorLineItem;
  customFee: CalculatorLineItem;
  junkFee: CalculatorLineItem;
  svxServicePrice: CalculatorLineItem;
  total: CalculatorLineItem;
}

export interface CalculatorConfig {
  rates: {
    usd_byn: number;
    eur_usd: number;
  };
  fallback: {
    auction_fee_usd: number;
    delivery_to_usa_port_usd: number;
    ocean_to_klaipeda_usd: number;
    ocean_to_poti_usd: number;
    klaipeda_to_minsk_usd: number;
    poti_to_georgia_usd: number;
    customs_fee_byn: number;
    recycling_0_3_byn: number;
    recycling_3_5_byn: number;
    recycling_5_7_byn: number;
    recycling_7_plus_byn: number;
  };
  costs: {
    our_services_byn: number;
    svh_byn: number;
  };
  margins: {
    minsk_byn: number;
    klaipeda_byn: number;
    georgia_byn: number;
  };
  policies: {
    ai_model: string;
  };
}

export interface UploadedDocument {
  id: number;
  kind: ParseFileKind;
  path: string;
  originalName: string;
  mime: string;
  status: 'uploaded' | 'parsed' | 'failed';
  parsedAt: string | null;
  error: string | null;
  createdAt: string;
}

export interface RateRuleInput {
  auction: string;
  platform: string;
  minPrice: number;
  maxPrice: number;
  route: string;
  amount: number;
  currency: 'USD' | 'BYN';
}

export interface PortRuleInput {
  origin: string;
  destination: string;
  routeType: string;
  cost: number;
  currency: 'USD' | 'BYN';
}

export interface ParsedRatesResult {
  rates: RateRuleInput[];
  platforms: string[];
  summary: string;
}

export interface ParsedPortsResult {
  ports: PortRuleInput[];
  platforms: string[];
  summary: string;
}
