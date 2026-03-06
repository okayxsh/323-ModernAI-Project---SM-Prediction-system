import Head from "next/head";
import { useState, useRef, useCallback } from "react";
import Papa from "papaparse";
import { processTikTokCSV, formatNumber, hourLabel } from "../lib/processTikTokCSV";
import StatsOverview from "../components/StatsOverview";
import ChartsSection from "../components/ChartsSection";
import AIReport      from "../components/AIReport";
import TikTokTable   from "../components/TikTokTable";

export default function TikTokDashboard() {
  const [stage, setStage]         = useState("upload");
  const [dragging, setDragging]   = useState(false);
  const [fileName, setFileName]   = useState("");
  const [data, setData]           = useState(null);
  const [error, setError]         = useState("");
  const [aiReport, setAiReport]   = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const fileRef = useRef();

  const handleFile = useCallback((file) => {
    if (!file) return;
    if (!file.name.endsWith(".csv")) { setError("Please upload a .csv file."); return; }
    setError("");
    setFileName(file.name);
    setStage("processing");
    setAiReport("");

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          // Basic check — TikTok CSVs have playCount, Instagram has likesCount at top-level
          const cols = Object.keys(results.data[0] || {});
          if (!cols.includes("playCount") && !cols.includes("diggCount")) {
            throw new Error("This doesn't look like a TikTok CSV. Try the Instagram page instead.");
          }
          const processed = processTikTokCSV(results.data);
          if (!processed.posts.length) throw new Error("No valid posts found in CSV.");
          setData(processed);
          setStage("ready");
        } catch (e) {
          setError(e.message);
          setStage("upload");
        }
      },
      error: (e) => { setError(e.message); setStage("upload"); },
    });
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const onDragOver  = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const runAI = async () => {
    if (!data?.stats) return;
    setAiLoading(true);
    setAiReport("");
    try {
      const res = await fetch("/api/analyzeTikTok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stats: data.stats }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "AI analysis failed");
      setAiReport(json.analysis);
    } catch (e) {
      setAiReport(`**Error:** ${e.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const reset = () => {
    setStage("upload"); setData(null);
    setFileName(""); setAiReport(""); setError("");
  };

  // Build a TikTok-flavoured stats object that StatsOverview can render
  // (StatsOverview expects: totalLikes, totalViews, totalComments, avgLikes, avgViews,
  //  bestHour, bestDay, bestType, bestDuration)
  const tikTokStats = data?.stats ? {
    ...data.stats,
    // map TikTok fields → generic field names StatsOverview uses
    totalViews:  data.stats.totalPlays,
    totalLikes:  data.stats.totalLikes,
    avgViews:    data.stats.avgPlays,
  } : null;

  return (
    <>
      <Head>
        <title>Pulse · TikTok Analytics</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-ink-100">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-base"
                 style={{ background: "#010101" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M10.5 1C10.5 1 10.7 3.5 13 4V6C13 6 11.2 5.9 10 5V9.5C10 11.4 8.4 13 6.5 13C4.6 13 3 11.4 3 9.5C3 7.6 4.6 6 6.5 6C6.8 6 7.1 6.04 7.4 6.1V8.2C7.1 8.07 6.8 8 6.5 8C5.7 8 5 8.7 5 9.5C5 10.3 5.7 11 6.5 11C7.3 11 8 10.3 8 9.5V1H10.5Z" fill="white"/>
              </svg>
            </div>
            <span className="font-display font-700 text-ink-900 text-base tracking-tight">
              Pulse <span className="text-ink-400 font-400">· TikTok</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Link to Instagram page */}
            <a href="/" className="text-xs font-500 text-ink-400 hover:text-ink-700 transition-colors flex items-center gap-1">
              <span>📸</span> Instagram
            </a>

            {stage === "ready" && (
              <>
                <span className="text-xs text-ink-400 hidden sm:block truncate max-w-[180px]">{fileName}</span>
                <button onClick={reset} className="text-xs font-600 text-ink-500 hover:text-ink-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-ink-100">
                  ↑ New Upload
                </button>
              </>
            )}
            <div className="flex items-center gap-1.5 text-xs text-ink-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-dot inline-block"/>
              Internal only
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10 min-h-screen">

        {/* ── Upload ─────────────────────────────────────────── */}
        {stage === "upload" && (
          <div className="animate-fade-up opacity-0" style={{ animationDelay: "0.05s", animationFillMode: "forwards" }}>
            <div className="max-w-xl mx-auto text-center pt-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-600 mb-6"
                   style={{ background: "#010101", color: "#fff" }}>
                🎵 TikTok Analytics
              </div>
              <h1 className="font-display font-700 text-3xl md:text-4xl text-ink-900 mb-3 leading-tight">
                Upload your TikTok<br />data export
              </h1>
              <p className="text-ink-500 text-sm mb-10 leading-relaxed">
                Drop a TikTok scraper CSV — we'll analyse plays, likes, shares, saves and comments to surface exactly what's working and when to post.
              </p>

              <div
                className={`drop-zone rounded-2xl p-10 cursor-pointer mb-4 ${dragging ? "dragging" : ""}`}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => fileRef.current?.click()}
              >
                <div className="text-4xl mb-4">🎬</div>
                <p className="font-600 text-ink-700 mb-1">Drop your TikTok CSV here</p>
                <p className="text-sm text-ink-400">or click to browse</p>
                <input ref={fileRef} type="file" accept=".csv" className="hidden"
                       onChange={e => handleFile(e.target.files[0])} />
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mt-3">
                  ⚠️ {error}
                </div>
              )}

              <p className="text-xs text-ink-300 mt-6">
                Compatible with Apify, Phantombuster and similar TikTok scrapers.<br />
                All processing happens locally — no data is stored.
              </p>

              <div className="mt-8 pt-6 border-t border-ink-100">
                <p className="text-xs text-ink-400 mb-2">Also available</p>
                <a href="/" className="inline-flex items-center gap-2 text-xs font-500 text-ink-600 hover:text-brand-500 transition-colors">
                  📸 Instagram Analytics →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ── Processing ─────────────────────────────────────── */}
        {stage === "processing" && (
          <div className="flex flex-col items-center justify-center pt-32 gap-4">
            <div className="flex gap-2">
              {[0,1,2].map(i => (
                <div key={i} className="w-2.5 h-2.5 rounded-full bg-brand-400 animate-pulse-dot"
                     style={{ animationDelay: `${i * 0.3}s` }} />
              ))}
            </div>
            <p className="text-ink-500 text-sm">Parsing TikTok CSV &amp; computing engagement metrics…</p>
          </div>
        )}

        {/* ── Ready ──────────────────────────────────────────── */}
        {stage === "ready" && tikTokStats && (
          <div className="space-y-10 animate-fade-in opacity-0" style={{ animationFillMode: "forwards" }}>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="text-xs text-ink-400 uppercase tracking-widest font-600 mb-1">
                  {data.stats.accounts.slice(0,3).map(a => `@${a}`).join(" · ")}
                </p>
                <h2 className="font-display font-700 text-2xl md:text-3xl text-ink-900">
                  TikTok Performance Analysis
                </h2>
                <p className="text-sm text-ink-500 mt-1">
                  {data.stats.totalPosts} posts analysed
                </p>
              </div>
              <button
                onClick={runAI}
                disabled={aiLoading}
                className="btn-primary flex items-center gap-2 self-start sm:self-auto"
              >
                {aiLoading ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block"/>
                    Analysing with AI…
                  </>
                ) : "✦ Generate AI Strategy Report"}
              </button>
            </div>

            {/* TikTok-specific KPI override */}
            <TikTokKPIs stats={data.stats} />

            {/* AI Report */}
            {(aiReport || aiLoading) && (
              <AIReport report={aiReport} loading={aiLoading} />
            )}

            {/* Charts — reuse Instagram charts, they're data-agnostic */}
            <ChartsSection stats={tikTokStats} />

            {/* Audio breakdown */}
            {data.stats.byAudio?.length > 1 && (
              <AudioBreakdown byAudio={data.stats.byAudio} best={data.stats.bestAudio} />
            )}

            {/* Posts table */}
            <TikTokTable posts={data.stats.postsWithScore} />

          </div>
        )}
      </main>
    </>
  );
}

// ── TikTok-specific KPI cards ──────────────────────────────────────────────
function KpiCard({ emoji, label, value, sub, accent }) {
  return (
    <div className="stat-card p-5">
      <div className="text-xl mb-3">{emoji}</div>
      <div className="text-xs text-ink-400 uppercase tracking-wider font-600 mb-1">{label}</div>
      <div className="font-display font-700 text-2xl mb-0.5" style={{ color: accent || "#1a1814" }}>{value}</div>
      {sub && <div className="text-xs text-ink-400">{sub}</div>}
    </div>
  );
}

function TikTokKPIs({ stats: s }) {
  const bestHourLabel = s.bestHour ? hourLabel(s.bestHour.hour) : "—";
  const DAYS_FULL = { Sun:"Sunday", Mon:"Monday", Tue:"Tuesday", Wed:"Wednesday", Thu:"Thursday", Fri:"Friday", Sat:"Saturday" };
  const bestDayLabel  = s.bestDay  ? (DAYS_FULL[s.bestDay.day] || s.bestDay.day) : "—";

  return (
    <div>
      <h3 className="font-display font-700 text-xs uppercase tracking-widest text-ink-400 mb-4">Overview</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
        <KpiCard emoji="▶️"  label="Total Plays"    value={formatNumber(s.totalPlays)}    sub={`avg ${formatNumber(s.avgPlays)}/post`} />
        <KpiCard emoji="❤️"  label="Total Likes"    value={formatNumber(s.totalLikes)}    sub={`avg ${formatNumber(s.avgLikes)}/post`} />
        <KpiCard emoji="🔁"  label="Total Shares"   value={formatNumber(s.totalShares)}   sub="across all posts" />
        <KpiCard emoji="💬"  label="Total Comments" value={formatNumber(s.totalComments)} sub="across all posts" />
        <KpiCard emoji="🔖"  label="Total Saves"    value={formatNumber(s.totalSaves)}    sub="across all posts" />
      </div>

      <h3 className="font-display font-700 text-xs uppercase tracking-widest text-ink-400 mb-4 mt-8">Best Performing Patterns</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard emoji="🕐" label="Best Hour"     value={bestHourLabel}                  sub={`score ${s.bestHour?.avgEngagement || "—"}`}    accent="#ea580c" />
        <KpiCard emoji="📅" label="Best Day"      value={bestDayLabel}                   sub={`score ${s.bestDay?.avgEngagement || "—"}`}     accent="#ea580c" />
        <KpiCard emoji="⏱️" label="Best Duration" value={s.bestDuration?.label || "—"}   sub={s.bestDuration ? `score ${s.bestDuration.avgEngagement}` : "—"} accent="#ea580c" />
        <KpiCard emoji="🎵" label="Best Audio"    value={s.bestAudio?.type?.split(" ")[0] || "—"} sub={s.bestAudio ? `score ${s.bestAudio.avgEngagement}` : "—"} accent="#ea580c" />
      </div>
    </div>
  );
}

// ── Audio breakdown card ───────────────────────────────────────────────────
function AudioBreakdown({ byAudio, best }) {
  const max = Math.max(...byAudio.map(a => a.avgEngagement), 1);
  return (
    <div>
      <h3 className="font-display font-700 text-xs uppercase tracking-widest text-ink-400 mb-4">Audio Strategy</h3>
      <div className="stat-card p-6">
        <p className="text-xs font-600 text-ink-500 uppercase tracking-wider mb-5">Original vs Licensed audio performance</p>
        <div className="flex gap-8 flex-wrap">
          {byAudio.map((a, i) => (
            <div key={i} className="flex-1 min-w-[140px]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{a.type.includes("Original") ? "🎙️" : "🎵"}</span>
                <span className="text-xs font-600 text-ink-600">{a.type}</span>
                {best?.type === a.type && <span className="tag tag-orange">Best</span>}
              </div>
              <div className="text-2xl font-display font-700" style={{ color: best?.type === a.type ? "#f97316" : "#bfbab0" }}>
                {a.avgEngagement.toLocaleString()}
              </div>
              <div className="text-xs text-ink-400 mt-0.5">avg score · {a.count} posts</div>
              <div className="score-bar-track mt-3">
                <div className="score-bar-fill" style={{ width: `${(a.avgEngagement / max) * 100}%`, background: best?.type === a.type ? "#f97316" : "#fed7aa" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
