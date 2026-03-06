import { hourLabel } from "../lib/processCSV";

function BarChart({ data, xKey, yKey, label, color = "#f97316", formatX }) {
  if (!data?.length) return <div className="text-xs text-ink-300 py-6 text-center">No data</div>;
  const max = Math.max(...data.map(d => d[yKey]), 1);
  return (
    <div>
      <p className="text-xs font-600 text-ink-500 uppercase tracking-wider mb-4">{label}</p>
      <div className="flex items-end gap-1.5 h-36">
        {data.map((d, i) => {
          const pct = (d[yKey] / max) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group" title={`${formatX ? formatX(d[xKey]) : d[xKey]}: ${d[yKey]}`}>
              <div className="w-full relative flex items-end justify-center" style={{ height: "112px" }}>
                <div
                  className="w-full rounded-t-md transition-all duration-700"
                  style={{
                    height: `${Math.max(pct, 2)}%`,
                    background: pct > 75 ? color : pct > 40 ? "#fdba74" : "#fed7aa",
                    opacity: d.count === 0 ? 0.2 : 1,
                  }}
                />
              </div>
              <span className="text-[9px] text-ink-400 truncate w-full text-center leading-tight">
                {formatX ? formatX(d[xKey]) : d[xKey]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HorizontalBar({ items, valueKey, labelKey, color = "#f97316" }) {
  if (!items?.length) return <div className="text-xs text-ink-300 py-4 text-center">No data</div>;
  const max = Math.max(...items.map(i => i[valueKey]), 1);
  return (
    <div className="space-y-2.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="text-xs text-ink-500 w-24 shrink-0 truncate font-500">#{item[labelKey]}</div>
          <div className="flex-1 score-bar-track">
            <div
              className="score-bar-fill"
              style={{ width: `${(item[valueKey] / max) * 100}%`, background: i === 0 ? color : i < 3 ? "#fdba74" : "#fed7aa" }}
            />
          </div>
          <div className="text-xs font-mono text-ink-400 w-12 text-right shrink-0">{item[valueKey].toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}

function SectionTitle({ children }) {
  return <h3 className="font-display font-700 text-xs uppercase tracking-widest text-ink-400 mb-6">{children}</h3>;
}

function Card({ children, className = "" }) {
  return <div className={`stat-card p-6 ${className}`}>{children}</div>;
}

export default function ChartsSection({ stats: s }) {
  return (
    <div className="space-y-6">
      <SectionTitle>Engagement Patterns</SectionTitle>

      {/* Hour + Day charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card>
          <BarChart
            data={s.byHour}
            xKey="hour"
            yKey="avgEngagement"
            label="Avg engagement by hour"
            formatX={h => hourLabel(h)}
          />
        </Card>
        <Card>
          <BarChart
            data={s.byDay}
            xKey="day"
            yKey="avgEngagement"
            label="Avg engagement by day of week"
          />
        </Card>
      </div>

      {/* Duration + Hashtag buckets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {s.durationBuckets?.length > 0 && (
          <Card>
            <BarChart
              data={s.durationBuckets}
              xKey="label"
              yKey="avgEngagement"
              label="Avg engagement by video duration"
            />
          </Card>
        )}
        {s.hashtagBuckets?.length > 0 && (
          <Card>
            <BarChart
              data={s.hashtagBuckets}
              xKey="label"
              yKey="avgEngagement"
              label="Avg engagement by hashtag count"
            />
          </Card>
        )}
      </div>

      {/* Content type comparison */}
      {s.byType?.length > 1 && (
        <Card>
          <p className="text-xs font-600 text-ink-500 uppercase tracking-wider mb-5">Content type comparison</p>
          <div className="flex gap-6 flex-wrap">
            {s.byType.map((t, i) => (
              <div key={i} className="flex-1 min-w-[120px]">
                <div className="text-2xl font-display font-700" style={{ color: i === 0 ? "#f97316" : "#bfbab0" }}>
                  {t.avgEngagement.toLocaleString()}
                </div>
                <div className="text-xs text-ink-500 mt-1 font-500">{t.type}</div>
                <div className="text-xs text-ink-300">{t.count} posts</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Top hashtags */}
      {s.topHashtags?.length > 0 && (
        <Card>
          <p className="text-xs font-600 text-ink-500 uppercase tracking-wider mb-5">Top hashtags by avg engagement</p>
          <HorizontalBar
            items={s.topHashtags}
            valueKey="avgEngagement"
            labelKey="tag"
          />
        </Card>
      )}
    </div>
  );
}
