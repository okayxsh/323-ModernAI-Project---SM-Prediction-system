import { formatNumber, hourLabel } from "../lib/processCSV";

const DAYS_FULL = { Sun:"Sunday", Mon:"Monday", Tue:"Tuesday", Wed:"Wednesday", Thu:"Thursday", Fri:"Friday", Sat:"Saturday" };

function KpiCard({ icon, label, value, sub, highlight }) {
  return (
    <div className="card" style={{ padding: "18px 20px" }}>
      <div style={{ fontSize: "1.1rem", marginBottom: 10 }}>{icon}</div>
      <div className="eyebrow" style={{ marginBottom: 5 }}>{label}</div>
      <div style={{
        fontWeight: 700, fontSize: "1.35rem", letterSpacing: "-0.025em",
        fontVariantNumeric: "tabular-nums",
        color: highlight ? "var(--indigo)" : "var(--text-1)",
      }}>{value}</div>
      {sub && <div style={{ fontSize: "0.72rem", color: "var(--text-4)", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

export default function StatsOverview({ stats: s }) {
  if (!s) return null;
  const bestHourLabel = s.bestHour ? hourLabel(s.bestHour.hour) : "—";
  const bestDayLabel  = s.bestDay  ? DAYS_FULL[s.bestDay.day] || s.bestDay.day : "—";
  return (
    <div>
      <p className="eyebrow" style={{ marginBottom: 14 }}>Overview</p>
      <div className="kpi-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 12 }}>
        <KpiCard icon="📝" label="Total posts"    value={s.totalPosts}                sub="in dataset" />
        <KpiCard icon="❤️" label="Total likes"    value={formatNumber(s.totalLikes)}  sub={`avg ${formatNumber(s.avgLikes)}/post`} />
        <KpiCard icon="👁️" label="Total views"    value={formatNumber(s.totalViews)}  sub={`avg ${formatNumber(s.avgViews)}/post`} />
        <KpiCard icon="💬" label="Comments"       value={formatNumber(s.totalComments)} sub="total" />
      </div>
      <p className="eyebrow" style={{ margin: "20px 0 14px" }}>Best patterns</p>
      <div className="kpi-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        <KpiCard icon="🕐" label="Best hour"     value={bestHourLabel}              sub={`score ${s.bestHour?.avgEngagement || "—"}`} highlight />
        <KpiCard icon="📅" label="Best day"      value={bestDayLabel}               sub={`score ${s.bestDay?.avgEngagement || "—"}`}  highlight />
        <KpiCard icon="🎬" label="Best type"     value={s.bestType?.type || "—"}    sub={`score ${s.bestType?.avgEngagement || "—"}`}  highlight />
        <KpiCard icon="⏱️" label="Best duration" value={s.bestDuration?.label || "—"} sub={s.bestDuration ? `score ${s.bestDuration.avgEngagement}` : "videos only"} highlight />
      </div>
    </div>
  );
}
