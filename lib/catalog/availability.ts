import type { Availability } from "@/types/car";

export const AVAILABILITY_VALUES = ["InStockKhorgos", "InStockMinsk", "EnRoute", "OnOrder"] as const;

export function parseAvailability(value: string | null | undefined): Availability | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  if (trimmed === "InStockKhorgos" || trimmed === "InStockMinsk" || trimmed === "EnRoute" || trimmed === "OnOrder") {
    return trimmed;
  }

  const normalized = trimmed
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

  if (normalized === "instockkhorgos" || normalized === "instock" || normalized === "вналичиивхоргосе" || normalized === "хоргос") {
    return "InStockKhorgos";
  }

  if (normalized === "instockminsk" || normalized === "вминске" || normalized === "minsk") {
    return "InStockMinsk";
  }

  if (normalized === "enroute" || normalized === "впути" || normalized === "intransit") {
    return "EnRoute";
  }

  if (normalized === "onorder" || normalized === "подзаказ") {
    return "OnOrder";
  }

  return undefined;
}

export function normalizeAvailability(value: string | null | undefined, fallback: Availability = "OnOrder"): Availability {
  return parseAvailability(value) ?? fallback;
}

export function isInStockAvailability(value: string | null | undefined): boolean {
  const parsed = parseAvailability(value);
  return parsed === "InStockKhorgos" || parsed === "InStockMinsk";
}

export function availabilityLabel(value: string | null | undefined): string {
  const parsed = normalizeAvailability(value);

  switch (parsed) {
    case "InStockKhorgos":
      return "В наличии в Хоргосе";
    case "InStockMinsk":
      return "В наличии в Минске";
    case "EnRoute":
      return "В пути";
    case "OnOrder":
      return "Под заказ";
    default:
      return parsed;
  }
}
