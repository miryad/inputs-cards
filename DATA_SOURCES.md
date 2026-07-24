# Data sources

The updater applies this hierarchy independently for each commodity.

## Priority 1: Trading Economics

The official Trading Economics REST API supplies exchange and benchmark histories when `TRADING_ECONOMICS_API_KEY` is configured and the subscription entitles the requested series. The updater fetches the commodity catalog to resolve current symbols, then requests bounded historical daily data using those symbols.

Target benchmarks: Brent, Henry Hub Natural Gas, Corn, Wheat, Soybeans, Sugar, Copper, and TTF Gas.

## Priority 2: institutions

Institutional fallbacks use public series distributed through FRED:

| Market | Series | Origin |
|---|---|---|
| Brent | `DCOILBRENTEU` | U.S. Energy Information Administration |
| Henry Hub | `DHHNGSP` | U.S. Energy Information Administration |
| Sugar | `PSUGAISAUSDM` | World Bank |
| Corn | `PMAIZMTUSDM` | World Bank |
| Wheat | `PWHEAMTUSDM` | World Bank |
| Soybeans | `PSOYBUSDM` | World Bank |
| Palm Oil | `PPOILUSDM` | World Bank |
| Rapeseed Oil | `PROILUSDM` | World Bank |
| Sunflower Oil | `PSUNOUSDM` | World Bank |
| TTF/European gas fallback | `PNGASEUUSDM` | World Bank |
| Copper | `PCOPPUSDM` | World Bank |
| Urea | `PURANUSDM` | World Bank |

Institutional frequency is retained: EIA series are daily and World Bank series are monthly. The UI shows the exact source, series identifier, unit, and latest observation timestamp.

## Unavailable data

Cassava and ammonia remain unavailable until a reliable benchmark adapter passes the same validation contract. Skim Milk Powder, Whole Milk Powder, and Whey use weekly EU average prices from the EU Milk Market Observatory workbook. The UI renders unavailable states gracefully. No proxy, interpolation, synthetic curve, or fabricated price is substituted.

EU Milk Market Observatory, USDA, FAO, Eurostat, and World Bank direct-download adapters can be added as reviewed sources without changing frontend code; only the generated JSON contract matters.
