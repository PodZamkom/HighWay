import type { Market } from "@/types/car";

export type CatalogCurrency = "USD" | "EUR" | "BYN" | "JPY" | "CNY" | "KRW";

export const MARKET_CURRENCY_POLICY: Record<Market, CatalogCurrency> = {
  China: "USD",
  USA: "USD",
  Korea: "USD",
  Europe: "EUR",
};

export function normalizeMarket(value: string | null | undefined): Market | null {
  const normalized = (value || "").trim().toLowerCase();
  if (normalized === "china") return "China";
  if (normalized === "usa") return "USA";
  if (normalized === "korea") return "Korea";
  if (normalized === "europe") return "Europe";
  return null;
}

export function normalizeCatalogCurrency(value: string | null | undefined): CatalogCurrency | null {
  const normalized = (value || "").trim().toUpperCase();
  if (normalized === "USD") return "USD";
  if (normalized === "EUR") return "EUR";
  if (normalized === "BYN") return "BYN";
  if (normalized === "JPY") return "JPY";
  if (normalized === "CNY") return "CNY";
  if (normalized === "KRW") return "KRW";
  return null;
}

export function getMarketDefaultCurrency(market: Market): CatalogCurrency {
  return MARKET_CURRENCY_POLICY[market];
}

export function isMarketCurrencyAllowed(market: Market, currency: CatalogCurrency): boolean {
  return MARKET_CURRENCY_POLICY[market] === currency;
}

export function buildMarketCurrencyErrorMessage(market: Market, currency: string): string {
  return `Для рынка ${market} разрешена только валюта ${getMarketDefaultCurrency(market)} (получено: ${currency})`;
}

export class CurrencyPolicyError extends Error {
  readonly market: Market;
  readonly currency: string;

  constructor(market: Market, currency: string) {
    super(buildMarketCurrencyErrorMessage(market, currency));
    this.name = "CurrencyPolicyError";
    this.market = market;
    this.currency = currency;
  }
}

export function assertMarketCurrencyAllowed(market: Market, currency: CatalogCurrency): void {
  if (!isMarketCurrencyAllowed(market, currency)) {
    throw new CurrencyPolicyError(market, currency);
  }
}
