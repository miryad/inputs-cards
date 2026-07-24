import { mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const outputPath = path.resolve("app/data/commodities.json");
const temporaryPath = `${outputPath}.next`;
const tradingEconomicsKey = process.env.TRADING_ECONOMICS_API_KEY?.trim();
const now = new Date();
const historyStart = new Date(Date.UTC(now.getUTCFullYear() - 10, now.getUTCMonth(), now.getUTCDate()))
  .toISOString()
  .slice(0, 10);
const historyEnd = now.toISOString().slice(0, 10);

const sourcePlans = {
  sugar: {
    tradingEconomicsName: "Sugar",
    fallbacks: [fred("PSUGAISAUSDM", "World Bank via FRED", "¢/lb", "monthly")],
  },
  corn: {
    tradingEconomicsName: "Corn",
    fallbacks: [fred("PMAIZMTUSDM", "World Bank via FRED", "USD/mt", "monthly")],
  },
  wheat: {
    tradingEconomicsName: "Wheat",
    fallbacks: [fred("PWHEAMTUSDM", "World Bank via FRED", "USD/mt", "monthly")],
  },
  soybeans: {
    tradingEconomicsName: "Soybeans",
    fallbacks: [fred("PSOYBUSDM", "World Bank via FRED", "USD/mt", "monthly")],
  },
  cassava: { fallbacks: [] },
  "palm-oil": {
    fallbacks: [fred("PPOILUSDM", "World Bank via FRED", "USD/mt", "monthly")],
  },
  "sunflower-oil": {
    fallbacks: [fred("PSUNOUSDM", "World Bank via FRED", "USD/mt", "monthly")],
  },
  "rapeseed-oil": {
    fallbacks: [fred("PROILUSDM", "World Bank via FRED", "USD/mt", "monthly")],
  },
  "skim-milk-powder": { fallbacks: [euDairy("SMP", "EU-MMO-SMP")] },
  "whole-milk-powder": { fallbacks: [euDairy("WMP", "EU-MMO-WMP")] },
  whey: { fallbacks: [euDairy("WHEYPOWDER", "EU-MMO-WHEYPOWDER")] },
  "ttf-natural-gas": {
    tradingEconomicsName: "TTF Gas",
    fallbacks: [fred("PNGASEUUSDM", "World Bank via FRED", "USD/MMBtu", "monthly")],
  },
  "henry-hub": {
    tradingEconomicsName: "Natural gas",
    fallbacks: [fred("DHHNGSP", "U.S. EIA via FRED", "USD/MMBtu", "daily")],
  },
  brent: {
    tradingEconomicsName: "Brent",
    fallbacks: [fred("DCOILBRENTEU", "U.S. EIA via FRED", "USD/bbl", "daily")],
  },
  copper: {
    tradingEconomicsName: "Copper",
    fallbacks: [fred("PCOPPUSDM", "World Bank via FRED", "USD/mt", "monthly")],
  },
  ammonia: { fallbacks: [] },
  urea: {
    fallbacks: [fred("PURANUSDM", "World Bank via FRED", "USD/mt", "monthly")],
  },
};

function fred(seriesId, source, unit, frequency) {
  return { type: "fred", seriesId, source, unit, frequency };
}

function euDairy(column, seriesId) {
  return { type: "eu-dairy", column, seriesId };
}

async function fetchWithRetry(url, label, attempts = 4) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await fetch(url, { headers: { Accept: "application/json, text/csv" } });
      if (response.ok) return response;
      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable) {
        const error = new Error(`${label}: HTTP ${response.status}`);
        error.nonRetryable = true;
        throw error;
      }
      const retryAfter = Number(response.headers.get("retry-after"));
      const delay = Number.isFinite(retryAfter) ? retryAfter * 1000 : 1000 * 2 ** attempt;
      console.warn(`${label}: HTTP ${response.status}; retrying in ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    } catch (error) {
      if (error?.nonRetryable) throw error;
      lastError = error;
      if (attempt === attempts - 1) break;
      const delay = 1000 * 2 ** attempt;
      console.warn(`${label}: request failed; retrying in ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError ?? new Error(`${label}: request failed`);
}

async function fetchTradingEconomicsCatalog() {
  if (!tradingEconomicsKey) {
    console.warn("Trading Economics: TRADING_ECONOMICS_API_KEY is not configured; using official fallbacks.");
    return [];
  }
  const url = new URL("https://api.tradingeconomics.com/markets/commodities");
  url.searchParams.set("c", tradingEconomicsKey);
  url.searchParams.set("f", "json");
  const response = await fetchWithRetry(url, "Trading Economics catalog");
  const rows = await response.json();
  if (!Array.isArray(rows)) throw new Error("Trading Economics catalog: invalid response");
  return rows;
}

