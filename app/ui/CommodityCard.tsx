"use client";

import { Link } from "react-router-dom";
import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";
import { convertPrice, convertedUnit, type Currency } from "../lib/market";
import type { Commodity } from "../lib/types";

const trendClass = (n:number | null) => n === null ? "flat" : n > .05 ? "up" : n < -.05 ? "down" : "flat";
const signed = (n:number | null) => n === null ? "—" : `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
const dateLabel = (value:string | null) => value ? new Intl.DateTimeFormat("en-GB",{day:"2-digit",month:"short",timeZone:"UTC"}).format(new Date(value)).toUpperCase() : "NO DATA";

export function CommodityCard({ item, currency }: { item: Commodity; currency: Currency }) {
  const converted = convertPrice(item.price, item.unit, currency, item.currencyPrice);
  const unit = convertedUnit(item.unit, currency, item.currencyPrice);
  return (
    <Link to={`/commodity/${item.slug}`} className="card" aria-label={`View ${item.name} details`}>
      <div className="card-top">
        <div><div className="name">{item.name}</div><div className="source">SOURCE: {item.source ?? "Data unavailable"}</div></div>
        <span className="badge">{item.volatility.toUpperCase()} VOL</span>
      </div>
      <div className="price-row">
        <div>{converted === null ? <span className="price" style={{fontSize:18}}>Data unavailable</span> : <><span className="price">{converted >= 100 ? converted.toLocaleString(undefined,{maximumFractionDigits:0}) : converted.toFixed(2)}</span><span className="unit">{unit}</span></>}</div>
        <div className="spark">
          {item.series.length > 1 && <ResponsiveContainer width="100%" height="100%">
            <LineChart data={item.series.slice(-18)}><YAxis domain={["dataMin","dataMax"]} hide /><Line type="monotone" dataKey="value" stroke={item.changes.month !== null && item.changes.month < 0 ? "#b43b32" : "#19734e"} strokeWidth={1.5} dot={false} isAnimationActive={false} /></LineChart>
          </ResponsiveContainer>}
        </div>
      </div>
      <div className="changes">
        {([["1W",item.changes.week],["1M",item.changes.month],["1Y",item.changes.year]] as const).map(([label,value]) => <div key={label}><div className="period">{label}</div><div className={`change ${trendClass(value)}`}>{signed(value)}</div></div>)}
      </div>
      <div className="card-foot"><span><span className="stars">{"★".repeat(item.stars)}</span> {item.relevance}</span><span>{dateLabel(item.updatedAt)}</span></div>
    </Link>
  );
}
