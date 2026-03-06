import { useState } from "react";
import { formatNumber } from "../lib/processCSV";

const PAGE = 20;

function ScoreBar({ score }) {
  const color = score >= 70 ? "var(--indigo)" : score >= 40 ? "rgba(99,102,241,0.45)" : "rgba(0,0,0,0.1)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 100 }}>
      <div className="bar-track" style={{ flex: 1 }}>
        <div className="bar-fill" style={{ width: `${score}%`, background: color }} />
      </div>
      <span style={{ fontSize: "0.7rem", color: "var(--text-4)", fontFamily: "'Geist Mono',monospace", width: 24, textAlign: "right", flexShrink: 0 }}>{score}</span>
    </div>
  );
}

function TypeBadge({ type }) {
  const cls = type === "Video" ? "badge-blue" : type === "Carousel" ? "badge-orange" : "badge-neutral";
  return <span className={`badge ${cls}`}>{type}</span>;
}

const SORTS = ["score","likes","views","date"];

export default function PostsTable({ posts }) {
  const [filter, setFilter] = useState("All");
  const [sort,   setSort]   = useState("score");
  const [page,   setPage]   = useState(0);
  const [search, setSearch] = useState("");

  const types = ["All", ...new Set((posts || []).map(p => p.type))];

  const filtered = (posts || [])
    .filter(p => filter === "All" || p.type === filter)
    .filter(p => !search || p.caption?.toLowerCase().includes(search.toLowerCase()) || p.ownerUsername?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) =>
      sort === "score" ? b.normalizedScore - a.normalizedScore :
      sort === "likes" ? b.likes - a.likes :
      sort === "views" ? b.views - a.views :
      b.timestamp - a.timestamp
    );

  const totalPages = Math.ceil(filtered.length / PAGE);
  const rows = filtered.slice(page * PAGE, (page + 1) * PAGE);

  return (
    <div>
      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
        <p className="eyebrow">{filtered.length} posts</p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <input
            value={search} placeholder="Search…"
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            style={{
              fontSize: "0.78rem", padding: "6px 12px", borderRadius: 8,
              border: "1px solid var(--border)",
              background: "rgba(255,255,255,0.75)",
              backdropFilter: "blur(8px)",
              color: "var(--text-2)", outline: "none", width: 140,
              fontFamily: "'Geist',sans-serif",
            }}
          />
          {/* Type filter */}
          <div style={{ display: "flex", gap: 4 }}>
            {types.map(t => (
              <button key={t} onClick={() => { setFilter(t); setPage(0); }}
                style={{
                  fontSize: "0.72rem", padding: "5px 11px", borderRadius: 7, cursor: "pointer",
                  fontFamily: "'Geist',sans-serif", fontWeight: 600, border: "1px solid",
                  borderColor: filter === t ? "var(--text-1)" : "var(--border)",
                  background: filter === t ? "var(--text-1)" : "rgba(255,255,255,0.6)",
                  backdropFilter: "blur(6px)",
                  color: filter === t ? "#fff" : "var(--text-4)",
                  transition: "all .15s",
                }}>
                {t}
              </button>
            ))}
          </div>
          {/* Sort */}
          <div style={{ display: "flex", gap: 4, paddingLeft: 8, borderLeft: "1px solid var(--border)" }}>
            {SORTS.map(s => (
              <button key={s} onClick={() => { setSort(s); setPage(0); }}
                style={{
                  fontSize: "0.72rem", padding: "5px 11px", borderRadius: 7, cursor: "pointer",
                  fontFamily: "'Geist',sans-serif", fontWeight: 600, border: "1px solid",
                  borderColor: sort === s ? "var(--indigo)" : "var(--border)",
                  background: sort === s ? "var(--indigo-soft)" : "rgba(255,255,255,0.6)",
                  backdropFilter: "blur(6px)",
                  color: sort === s ? "var(--indigo)" : "var(--text-4)",
                  transition: "all .15s",
                }}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "rgba(255,255,255,0.72)", backdropFilter: "blur(22px) saturate(180%)", WebkitBackdropFilter: "blur(22px) saturate(180%)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                {["Date","Account","Type","Caption","Tags","Likes","Views","Dur.","Score"].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((p, i) => {
                const date = p.timestamp instanceof Date
                  ? p.timestamp.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
                  : "—";
                const cap = p.caption ? (p.caption.length > 55 ? p.caption.slice(0, 55) + "…" : p.caption) : "—";
                return (
                  <tr key={i}>
                    <td><span style={{ fontFamily: "'Geist Mono',monospace", fontSize: "0.72rem", color: "var(--text-4)" }}>{date}</span></td>
                    <td><span style={{ fontSize: "0.78rem", color: "var(--text-3)" }}>@{p.ownerUsername || "—"}</span></td>
                    <td><TypeBadge type={p.type} /></td>
                    <td style={{ maxWidth: 200 }}>
                      {p.url
                        ? <a href={p.url} target="_blank" rel="noreferrer" style={{ fontSize: "0.78rem", color: "var(--text-2)", textDecoration: "none" }} onMouseEnter={e => e.target.style.color="var(--indigo)"} onMouseLeave={e => e.target.style.color="var(--text-2)"}>{cap}</a>
                        : <span style={{ fontSize: "0.78rem", color: "var(--text-3)" }}>{cap}</span>}
                    </td>
                    <td><span style={{ fontFamily: "'Geist Mono',monospace", fontSize: "0.72rem", color: "var(--text-4)" }}>{p.hashtagCount}</span></td>
                    <td><span style={{ fontFamily: "'Geist Mono',monospace", fontSize: "0.78rem", color: "var(--text-2)" }}>{formatNumber(p.likes)}</span></td>
                    <td><span style={{ fontFamily: "'Geist Mono',monospace", fontSize: "0.78rem", color: "var(--text-2)" }}>{p.views ? formatNumber(p.views) : "—"}</span></td>
                    <td><span style={{ fontFamily: "'Geist Mono',monospace", fontSize: "0.72rem", color: "var(--text-4)" }}>{p.duration ? `${Math.round(p.duration)}s` : "—"}</span></td>
                    <td><ScoreBar score={p.normalizedScore} /></td>
                  </tr>
                );
              })}
              {!rows.length && (
                <tr><td colSpan={9} style={{ textAlign: "center", padding: "40px 0", color: "var(--text-5)", fontSize: "0.825rem" }}>No results</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderTop: "1px solid var(--border)", background: "rgba(255,255,255,0.5)" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-4)" }}>Page {page + 1} of {totalPages}</span>
            <div style={{ display: "flex", gap: 6 }}>
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                style={{ fontSize: "0.75rem", padding: "5px 12px", borderRadius: 7, border: "1px solid var(--border)", background: "rgba(255,255,255,0.7)", color: "var(--text-3)", cursor: page === 0 ? "not-allowed" : "pointer", opacity: page === 0 ? 0.35 : 1, fontFamily: "'Geist',sans-serif" }}>
                ← Prev
              </button>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                style={{ fontSize: "0.75rem", padding: "5px 12px", borderRadius: 7, border: "1px solid var(--border)", background: "rgba(255,255,255,0.7)", color: "var(--text-3)", cursor: page >= totalPages - 1 ? "not-allowed" : "pointer", opacity: page >= totalPages - 1 ? 0.35 : 1, fontFamily: "'Geist',sans-serif" }}>
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
