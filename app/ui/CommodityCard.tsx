"use client";

import { Link } from "react-router-dom";
import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";
import { exchangeRates, type Currency } from "../lib/market";
import type { Commodity } from "../lib/types";

const trendClass = (n:number) => n > .05 ? "up" : n < -.05 ? "down" : "flat";
const signed = (n:number) => `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;

export function CommodityCard({ item, currency }: { item: Commodity; currency: Currency }) {
  const converted = item.price * exchangeRates[currency];
  const unit = item.unit.replace("USD", currency).replace("EUR", currency);
  return (
    <Link to={`/commodity/${item.slug}`} className="card" aria-label={`View ${item.name} details`}>
      <div className="card-top">
        <div><div className="name">{item.name}</div><div className="source">{item.source}</div></div>
        <span className="badge">{item.volatility.toUpperCase()} VOL</span>
      </div>
      <div className="price-row">
        <div><span className="price">{converted >= 100 ? converted.toLocaleString(undefined,{maximumFractionDigits:0}) : converted.toFixed(2)}</span><span className="unit">{unit}</span></div>
        <div className="spark">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={item.series.slice(-18)}><YAxis domain={["dataMin","dataMax"]} hide /><Line type="monotone" dataKey="value" stroke={item.changes.month < 0 ? "#b43b32" : "#19734e"} strokeWidth={1.5} dot={false} isAnimationActive={false} /></LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="changes">
        {([["1W",item.changes.week],["1M",item.changes.month],["1Y",item.changes.year]] as const).map(([label,value]) => <div key={label}><div className="period">{label}</div><div className={`change ${trendClass(value)}`}>{signed(value)}</div></div>)}
      </div>
      <div className="card-foot"><span><span className="stars">{"★".repeat(item.stars)}</span> {item.relevance}</span><span>24 JUL</span></div>
    </Link>
  );
}
