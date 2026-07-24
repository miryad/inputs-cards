export type Commodity = {
  slug: string;
  name: string;
  category: "Feedstocks" | "Oils" | "Food" | "Energy" | "Industrial Signals";
  description: string;
  icon: string;
  unit: string;
  relevance: string;
  stars: number;
  volatility: "Low" | "Medium" | "High";
  status: "ok" | "unavailable";
  source: string | null;
  sourceUrl: string | null;
  seriesId: string | null;
  updatedAt: string | null;
  price: number | null;
  currencyPrice: boolean;
  changes: { week: number | null; month: number | null; year: number | null };
  series: { date: string; value: number }[];
  producers: { name: string; value: number }[];
  exporters: { name: string; value: number }[];
  importers: { name: string; value: number }[];
};

export type MarketData = {
  schemaVersion: number;
  updatedAt: string | null;
  exchangeRates: Record<"USD" | "EUR" | "CNY" | "RUB", {
    value: number | null;
    updatedAt: string | null;
    source: string | null;
  }>;
  commodities: Commodity[];
};