async function fetchTradingEconomicsSeries(name, catalog) {
  const quote = catalog.find((row) => String(row.Name).toLowerCase() === name.toLowerCase());
  if (!quote?.Symbol) throw new Error(`Trading Economics: benchmark "${name}" was not found`);
  const url = new URL(`https://api.tradingeconomics.com/markets/historical/${encodeURIComponent(quote.Symbol)}`);
  url.searchParams.set("c", tradingEconomicsKey);
  url.searchParams.set("d1", historyStart);
  url.searchParams.set("d2", historyEnd);
  url.searchParams.set("f", "json");
  const response = await fetchWithRetry(url, `Trading Economics ${name}`);
  const rows = await response.json();
  const series = rows.map((row) => ({
    date: normalizeDate(row.Date),
    value: Number(row.Close),
  }));
  return {
    source: "Trading Economics",
    sourceUrl: `https://tradingeconomics.com${quote.URL ?? "/commodities"}`,
    seriesId: String(quote.Symbol),
    unit: String(quote.unit || quote.Unit || ""),
    frequency: "daily",
    series,
  };
}

async function fetchFredSeries(plan) {
  const url = new URL("https://fred.stlouisfed.org/graph/fredgraph.csv");
  url.searchParams.set("id", plan.seriesId);
  url.searchParams.set("cosd", historyStart);
  url.searchParams.set("coed", historyEnd);
  const response = await fetchWithRetry(url, `FRED ${plan.seriesId}`);
  const lines = (await response.text()).trim().split(/\r?\n/).slice(1);
  const series = lines.map((line) => {
    const [date, rawValue] = line.split(",");
    return { date, value: Number(rawValue) };
  }).filter((point) => point.date && Number.isFinite(point.value) && point.value > 0);
  return {
    source: plan.source,
    sourceUrl: `https://fred.stlouisfed.org/series/${plan.seriesId}`,
    seriesId: plan.seriesId,
    unit: plan.unit,
    frequency: plan.frequency,
    series,
  };
}

async function fetchEuDairySeries(plan) {
  const workbookUrl = "https://agriculture.ec.europa.eu/document/download/62d01488-33a0-4601-a841-ca48fa11d999_en?filename=eu-milk-historical-price-series_en.xlsx";
  const response = await fetchWithRetry(workbookUrl, `EU Milk Market Observatory ${plan.column}`);
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(await response.arrayBuffer(), { type: "array", cellDates: true });
  const sheet = workbook.Sheets["Dairy Products Prices"];
  if (!sheet) throw new Error("EU dairy workbook: expected sheet is missing");
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: null });
  const header = rows[5] ?? [];
  const valueIndex = header.findIndex((value) => value === plan.column);
  if (valueIndex < 0) throw new Error(`EU dairy workbook: ${plan.column} column is missing`);
  const series = rows.slice(6).map((row) => {
    const rawDate = row[0];
    const date = rawDate instanceof Date
      ? rawDate.toISOString().slice(0, 10)
      : typeof rawDate === "number"
        ? excelDate(rawDate, XLSX)
        : normalizeDate(String(rawDate ?? ""));
    return { date, value: Number(row[valueIndex]) };
  }).filter((point) => point.date >= historyStart && Number.isFinite(point.value) && point.value > 0);
  return {
    source: "EU Milk Market Observatory",
    sourceUrl: "https://agriculture.ec.europa.eu/data-and-analysis/markets/overviews/market-observatories/milk_en",
    seriesId: plan.seriesId,
    unit: "EUR/100kg",
    frequency: "weekly",
    series,
  };
}

function excelDate(serial, XLSX) {
  const parsed = XLSX.SSF.parse_date_code(serial);
  if (!parsed) return "";
  return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
}

function normalizeDate(value) {
  if (typeof value !== "string") return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!match) return "";
  return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
}

function validateSeries(dataset) {
  if (!dataset.series.length) throw new Error("empty dataset");
  const sorted = [...dataset.series].sort((a, b) => a.date.localeCompare(b.date));
  const seen = new Set();
  for (const point of sorted) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(point.date) || !Number.isFinite(point.value) || point.value <= 0) {
      throw new Error(`invalid observation at ${point.date || "unknown date"}`);
    }
    if (seen.has(point.date)) throw new Error(`duplicated observation at ${point.date}`);
    seen.add(point.date);
  }
  for (let index = 1; index < sorted.length; index++) {
    const ratio = Math.max(sorted[index].value, sorted[index - 1].value) /
      Math.min(sorted[index].value, sorted[index - 1].value);
    if (ratio > 10) throw new Error(`impossible jump at ${sorted[index].date} (${ratio.toFixed(1)}x)`);
  }
  const latestDate = new Date(`${sorted.at(-1).date}T00:00:00Z`);
  const maxAgeDays = dataset.frequency === "daily" ? 14 : dataset.frequency === "weekly" ? 35 : 120;
  const ageDays = (now.getTime() - latestDate.getTime()) / 86_400_000;
  if (ageDays > maxAgeDays) throw new Error(`stale dataset (${Math.floor(ageDays)} days old)`);
  return sorted;
}

