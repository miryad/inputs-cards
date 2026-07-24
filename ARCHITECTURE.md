# Architecture

## Folder structure

- `app/` — routes, small UI components, market model, and global styles
- `config/` — one declarative JSON file per commodity
- `public/data/` — last successful versioned dataset consumed by the site
- `scripts/` — dependency-free data updater
- `.github/workflows/` — resilient data refresh and GitHub Pages deployment

## Configuration system

Commodity identity, category, description, official unit, relevance, volatility, datasets, and news source live in `config/<slug>.json`. Slugs are stable public identifiers. Presentation components operate on the shared `Commodity` type and contain no commodity-specific branches.

## Data pipeline

The weekday workflow checks out the repository and runs `scripts/update-data.mjs`. Each provider response must be successful, parseable, numeric, and contain enough observations. Successful series are merged with the previous snapshot. A failure is recorded but never replaces valid prior data. The assembled document is first written to a temporary file and then atomically renamed.

Git history is the audit trail and rollback mechanism. The frontend never calls market providers.

## Rendering flow

The dashboard loads the static catalog, groups it by category, applies display-only currency conversion, and renders cards. Commodity routes resolve by slug and reuse the same data for charts and metadata. Recharts handles lines and sparklines; ranking bars use semantic HTML and CSS. Official commodity units remain unchanged except the displayed currency prefix.

The site is stateless. Currency and chart-range selections are ephemeral UI preferences.
