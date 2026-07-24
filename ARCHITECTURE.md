# Architecture

## Folder structure

- `app/` — routes, small UI components, market model, and global styles
- `config/` — one declarative JSON file per commodity
- `app/data/commodities.json` — generated, versioned market snapshot consumed by the site
- `scripts/` — dependency-free data updater
- `.github/workflows/` — resilient data refresh and GitHub Pages deployment

## Configuration system

Commodity identity, category, description, official unit, relevance, volatility, datasets, and news source live in `config/<slug>.json`. Slugs are stable public identifiers. Presentation components operate on the shared `Commodity` type and contain no commodity-specific branches.

## Data pipeline

The weekday workflow checks out the repository and runs `scripts/update-data.mjs`. Trading Economics benchmark history is tried first when its secret is configured; institutional fallbacks are tried next. Each series must be non-empty, uniquely dated, positive, finite, recent for its frequency, and free of impossible jumps. Missing dates are retained as gaps. When no candidate passes, the generated commodity record is explicitly unavailable.

The assembled document is first written to a temporary file and then atomically renamed. Byte-for-byte comparison prevents rewrites and commits when observations have not changed.

Git history is the audit trail and rollback mechanism. The frontend never calls market providers.

## Rendering flow

The dashboard imports the generated JSON snapshot at build time, groups it by category, applies display-only currency conversion, and renders cards. Commodity routes resolve by slug and reuse the same real observations for prices, changes, sparklines, and historical charts. No frontend module contains provider credentials or calls an external market API.

The site is stateless. Currency and chart-range selections are ephemeral UI preferences.
