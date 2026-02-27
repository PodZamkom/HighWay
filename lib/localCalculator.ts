import { AGE_PRESETS } from '@/lib/calculatorDefaults';
import { findBestPortRule, findBestRate, readCalculatorConfig } from '@/lib/calculatorDb';
import type { AgePreset, CalculatorLineItem, CalculatorResultPayload, LocalCalculatorForm } from '@/types/calculator';

const POTI_DESTINATIONS = new Set(['ge', 'kg', 'uz', 'az', 'kz', 'kz_as']);

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function toAgePreset(age: number): AgePreset {
  if (age <= 3) return '0_3';
  if (age <= 5) return '3_5';
  if (age <= 7) return '5_7';
  return '7_plus';
}

function normalizeForm(input: Partial<LocalCalculatorForm>): LocalCalculatorForm {
  const age = clamp(Number(input.age) || 1, 0, 40);
  return {
    transport: String(input.transport || 'auto'),
    platform: String(input.platform || 'Any'),
    auction: String(input.auction || 'Copart'),
    deliveryTo: String(input.deliveryTo || 'by'),
    carPrice: clamp(Number(input.carPrice) || 3000, 0, 500000),
    age,
    agePreset: input.agePreset || toAgePreset(age),
    engine: clamp(Number(input.engine) || 2000, 0, 12000),
    preferential: Boolean(input.preferential),
  };
}

function getDutyRate(agePreset: AgePreset) {
  if (agePreset === '0_3') return 0.18;
  if (agePreset === '3_5') return 0.25;
  if (agePreset === '5_7') return 0.35;
  return 0.45;
}

function getEngineFloor(agePreset: AgePreset, engine: number) {
  const liters = engine / 1000;
  if (agePreset === '0_3') return liters * 130;
  if (agePreset === '3_5') return liters * 220;
  if (agePreset === '5_7') return liters * 300;
  return liters * 380;
}

function pickSeaDestination(deliveryTo: string) {
  return POTI_DESTINATIONS.has(deliveryTo) ? 'poti' : 'klaipeda';
}

function formatLine(label: string, value: number, currency: 'USD' | 'BYN'): CalculatorLineItem {
  return {
    label,
    value: Number(value.toFixed(2)),
    currency,
  };
}

function toUsd(value: CalculatorLineItem, usdByn: number) {
  if (value.currency === 'USD') return value.value;
  return value.value / usdByn;
}

function moneyToUsd(value: number, currency: 'USD' | 'BYN', usdByn: number) {
  return currency === 'BYN' ? value / usdByn : value;
}

function pickRecyclingByAgePreset(agePreset: AgePreset, fallback: ReturnType<typeof readCalculatorConfig>['fallback']) {
  if (agePreset === '0_3') return fallback.recycling_0_3_byn;
  if (agePreset === '3_5') return fallback.recycling_3_5_byn;
  if (agePreset === '5_7') return fallback.recycling_5_7_byn;
  return fallback.recycling_7_plus_byn;
}

function marginForDestination(deliveryTo: string, config: ReturnType<typeof readCalculatorConfig>) {
  if (deliveryTo === 'by') return config.margins.minsk_byn;
  if (deliveryTo === 'ge') return config.margins.georgia_byn;
  return config.margins.klaipeda_byn;
}

export function getAgePresets() {
  return AGE_PRESETS;
}

export function calculateLocalPrice(formInput: Partial<LocalCalculatorForm>): CalculatorResultPayload {
  const form = normalizeForm(formInput);
  const config = readCalculatorConfig();

  const seaDestination = pickSeaDestination(form.deliveryTo);

  const auctionRate = findBestRate({
    auction: form.auction,
    platform: form.platform,
    carPrice: form.carPrice,
    route: 'auction_fee',
  });
  const usaPortRate = findBestRate({
    auction: form.auction,
    platform: form.platform,
    carPrice: form.carPrice,
    route: 'delivery_to_usa_port',
  });

  const seaRate = findBestPortRule({ origin: 'usa_port', destination: seaDestination, routeType: 'sea' });
  const landRate = findBestPortRule({ origin: seaDestination, destination: form.deliveryTo, routeType: 'land' });

  const carPrice = formatLine('Стоимость авто', form.carPrice, 'USD');
  const auctionFee = formatLine('Аукционный сбор', auctionRate?.amount ?? config.fallback.auction_fee_usd, auctionRate?.currency ?? 'USD');
  const deliveryToPortUSA = formatLine(
    'Транспортировка в порт США',
    usaPortRate?.amount ?? config.fallback.delivery_to_usa_port_usd,
    usaPortRate?.currency ?? 'USD',
  );
  const deliveryFromPortUSA = formatLine(
    seaDestination === 'poti' ? 'Доставка от порта до Поти' : 'Доставка от порта до Клайпеды',
    moneyToUsd(
      seaRate?.cost ?? (seaDestination === 'poti' ? config.fallback.ocean_to_poti_usd : config.fallback.ocean_to_klaipeda_usd),
      seaRate?.currency ?? 'USD',
      config.rates.usd_byn,
    ),
    'USD',
  );

  const routeFallback = seaDestination === 'poti' ? config.fallback.poti_to_georgia_usd : config.fallback.klaipeda_to_minsk_usd;
  const routeLabel = seaDestination === 'poti' ? 'Доставка от Поти до места назначения' : 'Доставка от Клайпеды до места назначения';

  const marginBYN = marginForDestination(form.deliveryTo, config);
  const fromKlaipeda = formatLine(
    routeLabel,
    moneyToUsd(landRate?.cost ?? routeFallback, landRate?.currency ?? 'USD', config.rates.usd_byn) +
      marginBYN / config.rates.usd_byn,
    'USD',
  );

  const ourServicePrice = formatLine('Стоимость наших услуг', config.costs.our_services_byn, 'BYN');

  const dutyRate = getDutyRate(form.agePreset);
  let customDutyValue = Math.max(form.carPrice * dutyRate, getEngineFloor(form.agePreset, form.engine));
  if (form.preferential) {
    customDutyValue *= 0.5;
  }

  const customDuty = formatLine('Таможенная пошлина', customDutyValue, 'USD');
  const customFee = formatLine('Таможенный сбор', config.fallback.customs_fee_byn, 'BYN');
  const junkFee = formatLine('Утилизационный сбор', pickRecyclingByAgePreset(form.agePreset, config.fallback), 'BYN');
  const svxServicePrice = formatLine('Расходы на СВХ', config.costs.svh_byn, 'BYN');

  const totalUsd = [
    carPrice,
    auctionFee,
    deliveryToPortUSA,
    deliveryFromPortUSA,
    fromKlaipeda,
    ourServicePrice,
    customDuty,
    customFee,
    junkFee,
    svxServicePrice,
  ].reduce((sum, item) => sum + toUsd(item, config.rates.usd_byn), 0);

  const total = formatLine('ИТОГО', totalUsd, 'USD');

  return {
    carPrice,
    auctionFee,
    deliveryToPortUSA,
    deliveryFromPortUSA,
    fromKlaipeda,
    ourServicePrice,
    customDuty,
    customFee,
    junkFee,
    svxServicePrice,
    total,
  };
}