function observationChange(series, days) {
  const latest = series.at(-1);
  const target = new Date(`${latest.date}T00:00:00Z`);
  target.setUTCDate(target.getUTCDate() - days);
  const targetDate = target.toISOString().slice(0, 10);
  const prior = [...series].reverse().find((point) => point.date <= targetDate);
  if (!prior) return null;
  return Number((((latest.value - prior.value) / prior.value) * 100).toFixed(2));
}

async function loadConfigs() {
  const directory = path.resolve("config");
  const files = (await readdir(directory)).filter((file) => file.endsWith(".json")).sort();
  return Promise.all(files.map(async (file) => JSON.parse(await readFile(path.join(directory, file), "utf8"))));
}

function unavailableCommodity(config) {
  return {
    slug: config.slug,
    name: config.displayName,
    category: config.category,
    description: config.description,
    icon: config.icon,
    unit: config.unit,
    relevance: config.relevance.replace(/^★+\s*/, ""),
    stars: (config.relevance.match(/★/g) ?? []).length,
    volatility: `${config.volatility[0].toUpperCase()}${config.volatility.slice(1)}`,
    status: "unavailable",
    source: null,
    sourceUrl: null,
    seriesId: null,
    updatedAt: null,
    price: null,
    currencyPrice: /(?:USD|EUR|CNY|RUB)/.test(config.unit),
    changes: { week: null, month: null, year: null },
    series: [],
    producers: [],
    exporters: [],
    importers: [],
  };
}

async function buildCommodity(config, catalog) {
  const plan = sourcePlans[config.slug] ?? { fallbacks: [] };
  const candidates = [];
  if (plan.tradingEconomicsName && tradingEconomicsKey) {
    candidates.push(() => fetchTradingEconomicsSeries(plan.tradingEconomicsName, catalog));
  }
  for (const fallback of plan.fallbacks) {
    if (fallback.type === "fred") candidates.push(() => fetchFredSeries(fallback));
    if (fallback.type === "eu-dairy") candidates.push(() => fetchEuDairySeries(fallback));
  }
  for (const candidate of candidates) {
    try {
      const dataset = await candidate();
      const series = validateSeries(dataset);
      const latest = series.at(-1);
      console.log(`${config.displayName}: ${dataset.source} ${dataset.seriesId} (${series.length} observations)`);
      return {
        ...unavailableCommodity(config),
        status: "ok",
        source: dataset.source,
        sourceUrl: dataset.sourceUrl,
        seriesId: dataset.seriesId,
        unit: dataset.unit || config.unit,
        updatedAt: `${latest.date}T00:00:00Z`,
        price: latest.value,
        currencyPrice: /(?:USD|EUR|CNY|RUB)/.test(dataset.unit || config.unit),
        changes: {
          week: observationChange(series, 7),
          month: observationChange(series, 30),
          year: observationChange(series, 365),
        },
        series,
      };
    } catch (error) {
      console.error(`${config.displayName}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  console.warn(`${config.displayName}: Data unavailable`);
  return unavailableCommodity(config);
}

async function fetchExchangeRates() {
  const rates = {
    USD: { value: 1, updatedAt: null, source: "Identity" },
    EUR: { value: null, updatedAt: null, source: "Federal Reserve via FRED" },
    CNY: { value: null, updatedAt: null, source: "Federal Reserve via FRED" },
    RUB: { value: null, updatedAt: null, source: null },
  };
  const plans = [
    { currency: "EUR", seriesId: "DEXUSEU", invert: true },
    { currency: "CNY", seriesId: "DEXCHUS", invert: false },
  ];
  for (const plan of plans) {
    try {
      const dataset = await fetchFredSeries(fred(plan.seriesId, "Federal Reserve via FRED", "", "daily"));
      const series = validateSeries(dataset);
      const latest = series.at(-1);
      rates[plan.currency] = {
        value: plan.invert ? Number((1 / latest.value).toFixed(6)) : latest.value,
        updatedAt: `${latest.date}T00:00:00Z`,
        source: dataset.source,
      };
    } catch (error) {
      console.error(`${plan.currency} exchange rate: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return rates;
}

async function main() {
  const configs = await loadConfigs();
  let catalog = [];
  try {
    catalog = await fetchTradingEconomicsCatalog();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
  }
  const commodities = [];
  for (const config of configs) commodities.push(await buildCommodity(config, catalog));
  const exchangeRates = await fetchExchangeRates();
  const availableDates = commodities.map((item) => item.updatedAt).filter(Boolean).sort();
  const document = {
    schemaVersion: 1,
    updatedAt: availableDates.at(-1) ?? null,
    exchangeRates,
    commodities,
  };
  const serialized = `${JSON.stringify(document, null, 2)}\n`;
  const previous = await readFile(outputPath, "utf8").catch(() => "");
  if (previous === serialized) {
    console.log("Market data is unchanged; no file was rewritten.");
    return;
  }
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(temporaryPath, serialized);
  await rename(temporaryPath, outputPath);
  console.log(`Wrote ${outputPath}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
