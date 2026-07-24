"use client";

import { useState } from "react";
import { categories, commodities, type Currency } from "../lib/market";
import { CommodityCard } from "./CommodityCard";
import { MarketHeader } from "./MarketHeader";

export function Dashboard() {
  const [currency,setCurrency] = useState<Currency>("USD");
  const moved = commodities.filter(c => Math.abs(c.changes.week) >= 1).length;
  return (
    <>
      <MarketHeader currency={currency} onCurrency={setCurrency} />
      <main className="shell">
        <section className="hero">
          <div><div className="eyebrow">Daily market brief · 24 July</div><h1>What changed since yesterday?</h1><p>Seventeen industrial input markets. Official units, transparent sources, and just enough context to see where costs are moving.</p></div>
          <div className="pulse"><div className="eyebrow">Market pulse</div><div className="pulse-value">{moved} <span style={{fontSize:14,color:"var(--muted)"}}>/ 17</span></div><div className="pulse-copy">markets moved materially this week</div></div>
        </section>
        {categories.map(category => {
          const items = commodities.filter(c => c.category === category);
          return <section className="category" key={category}><div className="category-head"><h2 className="category-title">{category}</h2><span className="category-count">{String(items.length).padStart(2,"0")} MARKETS</span></div><div className="grid">{items.map(item => <CommodityCard key={item.slug} item={item} currency={currency} />)}</div></section>
        })}
      </main>
      <footer className="footer shell"><span>Inputs Cards · Open source market intelligence</span><span>Informational only · Third-party public data</span></footer>
    </>
  );
}
