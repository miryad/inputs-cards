"use client";

import { Link } from "react-router-dom";
import type { Currency } from "../lib/market";

export function MarketHeader({ currency, onCurrency }: { currency: Currency; onCurrency: (c: Currency) => void }) {
  return (
    <header className="topbar shell">
      <Link className="brand" to="/"><span className="brand-mark" />Inputs Cards</Link>
      <div className="tagline">Industrial input markets, stripped to the signal.</div>
      <div className="refresh">LAST REFRESH<br />24 JUL 2026 · 06:00 UTC</div>
      <div className="currency" aria-label="Display currency">
        {(["USD","EUR","CNY","RUB"] as Currency[]).map(c => (
          <button key={c} className={currency === c ? "active" : ""} onClick={() => onCurrency(c)}>{c}</button>
        ))}
      </div>
    </header>
  );
}
