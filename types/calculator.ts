export type AgePreset = '0_3' | '3_5' | '5_7' | '7_plus';

export type ParseFileKind = 'rates' | 'ports' | 'tow' | 'ocean' | 'auction_fee';

export type CalcStageKey =
  | 'auction_price'
  | 'auction_fee'
  | 'tow'
  | 'ocean'
  | 'land'
  | 'customs'
  | 'util';

export type OceanRoute = 'klaipeda' | 'poti';

export type AuctionKey = 'COPART' | 'IAAI' | 'MANHEIM';

export type Warehouse = 'NEW JERSEY' | 'GEORGIA' | 'TEXAS' | 'CALIFORNIA';

export type UsPort = 'Newark' | 'Savannah' | 'Houston' | 'Long Beach';

export interface TowRate {
  id?: number;
  state: string;
  city: string;
  zip?: string | null;
  copartCost: number | null;
  iaaiCost: number | null;
  warehouse: Warehouse;
  isActive: boolean;
}

export interface OceanRate {
  id?: number;
  port: UsPort;
  destination: OceanRoute;
  hazmat: boolean;
  cost: number;
  currency: 'USD';
}

export interface AuctionFeeBracket {
  id?: number;
  auction: AuctionKey;
  minPrice: number;
  maxPrice: number;
  flatFee: number | null;
  pctFee: number | null;
  internetBidFee: number;
  serviceFee: number;
}

export interface StageMargin {
  stage: CalcStageKey;
  marginUsd: number;
  enabled: boolean;
}

export interface CalculatorFormV2 {
  carPrice: number;
  age: number;
  agePreset: AgePreset;
  engine: number;
  auction: AuctionKey;
  auctionLocationState: string;
  auctionLocationCity: string;
  auctionLocationZip?: string;
  oceanRoute: OceanRoute;
  isHazmat: boolean;
  containerType: 'open' | 'closed';
  titleType: 'clean' | 'salvage' | 'parts' | 'junk';
  preferential: boolean;
  deliveryTo: string;
  transport: string;
  platform?: string;
}

export interface CalcStageRow {
  key: CalcStageKey;
  label: string;
  cost: number;
  margin: number;
  currency: 'USD';
}

export interface CalculatorResultV2 {
  stages: CalcStageRow[];
  totalCost: number;
  totalMargin: number;
  total: number;
  meta: {
    warehouse: Warehouse | null;
    port: UsPort | null;
    route: OceanRoute;
    hazmat: boolean;
  };
  legacy?: CalculatorResultPayload;
}

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
  locations?: { key: string; state: string; city: string; name: string }[];
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
  land?: {
    klaipeda_to_minsk_usd: number;
    poti_to_minsk_usd: number;
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

export interface ParsedTowResult {
  rows: TowRate[];
  summary: string;
}

export interface ParsedOceanResult {
  rows: OceanRate[];
  summary: string;
}

export interface ParsedAuctionFeeResult {
  rows: AuctionFeeBracket[];
  summary: string;
}

export interface ParseUrlResult {
  auction: AuctionKey | null;
  carPrice: number | null;
  locationState: string | null;
  locationCity: string | null;
  locationZip: string | null;
  year: number | null;
  engine: number | null;
  raw: Record<string, unknown>;
}
