import { useState } from "react";
import { formatNumber } from "../lib/processTikTokCSV";

const PAGE_SIZE = 20;

function ScoreBar({ score }) {
  const color = score >= 70 ? "#16a34a" : score >= 40 ? "#f97316" : "#d1d5db";
  return (
    <div className="flex items-center gap-2">
      <div className="score-bar-track flex-1" style={{ minWidth: 60 }}>
        <div className="score-bar-fill" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="font-mono text-xs text-ink-500 w-8 text-right">{score}</span>
    </div>
  );
}

export default function TikTokTable({ posts }) {
  const [sort, setSort]   = useState("score");
  const [page, setPage]   = useState(0);
  const [search, setSearch] = useState("");

  const filtered = posts
    .filter(p => !search || p.caption?.toLowerCase().includes(search.toLowerCase()) || p.ownerUsername?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "score")    return b.normalizedScore - a.normalizedScore;
      if (sort === "plays")    return b.plays    - a.plays;
      if (sort === "likes")    return b.likes    - a.likes;
      if (sort === "shares")   return b.shares   - a.shares;
      if (sort === "saves")    return b.saves    - a.saves;
      if (sort === "date")     return b.timestamp - a.timestamp;
      return 0;
    });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const visible    = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const SortBtn = ({ id, label }) => (
    <button
      onClick={() => { setSort(id); setPage(0); }}
      className={`text-xs px-2.5 py-1 rounded-lg font-500 transition-colors ${sort === id ? "bg-brand-500 text-white" : "text-ink-500 hover:bg-ink-100"}`}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <h3 className="font-display font-700 text-xs uppercase tracking-widest text-ink-400">
          All Posts · {filtered.length} results
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search caption…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="text-xs border border-ink-200 rounded-lg px-3 py-1.5 bg-white text-ink-700 placeholder:text-ink-300 focus:outline-none focus:border-brand-400 w-40"
          />
          <div className="flex gap-1 pl-2 border-l border-ink-200">
            <SortBtn id="score"  label="Score"  />
            <SortBtn id="plays"  label="Plays"  />
            <SortBtn id="likes"  label="Likes"  />
            <SortBtn id="shares" label="Shares" />
            <SortBtn id="saves"  label="Saves"  />
            <SortBtn id="date"   label="Date"   />
          </div>
        </div>
      </div>

      <div className="bg-white border border-ink-100 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50">
                {["Date","Account","Caption","Hashtags","Plays","Likes","Shares","Saves","Duration","Score"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-600 text-ink-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((p, i) => {
                const date = p.timestamp instanceof Date
                  ? p.timestamp.toLocaleDateString("en-GB", { day:"2-digit", month:"short" })
                  : "—";
                const caption = p.caption
                  ? (p.caption.length > 55 ? p.caption.slice(0, 55) + "…" : p.caption)
                  : "—";
                return (
                  <tr key={i} className="border-b border-ink-50 hover:bg-ink-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-ink-400 whitespace-nowrap">{date}</td>
                    <td className="px-4 py-3 text-xs text-ink-500 whitespace-nowrap">@{p.ownerUsername || "—"}</td>
                    <td className="px-4 py-3 text-xs text-ink-600 max-w-[200px]">
                      {p.url ? (
                        <a href={p.url} target="_blank" rel="noreferrer" className="hover:text-brand-500 transition-colors">{caption}</a>
                      ) : caption}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-ink-500 text-center">{p.hashtagCount}</td>
                    <td className="px-4 py-3 text-xs font-mono text-ink-700 whitespace-nowrap">{formatNumber(p.plays)}</td>
                    <td className="px-4 py-3 text-xs font-mono text-ink-700 whitespace-nowrap">{formatNumber(p.likes)}</td>
                    <td className="px-4 py-3 text-xs font-mono text-ink-700 whitespace-nowrap">{formatNumber(p.shares)}</td>
                    <td className="px-4 py-3 text-xs font-mono text-ink-700 whitespace-nowrap">{formatNumber(p.saves)}</td>
                    <td className="px-4 py-3 text-xs font-mono text-ink-500 whitespace-nowrap">{p.duration ? `${Math.round(p.duration)}s` : "—"}</td>
                    <td className="px-4 py-3 min-w-[120px]"><ScoreBar score={p.normalizedScore} /></td>
                  </tr>
                );
              })}
              {!visible.length && (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-sm text-ink-300">No posts match your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-ink-100">
            <span className="text-xs text-ink-400">Page {page + 1} of {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                className="text-xs px-3 py-1.5 rounded-lg border border-ink-200 text-ink-500 hover:bg-ink-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">← Prev</button>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                className="text-xs px-3 py-1.5 rounded-lg border border-ink-200 text-ink-500 hover:bg-ink-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
