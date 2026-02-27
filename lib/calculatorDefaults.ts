import type { CalculatorConfig } from '@/types/calculator';

export const AGE_PRESETS = [
  { key: '0_3', name: 'Авто от 0 до 3 лет', min: 0, max: 3 },
  { key: '3_5', name: 'Авто от 3 до 5 лет', min: 3, max: 5 },
  { key: '5_7', name: 'Авто от 5 до 7 лет', min: 5, max: 7 },
  { key: '7_plus', name: 'Авто старше 7 лет', min: 8, max: null },
] as const;

export const DEFAULT_CALCULATOR_CONFIG: CalculatorConfig = {
  rates: {
    usd_byn: 3.4,
    eur_usd: 1.05,
  },
  fallback: {
    auction_fee_usd: 870,
    delivery_to_usa_port_usd: 275,
    ocean_to_klaipeda_usd: 1825,
    ocean_to_poti_usd: 1500,
    klaipeda_to_minsk_usd: 350,
    poti_to_georgia_usd: 420,
    customs_fee_byn: 120,
    recycling_0_3_byn: 545,
    recycling_3_5_byn: 760,
    recycling_5_7_byn: 980,
    recycling_7_plus_byn: 1200,
  },
  costs: {
    our_services_byn: 990,
    svh_byn: 650,
  },
  margins: {
    minsk_byn: 0,
    klaipeda_byn: 0,
    georgia_byn: 0,
  },
  policies: {
    ai_model: 'gpt-4.1-mini',
  },
};

export const CONFIG_KEYS: Array<keyof CalculatorConfig> = ['rates', 'fallback', 'costs', 'margins', 'policies'];
