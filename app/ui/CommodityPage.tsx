"use client";

import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { commodities, exchangeRates, type Currency } from "../lib/market";
import { MarketHeader } from "./MarketHeader";

const ranges = { "1M":1, "6M":6, "1Y":12, "5Y":60, "10Y":120, "MAX":999 } as const;

function Rankings({ title, rows }: { title:string; rows:{name:string;value:number}[] }) {
  return <section className="panel"><div className="panel-title">{title}</div>{rows.map((row,i)=><div className="bar-row" key={row.name}><div className="bar-label"><span>{i+1}. {row.name}</span><span>{row.value}</span></div><div className="bar-track"><div className="bar-fill" style={{width:`${row.value}%`}} /></div></div>)}</section>;
}

export function CommodityPage() {
  const { slug } = useParams();
  const item = commodities.find(c => c.slug === slug);
  const [currency,setCurrency] = useState<Currency>("USD");
  const [range,setRange] = useState<keyof typeof ranges>("5Y");
  const chartData = useMemo(() => item?.series.slice(-ranges[range]), [item,range]);
  if (!item) return <main className="shell" style={{padding:"80px 0"}}><h1>Market not found</h1><Link to="/">Return to dashboard</Link></main>;
  const value = item.price * exchangeRates[currency];
  const unit = item.unit.replace("USD",currency).replace("EUR",currency);
  return <>
    <MarketHeader currency={currency} onCurrency={setCurrency} />
    <main className="shell">
      <header className="detail-head"><Link className="back" to="/">← All markets</Link><div className="detail-title-row"><div className="detail-title"><div className="eyebrow">{item.category} · {item.volatility} volatility</div><h1>{item.name}</h1><p>{item.description}</p></div><div className="detail-price"><strong>{value >= 100 ? value.toLocaleString(undefined,{maximumFractionDigits:0}) : value.toFixed(2)}</strong><span>{unit} · {item.source} · 24 Jul 2026</span></div></div></header>
      <section className="panel chart-panel"><div className="panel-head"><div><div className="panel-title">Historical price</div><div className="source" style={{marginTop:6}}>{item.source} · OFFICIAL UNIT: {unit}</div></div><div className="ranges">{(Object.keys(ranges) as (keyof typeof ranges)[]).map(r=><button className={r===range?"active":""} onClick={()=>setRange(r)} key={r}>{r}</button>)}</div></div><div className="main-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{top:5,right:8,left:0,bottom:0}}><CartesianGrid stroke="#e2e1dc" vertical={false}/><XAxis dataKey="date" tick={{fontSize:9,fill:"#6b6f78"}} tickLine={false} axisLine={false} minTickGap={40}/><YAxis tick={{fontSize:9,fill:"#6b6f78"}} tickLine={false} axisLine={false} width={50}/><Tooltip contentStyle={{background:"#111318",border:0,borderRadius:6,color:"white",fontSize:11}}/><Line type="monotone" dataKey="value" stroke="#2354d8" strokeWidth={2} dot={false} isAnimationActive={false}/></LineChart></ResponsiveContainer></div></section>
      <div className="detail-grid"><Rankings title="Largest producers" rows={item.producers}/><Rankings title="Largest exporters" rows={item.exporters}/><Rankings title="Largest importers" rows={item.importers}/></div>
      <div className="news-sources"><section className="panel"><div className="panel-head"><div className="panel-title">Relevant news</div><div className="source">SUPPLY-SIDE FILTERED</div></div><div className="news-item"><h3>No qualifying supply-side headlines in the latest successful snapshot.</h3><div className="news-meta">GOOGLE NEWS RSS · FILTERED FOR PRODUCTION, TRADE, WEATHER AND LOGISTICS</div></div></section><section className="panel"><div className="panel-head"><div className="panel-title">Sources</div></div><a className="source-link" href={item.sourceUrl} target="_blank" rel="noreferrer">{item.source} ↗</a><a className="source-link" href="https://www.fao.org/faostat/" target="_blank" rel="noreferrer">FAOSTAT production data ↗</a><a className="source-link" href="https://comtradeplus.un.org/" target="_blank" rel="noreferrer">UN Comtrade flows ↗</a><a className="source-link" href="https://news.google.com/rss" target="_blank" rel="noreferrer">Google News RSS ↗</a><p style={{fontSize:10,color:"var(--muted)",lineHeight:1.6,marginTop:20}}>Values retain each publisher’s official unit. Country rankings use the latest complete annual dataset.</p></section></div>
    </main><footer className="footer shell"><span>Inputs Cards · {item.name}</span><span>Informational only · Not investment advice</span></footer>
  </>;
}
