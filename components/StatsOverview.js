import { formatNumber, hourLabel } from "../lib/processCSV";

const DAYS_FULL = { Sun:"Sunday", Mon:"Monday", Tue:"Tuesday", Wed:"Wednesday", Thu:"Thursday", Fri:"Friday", Sat:"Saturday" };

function KpiCard({ emoji, label, value, sub, accent }) {
  return (
    <div className="stat-card p-5">
      <div className="text-xl mb-3">{emoji}</div>
      <div className="text-xs text-ink-400 uppercase tracking-wider font-600 mb-1">{label}</div>
      <div className={`font-display font-700 text-2xl mb-0.5`} style={{ color: accent || "#1a1814" }}>
        {value}
      </div>
      {sub && <div className="text-xs text-ink-400">{sub}</div>}
    </div>
  );
}

export default function StatsOverview({ stats: s }) {
  const bestHourLabel = s.bestHour ? hourLabel(s.bestHour.hour) : "—";
  const bestDayLabel  = s.bestDay  ? DAYS_FULL[s.bestDay.day] || s.bestDay.day : "—";

  return (
    <div>
      <h3 className="font-display font-700 text-xs uppercase tracking-widest text-ink-400 mb-4">Overview</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <KpiCard emoji="📝" label="Total Posts"    value={s.totalPosts}               sub="in dataset" />
        <KpiCard emoji="❤️"  label="Total Likes"   value={formatNumber(s.totalLikes)}  sub={`avg ${formatNumber(s.avgLikes)}/post`} />
        <KpiCard emoji="👁️"  label="Total Views"   value={formatNumber(s.totalViews)}  sub={`avg ${formatNumber(s.avgViews)}/post`} />
        <KpiCard emoji="💬" label="Total Comments" value={formatNumber(s.totalComments)} sub="across all posts" />
      </div>

      <h3 className="font-display font-700 text-xs uppercase tracking-widest text-ink-400 mb-4 mt-8">Best Performing Patterns</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard emoji="🕐" label="Best Hour"     value={bestHourLabel}              sub={`score ${s.bestHour?.avgEngagement || "—"}`} accent="#ea580c" />
        <KpiCard emoji="📅" label="Best Day"      value={bestDayLabel}               sub={`score ${s.bestDay?.avgEngagement || "—"}`}  accent="#ea580c" />
        <KpiCard emoji="🎬" label="Best Type"     value={s.bestType?.type || "—"}    sub={`score ${s.bestType?.avgEngagement || "—"}`}  accent="#ea580c" />
        <KpiCard emoji="⏱️" label="Best Duration" value={s.bestDuration?.label || "—"} sub={s.bestDuration ? `score ${s.bestDuration.avgEngagement}` : "videos only"} accent="#ea580c" />
      </div>
    </div>
  );
}
