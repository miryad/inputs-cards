"use client";

import { Link } from "react-router-dom";
import type { Currency } from "../lib/market";

function refreshLabel(updatedAt: string | null | undefined) {
  if (!updatedAt) return "NO SUCCESSFUL DATA";
  return new Intl.DateTimeFormat("en-GB", { day:"2-digit", month:"short", year:"numeric", timeZone:"UTC" })
    .format(new Date(updatedAt))
    .toUpperCase();
}

export function MarketHeader({ currency, onCurrency, updatedAt }: { currency: Currency; onCurrency: (c: Currency) => void; updatedAt?: string | null }) {
  return (
    <header className="topbar shell">
      <Link className="brand" to="/"><span className="brand-mark" />Inputs Cards</Link>
      <div className="tagline">Industrial input markets, stripped to the signal.</div>
      <div className="refresh">LATEST OBSERVATION<br />{refreshLabel(updatedAt)}</div>
      <div className="currency" aria-label="Display currency">
        {(["USD","EUR","CNY","RUB"] as Currency[]).map(c => (
          <button key={c} className={currency === c ? "active" : ""} onClick={() => onCurrency(c)}>{c}</button>
        ))}
      </div>
    </header>
  );
}
