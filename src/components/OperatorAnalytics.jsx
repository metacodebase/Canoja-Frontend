import { BarChart3, Eye, Globe, MapPin, Phone, RefreshCw } from "lucide-react";
import { useState } from "react";
import OperatorLayout from "./OperatorLayout";
import { useBusinessAnalytics } from "../services/analytics";
import "./operatorAnalytics.css";

const CONFIG = {
  profile_view: { label: "Profile Views", color: "#818cf8", Icon: Eye },
  phone_tap: { label: "Phone Taps", color: "#34d399", Icon: Phone },
  directions_tap: { label: "Direction Requests", color: "#fbbf24", Icon: MapPin },
  website_tap: { label: "Website Taps", color: "#60a5fa", Icon: Globe },
  menu_view: { label: "Menu Views", color: "#f472b6", Icon: BarChart3 },
};

const MetricCard = ({ metric }) => {
  const config = CONFIG[metric.event_type] || CONFIG.profile_view;
  const change = Number(metric.change_pct || 0);
  return <article className="analytics-metric" style={{ "--metric": config.color }}><span className="analytics-metric__icon"><config.Icon size={17} /></span><small>{config.label}</small><strong>{metric.current || 0}</strong><span className={change < 0 ? "down" : "up"}>{change >= 0 ? "↗" : "↘"} {change >= 0 ? "+" : ""}{change}% <i>vs prev</i></span></article>;
};

const DailyTable = ({ rows }) => <section><h2>Daily Breakdown</h2><div className="analytics-table"><div className="analytics-table__head"><span>Date</span><span>Events</span><span>Total</span></div>{rows.length ? [...rows].reverse().map((row) => { const events = Object.entries(CONFIG).filter(([key]) => row[key] > 0); const total = events.reduce((sum, [key]) => sum + row[key], 0); return <div className="analytics-table__row" key={row.date}><span>{new Date(`${row.date}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span><span className="analytics-pills">{events.map(([key, config]) => <i key={key} style={{ "--metric": config.color }}>● {row[key]}</i>)}</span><strong>{total || "—"}</strong></div>; }) : <p className="analytics-empty">No activity for this period.</p>}</div></section>;

const AnalyticsContent = ({ analytics }) => <><section><h2>Overview</h2><div className="analytics-grid">{analytics?.metrics?.map((metric) => <MetricCard key={metric.event_type} metric={metric} />)}</div></section><div className="analytics-legend">{Object.entries(CONFIG).map(([key, config]) => <span key={key} style={{ "--metric": config.color }}>● {config.label}</span>)}</div><DailyTable rows={analytics?.daily || []} /></>;

const OperatorAnalytics = () => {
  const [period, setPeriod] = useState(30);
  const { data, isLoading, isError, refetch, isFetching } = useBusinessAnalytics(period);
  return <OperatorLayout><div className="operator-analytics"><header><div><h1>Analytics</h1><p>{data?.data?.business_name || "Business performance"}</p></div><button type="button" onClick={() => refetch()} aria-label="Refresh analytics"><RefreshCw size={19} className={isFetching ? "spinning" : ""} /></button></header><nav className="analytics-period">{[7, 30, 90].map((days) => <button type="button" className={period === days ? "active" : ""} onClick={() => setPeriod(days)} key={days}>{days} Days</button>)}</nav>{isLoading ? <div className="analytics-status">Loading analytics…</div> : isError ? <div className="analytics-status">Failed to load analytics. <button type="button" onClick={() => refetch()}>Retry</button></div> : <AnalyticsContent analytics={data?.data} />}</div></OperatorLayout>;
};

export default OperatorAnalytics;
