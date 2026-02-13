import { CarModel, CarType } from "../types/car";

const CURRENT_YEAR = 2026;

function normalizeText(value?: string) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function hasAny(text: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

function parseMileageFromText(text: string) {
  const match = text.match(/пробег[^0-9]{0,12}(\d[\d\s.,]{1,12})\s*км/i);
  if (!match?.[1]) return null;
  const raw = match[1].replace(/[^\d]/g, "");
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function inferEngineType(source: string): CarType {
  if (hasAny(source, [/erev/i, /extended[- ]?range/i, /расширенн(?:ым|ого|ый) запас/i])) return "EREV";
  if (hasAny(source, [/phev/i, /\bhev\b/i, /plug-?in/i, /гибрид/i])) return "HEV";
  if (hasAny(source, [/\bev\b/i, /\bbev\b/i, /электр/i, /electric/i])) return "EV";
  return "ICE";
}

function inferBodyType(source: string) {
  if (hasAny(source, [/пикап/i, /pickup/i])) return "Пикап";
  if (hasAny(source, [/минив[эе]н/i, /\bmpv\b/i, /minivan/i, /\bvan\b/i])) return "Минивэн";
  if (hasAny(source, [/купе/i, /coupe/i])) return "Купе";
  if (hasAny(source, [/хэтч/i, /hatchback/i])) return "Хэтчбек";
  if (hasAny(source, [/лифтбек/i, /liftback/i])) return "Лифтбек";
  if (hasAny(source, [/универсал/i, /wagon/i])) return "Универсал";
  if (hasAny(source, [/седан/i, /sedan/i])) return "Седан";
  if (hasAny(source, [/внедорож/i, /кроссовер/i, /\bsuv\b/i, /crossover/i])) return "Кроссовер";
  return "Кроссовер";
}

function inferTransmission(source: string, engineType: CarType) {
  if (hasAny(source, [/односкорост/i, /single-?speed/i])) return "Односкоростная";
  if (hasAny(source, [/вариатор/i, /\bcvt\b/i])) return "Вариатор";
  if (hasAny(source, [/робот/i, /\bdct\b/i, /\bdsg\b/i, /\bpdk\b/i])) return "Робот";
  if (hasAny(source, [/механик/i, /\bmt\b/i, /manual/i])) return "Механика";
  if (hasAny(source, [/автомат/i, /\bat\b/i, /automatic/i])) return "Автомат";
  if (engineType === "EV" || engineType === "EREV") return "Односкоростная";
  return "Автомат";
}

function inferDrive(source: string) {
  if (hasAny(source, [/\bawd\b/i, /\b4wd\b/i, /\b4x4\b/i, /xdrive/i, /quattro/i, /полный/i, /four-?wheel/i])) {
    return "Полный";
  }
  if (hasAny(source, [/\bfwd\b/i, /\bsdrive\b/i, /передн/i, /front-?wheel/i, /\b2wd\b/i])) return "Передний";
  if (hasAny(source, [/\brwd\b/i, /задн/i, /rear-?wheel/i])) return "Задний";
  return "Передний";
}

function inferMileage(car: CarModel, source: string) {
  if (typeof car.mileage_km === "number" && Number.isFinite(car.mileage_km) && car.mileage_km >= 0) {
    return car.mileage_km;
  }

  const parsedFromDescription = parseMileageFromText(source);
  if (parsedFromDescription !== null) return parsedFromDescription;

  if (car.condition === "New") return 0;

  const age = Math.max(1, CURRENT_YEAR - car.year);
  return age * 12000;
}

export function enrichCarAttributes(car: CarModel): CarModel {
  const source = normalizeText([car.id, car.slug, car.model, car.generation, car.description].filter(Boolean).join(" "));
  const sourceLower = source.toLowerCase();
  const derivedEngineType = car.type ?? inferEngineType(sourceLower);

  return {
    ...car,
    type: derivedEngineType,
    body_type: car.body_type ?? inferBodyType(sourceLower),
    transmission: car.transmission ?? inferTransmission(sourceLower, derivedEngineType),
    drive: car.drive ?? inferDrive(sourceLower),
    mileage_km: inferMileage(car, source),
  };
}
