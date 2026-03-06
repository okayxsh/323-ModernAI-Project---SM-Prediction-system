import { hourLabel } from "../lib/processCSV";

function BarChart({ data, xKey, yKey, label, formatX }) {
  if (!data?.length) return (
    <div style={{ fontSize: "0.78rem", color: "var(--text-5)", padding: "24px 0", textAlign: "center" }}>No data</div>
  );
  const max = Math.max(...data.map(d => d[yKey]), 1);
  return (
    <div>
      <p className="eyebrow" style={{ marginBottom: 16 }}>{label}</p>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 110 }}>
        {data.map((d, i) => {
          const pct = (d[yKey] / max) * 100;
          return (
            <div key={i}
              title={`${formatX ? formatX(d[xKey]) : d[xKey]}: ${d[yKey]}`}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, height: "100%", justifyContent: "flex-end" }}
            >
              <div style={{
                width: "100%",
                height: `${Math.max(pct, 3)}%`,
                borderRadius: "4px 4px 2px 2px",
                background: pct > 80 ? "var(--indigo)" : pct > 45 ? "rgba(99,102,241,0.38)" : "rgba(0,0,0,0.07)",
                transition: "height .8s cubic-bezier(0.4,0,0.2,1)",
              }} />
              <span style={{ fontSize: "0.6rem", color: "var(--text-5)", whiteSpace: "nowrap", overflow: "hidden", width: "100%", textAlign: "center", fontFamily: "'Geist Mono',monospace" }}>
                {formatX ? formatX(d[xKey]) : d[xKey]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HorizBar({ items, valueKey, labelKey }) {
  if (!items?.length) return null;
  const max = Math.max(...items.map(i => i[valueKey]), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 100, fontSize: "0.72rem", color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexShrink: 0, fontFamily: "'Geist Mono',monospace" }}>
            #{item[labelKey]}
          </div>
          <div className="bar-track" style={{ flex: 1 }}>
            <div className="bar-fill" style={{
              width: `${(item[valueKey] / max) * 100}%`,
              background: i === 0 ? "var(--indigo)" : i < 3 ? "rgba(99,102,241,0.42)" : "rgba(0,0,0,0.09)",
            }} />
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-4)", fontFamily: "'Geist Mono',monospace", width: 52, textAlign: "right", flexShrink: 0 }}>
            {item[valueKey].toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}

function ChartCard({ children }) {
  return (
    <div className="card" style={{ padding: "22px 24px" }}>
      {children}
    </div>
  );
}

export default function ChartsSection({ stats: s }) {
  if (!s) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <p className="eyebrow" style={{ marginBottom: 4 }}>Engagement patterns</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <ChartCard>
          <BarChart data={s.byHour} xKey="hour" yKey="avgEngagement" label="By hour of day" formatX={h => hourLabel(h)} />
        </ChartCard>
        <ChartCard>
          <BarChart data={s.byDay} xKey="day" yKey="avgEngagement" label="By day of week" />
        </ChartCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {s.durationBuckets?.length > 0 && (
          <ChartCard>
            <BarChart data={s.durationBuckets} xKey="label" yKey="avgEngagement" label="By video duration" />
          </ChartCard>
        )}
        {s.hashtagBuckets?.length > 0 && (
          <ChartCard>
            <BarChart data={s.hashtagBuckets} xKey="label" yKey="avgEngagement" label="By hashtag count" />
          </ChartCard>
        )}
      </div>

      {s.byType?.length > 1 && (
        <ChartCard>
          <p className="eyebrow" style={{ marginBottom: 18 }}>Content type breakdown</p>
          <div style={{ display: "flex", gap: "2.5rem", flexWrap: "wrap" }}>
            {s.byType.map((t, i) => (
              <div key={i}>
                <div style={{ fontWeight: 700, fontSize: "1.6rem", letterSpacing: "-0.035em", color: i === 0 ? "var(--indigo)" : "var(--text-5)", fontVariantNumeric: "tabular-nums" }}>
                  {t.avgEngagement.toLocaleString()}
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-3)", marginTop: 3, fontWeight: 500 }}>{t.type}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-5)", marginTop: 1 }}>{t.count} posts</div>
              </div>
            ))}
          </div>
        </ChartCard>
      )}

      {s.topHashtags?.length > 0 && (
        <ChartCard>
          <p className="eyebrow" style={{ marginBottom: 18 }}>Top hashtags by avg engagement</p>
          <HorizBar items={s.topHashtags} valueKey="avgEngagement" labelKey="tag" />
        </ChartCard>
      )}
    </div>
  );
}
