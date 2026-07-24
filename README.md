# Inputs Cards

Inputs Cards is a lightweight, open-source market dashboard for industrial biotech investors. It answers one question: **has anything materially changed in input markets since yesterday?**

The interface covers 17 feedstock, oil, food, energy, and industrial-signal markets. Each card shows the latest successful observation, official unit, short- and long-term changes, source, freshness, and a compact trend. Detail pages add history, trade and production rankings, filtered supply-side news, and source links.

## Architecture

The application is a React and TypeScript site built with Vite/vinext, Tailwind CSS, React Router, and Recharts. It has no backend, database, authentication, or browser-side market APIs. Scheduled GitHub Actions download, validate, and normalize market data into `app/data/commodities.json`; the frontend imports only that static snapshot.

## Supported markets

- Feedstocks: Sugar, Corn, Wheat, Soybeans, Cassava
- Vegetable oils: Palm Oil, Rapeseed Oil, Sunflower Oil
- Food ingredients: Skim Milk Powder, Whole Milk Powder, Whey
- Energy: Brent, Henry Hub, TTF Natural Gas
- Industrial signals: Copper, Urea, Ammonia

Unavailable markets remain visible and explicitly say **Data unavailable**. The application never generates substitute observations.

## Source hierarchy

1. Trading Economics official benchmark history for Brent, Henry Hub, Corn, Wheat, Soybeans, Sugar, Copper, and TTF Gas when entitled by the configured subscription.
2. Institutional fallbacks distributed by FRED: U.S. EIA daily series and World Bank commodity-price series.
3. No value. A missing or invalid source becomes `Data unavailable`; synthetic data is prohibited.

Provider data is kept at its published frequency. Missing dates are preserved rather than interpolated.

## GitHub Secret

Create a repository Actions secret named `TRADING_ECONOMICS_API_KEY`:

1. Open **Settings → Secrets and variables → Actions**.
2. Choose **New repository secret**.
3. Name it `TRADING_ECONOMICS_API_KEY` and paste the official Trading Economics API key.

The key is read only by `scripts/update-data.mjs` inside GitHub Actions. It is never written to JSON, bundled into JavaScript, or accessed by browser code. Without the secret, the updater uses institutional fallbacks.

See [ARCHITECTURE.md](ARCHITECTURE.md) and [DATA_SOURCES.md](DATA_SOURCES.md) for details.

## Local setup

Requirements: Node.js 22 or newer.

The project uses pnpm 11. Dependency install scripts are denied by default;
the reviewed native build dependencies are explicitly listed under
`allowBuilds` in `pnpm-workspace.yaml`, so CI installs remain non-interactive
and fail closed when a new package introduces an unreviewed script.

```bash
pnpm install
pnpm run dev
```

Open the local URL printed by the development server.

Production verification:

```bash
pnpm run build
pnpm run build:pages
pnpm test
```

## Deployment

Push `main` to GitHub and enable **Settings → Pages → Source: GitHub Actions**. `.github/workflows/deploy-pages.yml` runs the dedicated static Vite build and publishes `dist`. The Pages build uses `/inputs-cards/` as its base path, emits `dist/index.html`, and includes a matching `404.html` SPA fallback for direct commodity URLs.

The existing vinext build remains available for Codex Sites private previews; GitHub Pages does not depend on its server or Worker output.

## Add a commodity

1. Copy a file in `config/`.
2. Give it a unique slug, official unit, source dataset identifier, relevance, and news source.
3. Add its validated snapshot entry to the static market dataset.
4. Run `pnpm run build`.

Configuration is intentionally one JSON file per commodity; no component changes are needed for an existing category.

## Update datasets

Run:

```bash
TRADING_ECONOMICS_API_KEY="your-key" pnpm run data:update
```

Omit the environment variable to exercise public institutional fallbacks locally.

The updater discovers Trading Economics commodity symbols, requests a bounded ten-year daily history, retries rate limits and transient failures with exponential backoff, and then tries the configured institutional series. Validation rejects empty data, duplicate dates, non-positive or non-numeric values, jumps above 10×, and stale observations. Missing observations are not interpolated.

The normalized snapshot is written through a temporary file and atomically renamed. It is rewritten only when normalized data changes. The weekday workflow commits a changed snapshot; when nothing changes, it creates no commit.

## License

MIT. See [LICENSE](LICENSE). Data remains subject to each publisher’s terms.
