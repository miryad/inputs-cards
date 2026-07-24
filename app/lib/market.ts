import marketData from "../data/commodities.json";
import type { Commodity, MarketData } from "./types";

const data = marketData as MarketData;

export const commodities: Commodity[] = data.commodities;
export const latestUpdate = data.updatedAt;
export const exchangeRates = data.exchangeRates;
export type Currency = keyof MarketData["exchangeRates"];
export const categories = ["Feedstocks","Oils","Food","Energy","Industrial Signals"] as const;

export function convertPrice(price: number | null, unit: string, target: Currency, currencyPrice: boolean) {
  if (price === null || !currencyPrice) return price;
  const source = (["USD","EUR","CNY","RUB"] as Currency[]).find(currency => unit.startsWith(currency));
  if (!source) return price;
  const sourceRate = exchangeRates[source].value;
  const targetRate = exchangeRates[target].value;
  if (sourceRate === null || targetRate === null) return null;
  return (price / sourceRate) * targetRate;
}

export function convertedUnit(unit: string, target: Currency, currencyPrice: boolean) {
  if (!currencyPrice) return unit;
  return unit.replace(/^(USD|EUR|CNY|RUB)/, target);
}
