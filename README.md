# Inputs Cards

Inputs Cards is a lightweight, open-source market dashboard for industrial biotech investors. It answers one question: **has anything materially changed in input markets since yesterday?**

The interface covers 17 feedstock, oil, food, energy, and industrial-signal markets. Each card shows the latest successful observation, official unit, short- and long-term changes, source, freshness, and a compact trend. Detail pages add history, trade and production rankings, filtered supply-side news, and source links.

## Architecture

The application is a React and TypeScript site built with Vite/vinext, Tailwind CSS, React Router, and Recharts. It has no backend, database, authentication, or browser-side market APIs. Scheduled GitHub Actions download public data into versioned JSON. If a provider fails, the updater retains the previous successful observations.

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
pnpm test
```

## Deployment

Push `main` to GitHub and enable **Settings → Pages → Source: GitHub Actions**. `.github/workflows/deploy-pages.yml` builds and publishes `dist/client`. The router includes a safe root fallback for unknown URLs.

The project also includes Codex Sites hosting metadata for private previews.

## Add a commodity

1. Copy a file in `config/`.
2. Give it a unique slug, official unit, source dataset identifier, relevance, and news source.
3. Add its validated snapshot entry to the static market dataset.
4. Run `pnpm run build`.

Configuration is intentionally one JSON file per commodity; no component changes are needed for an existing category.

## Update datasets

Run:

```bash
node scripts/update-data.mjs
```

The updater downloads into memory, validates each response, writes a temporary JSON file, and atomically replaces the repository snapshot only when at least one source succeeds. Failed sources retain their previous successful data. The scheduled workflow runs on weekdays and commits valid changes.

## License

MIT. See [LICENSE](LICENSE). Data remains subject to each publisher’s terms.
