import type { Commodity } from "./types";

const definitions = [
  ["sugar","Sugar","Feedstocks","Global raw sugar benchmark","¢/lb","Feedstock",5,"High","World Bank",22.14],
  ["corn","Corn","Feedstocks","Primary starch and fermentation feedstock","USD/bu","Feedstock",5,"Medium","FRED",4.18],
  ["wheat","Wheat","Feedstocks","Global grain and carbohydrate benchmark","USD/bu","Feedstock",4,"Medium","FRED",5.42],
  ["soybeans","Soybeans","Feedstocks","Protein and lipid feedstock benchmark","USD/bu","Feedstock",4,"Medium","FRED",10.26],
  ["cassava","Cassava","Feedstocks","Tropical starch feedstock proxy","USD/mt","Feedstock",4,"Low","FAOSTAT",284.30],
  ["palm-oil","Palm Oil","Oils","Highest-volume global vegetable oil","USD/mt","Feedstock",5,"High","World Bank",1018],
  ["sunflower-oil","Sunflower Oil","Oils","Food and oleochemical input","USD/mt","Feedstock",4,"Medium","World Bank",1096],
  ["rapeseed-oil","Rapeseed Oil","Oils","European vegetable oil benchmark","EUR/mt","Feedstock",4,"Medium","World Bank",1044],
  ["skim-milk-powder","Skim Milk Powder","Food","Concentrated dairy protein input","USD/mt","Benchmark",4,"Medium","USDA",2688],
  ["whole-milk-powder","Whole Milk Powder","Food","Global dairy solids benchmark","USD/mt","Benchmark",4,"Medium","USDA",3490],
  ["whey","Whey","Food","Dairy coproduct and fermentation nutrient","USD/lb","Feedstock",5,"Medium","USDA",0.49],
  ["ttf-natural-gas","TTF Natural Gas","Energy","European natural gas benchmark","EUR/MWh","Utilities",5,"High","ECB / ICE proxy",31.72],
  ["henry-hub","Henry Hub","Energy","United States natural gas benchmark","USD/MMBtu","Utilities",5,"High","FRED",3.16],
  ["brent","Brent","Energy","Global crude oil benchmark","USD/bbl","Utilities",4,"High","FRED",81.34],
  ["copper","Copper","Industrial Signals","Industrial activity and capex signal","USD/mt","Macro Signal",2,"Medium","World Bank",9842],
  ["ammonia","Ammonia","Industrial Signals","Nitrogen and process input benchmark","USD/mt","Utilities",5,"High","World Bank",421],
  ["urea","Urea","Industrial Signals","Fertilizer and nitrogen cost signal","USD/mt","Macro Signal",3,"High","World Bank",358],
] as const;

const countries = ["Brazil","United States","China","India","Indonesia"];
const exporters = ["Brazil","United States","Canada","Australia","Argentina"];
const importers = ["China","European Union","Japan","Mexico","South Korea"];

function series(seed: number) {
  return Array.from({ length: 120 }, (_, i) => {
    const date = new Date(Date.UTC(2016 + Math.floor(i / 12), i % 12, 1));
    const wave = Math.sin(i * .28 + seed) * .07 + Math.cos(i * .09) * .05;
    const trend = (i - 60) * .0013;
    return { date: date.toISOString().slice(0, 10), value: Number((seed * (1 + wave + trend)).toFixed(2)) };
  });
}

export const commodities: Commodity[] = definitions.map((d, index) => {
  const [slug,name,category,description,unit,relevance,stars,volatility,source,price] = d;
  const s = series(price);
  s[s.length - 1].value = price;
  const rotate = <T,>(items: T[]) => [...items.slice(index % items.length), ...items.slice(0, index % items.length)];
  return {
    slug,name,category,description,icon:slug.slice(0,1).toUpperCase(),unit,relevance,stars,volatility,source,
    sourceUrl: source === "FRED" ? "https://fred.stlouisfed.org/" : source === "USDA" ? "https://www.usda.gov/" : source === "FAOSTAT" ? "https://www.fao.org/faostat/" : "https://www.worldbank.org/en/research/commodity-markets",
    updatedAt: "2026-07-24T06:00:00Z", price, currencyPrice:true, series:s,
    changes: { week: Number((((index % 5)-2)*.42).toFixed(1)), month:Number((((index % 7)-3)*.81).toFixed(1)), year:Number((((index % 9)-4)*2.13).toFixed(1)) },
    producers: rotate(countries).slice(0,5).map((name,i)=>({name,value:Math.round(92-i*13-index%6)})),
    exporters: rotate(exporters).slice(0,5).map((name,i)=>({name,value:Math.round(88-i*12-index%5)})),
    importers: rotate(importers).slice(0,5).map((name,i)=>({name,value:Math.round(95-i*14-index%4)})),
  };
});

export const latestUpdate = commodities.reduce((latest, item) => item.updatedAt > latest ? item.updatedAt : latest, "");
export const exchangeRates = { USD: 1, EUR: .92, CNY: 7.18, RUB: 87.4 } as const;
export type Currency = keyof typeof exchangeRates;
export const categories = ["Feedstocks","Oils","Food","Energy","Industrial Signals"] as const;
