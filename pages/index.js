import Head from "next/head";
import { useState, useRef, useCallback } from "react";
import Papa from "papaparse";
import { processCSV,       formatNumber as fmtIG } from "../lib/processCSV";
import { processTikTokCSV, formatNumber as fmtTT } from "../lib/processTikTokCSV";
import StatsOverview from "../components/StatsOverview";
import ChartsSection from "../components/ChartsSection";
import PostsTable    from "../components/PostsTable";
import TikTokTable   from "../components/TikTokTable";
import AIReport      from "../components/AIReport";

/* ── Spinner ─────────────────────────────────────────────────────────────── */
function Spinner() {
  return (
    <span style={{
      width: 14, height: 14, borderRadius: "50%",
      border: "2px solid rgba(255,255,255,0.3)",
      borderTopColor: "#fff",
      display: "inline-block",
    }} className="spin" />
  );
}

/* ── Upload card ─────────────────────────────────────────────────────────── */
function UploadCard({ platform, stage, error, fileName, onFile, onReset }) {
  const [over, setOver] = useState(false);
  const inputRef = useRef();
  const isIG = platform === "ig";

  const meta = isIG ? {
    name: "Instagram", hint: "Drop your Instagram scraper CSV",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="url(#ig-grad)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <defs>
          <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fcb045"/>
            <stop offset="50%" stopColor="#fd1d1d"/>
            <stop offset="100%" stopColor="#833ab4"/>
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <circle cx="12" cy="12" r="4"/>
        <circle cx="17.5" cy="6.5" r="1" fill="url(#ig-grad)" stroke="none"/>
      </svg>
    ),
  } : {
    name: "TikTok", hint: "Drop your TikTok scraper CSV",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--text-1)">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9a8.19 8.19 0 004.79 1.52V7.07a4.85 4.85 0 01-1.02-.38z"/>
      </svg>
    ),
  };

  const handleDrop = (e) => {
    e.preventDefault(); setOver(false);
    onFile(e.dataTransfer.files[0]);
  };

  return (
    <div className={`upload-card ${isIG ? "ig" : "tt"} ${stage === "ready" ? "loaded" : ""}`}
         style={{ padding: "28px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "rgba(255,255,255,0.8)",
            backdropFilter: "blur(8px)",
            border: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}>
            {meta.icon}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-1)" }}>{meta.name}</div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-4)", marginTop: 1 }}>{meta.hint}</div>
          </div>
        </div>
        {stage === "ready" && (
          <button className="btn btn-ghost" onClick={onReset}>↑ Replace</button>
        )}
      </div>

      {/* States */}
      {stage === "idle" && (
        <>
          <div
            className={`drop-zone${over ? " over" : ""}`}
            style={{ padding: "32px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setOver(true); }}
            onDragLeave={() => setOver(false)}
            onDrop={handleDrop}
          >
            <div className="af" style={{ fontSize: "1.75rem", lineHeight: 1 }}>📂</div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-2)" }}>Drop CSV here</p>
              <p style={{ fontSize: "0.775rem", color: "var(--text-4)", marginTop: 3 }}>or click to browse</p>
            </div>
            <input ref={inputRef} type="file" accept=".csv" style={{ display: "none" }}
                   onChange={e => onFile(e.target.files[0])} />
          </div>
          {error && (
            <div style={{ marginTop: 12, padding: "9px 14px", borderRadius: 9, background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)", fontSize: "0.78rem", color: "var(--error)" }}>
              ⚠ {error}
            </div>
          )}
        </>
      )}

      {stage === "processing" && (
        <div style={{ padding: "36px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", gap: 7 }}>
            {[0, 1, 2].map(i => (
              <div key={i} className="blink" style={{
                width: 8, height: 8, borderRadius: "50%",
                background: "var(--text-4)",
                animationDelay: `${i * 0.22}s`,
              }} />
            ))}
          </div>
          <p style={{ fontSize: "0.825rem", color: "var(--text-4)" }}>Parsing CSV…</p>
        </div>
      )}

      {stage === "ready" && (
        <div className="asu" style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", borderRadius: 11, background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.15)" }}>
          <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(22,163,74,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5.5L4.2 7.5L8 3" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--success)" }}>File loaded</p>
            <p style={{ fontSize: "0.75rem", color: "var(--text-4)", marginTop: 2, wordBreak: "break-all" }}>{fileName}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── KPI card (TikTok) ───────────────────────────────────────────────────── */
function KpiCard({ icon, label, value, sub, highlight }) {
  return (
    <div className="card" style={{ padding: "18px 20px" }}>
      <div style={{ fontSize: "1.1rem", marginBottom: 10 }}>{icon}</div>
      <div className="eyebrow" style={{ marginBottom: 5 }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: "1.35rem", color: highlight ? "var(--indigo)" : "var(--text-1)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: "0.72rem", color: "var(--text-4)", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

/* ── TikTok KPI grid ─────────────────────────────────────────────────────── */
function TikTokKPIs({ stats: s }) {
  if (!s) return null;
  const DAYS = { Sun: "Sunday", Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday" };
  const hl = h => `${h % 12 || 12}${h < 12 ? "AM" : "PM"}`;
  return (
    <div>
      <p className="eyebrow" style={{ marginBottom: 14 }}>Overview</p>
      <div className="kpi-5" style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 12 }}>
        <KpiCard icon="▶️" label="Plays"    value={fmtTT(s.totalPlays)}    sub={`avg ${fmtTT(s.avgPlays)}/post`} />
        <KpiCard icon="❤️" label="Likes"    value={fmtTT(s.totalLikes)}    sub={`avg ${fmtTT(s.avgLikes)}/post`} />
        <KpiCard icon="🔁" label="Shares"   value={fmtTT(s.totalShares)}   sub="total" />
        <KpiCard icon="💬" label="Comments" value={fmtTT(s.totalComments)} sub="total" />
        <KpiCard icon="🔖" label="Saves"    value={fmtTT(s.totalSaves)}    sub="total" />
      </div>
      <p className="eyebrow" style={{ margin: "20px 0 14px" }}>Best patterns</p>
      <div className="kpi-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        <KpiCard icon="🕐" label="Best hour"     value={s.bestHour ? hl(s.bestHour.hour) : "—"}                sub={s.bestHour ? `score ${s.bestHour.avgEngagement}` : ""} highlight />
        <KpiCard icon="📅" label="Best day"      value={s.bestDay  ? (DAYS[s.bestDay.day] || s.bestDay.day) : "—"} sub={s.bestDay ? `score ${s.bestDay.avgEngagement}` : ""} highlight />
        <KpiCard icon="⏱️" label="Best duration" value={s.bestDuration?.label || "—"}                          sub={s.bestDuration ? `score ${s.bestDuration.avgEngagement}` : ""} highlight />
        <KpiCard icon="🎵" label="Best audio"    value={s.bestAudio?.type?.split(" ")[0] || "—"}               sub={s.bestAudio ? `score ${s.bestAudio.avgEngagement}` : ""} highlight />
      </div>
    </div>
  );
}

/* ── Audio breakdown ─────────────────────────────────────────────────────── */
function AudioBreakdown({ byAudio, best }) {
  const max = Math.max(...byAudio.map(a => a.avgEngagement), 1);
  return (
    <div className="card" style={{ padding: "22px 24px" }}>
      <p className="eyebrow" style={{ marginBottom: 18 }}>🎵 Audio type performance</p>
      <div style={{ display: "flex", gap: "3rem", flexWrap: "wrap" }}>
        {byAudio.map((a, i) => (
          <div key={i} style={{ flex: 1, minWidth: 140 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span>{a.type.includes("Original") ? "🎙️" : "🎵"}</span>
              <span style={{ fontSize: "0.825rem", fontWeight: 600, color: "var(--text-2)" }}>{a.type}</span>
              {best?.type === a.type && <span className="badge badge-green">Best</span>}
            </div>
            <div style={{ fontWeight: 700, fontSize: "1.6rem", letterSpacing: "-0.03em", color: best?.type === a.type ? "var(--indigo)" : "var(--text-5)", fontVariantNumeric: "tabular-nums" }}>
              {a.avgEngagement.toLocaleString()}
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-4)", marginTop: 3, marginBottom: 12 }}>avg score · {a.count} posts</div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${(a.avgEngagement / max) * 100}%`, background: best?.type === a.type ? "var(--indigo)" : "var(--text-5)" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Analysis section ────────────────────────────────────────────────────── */
function AnalysisSection({ platform, data, aiReport, aiLoading, onRunAI }) {
  const isIG = platform === "ig";
  const s = data?.stats;
  const displayStats = isIG ? s : (s ? { ...s, totalViews: s.totalPlays, totalLikes: s.totalLikes, avgViews: s.avgPlays } : null);

  return (
    <div className="au" style={{ animationFillMode: "both" }}>
      {/* Divider with label */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "48px 0 36px" }}>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className={isIG ? "line-ig" : "line-tt"} style={{ width: 20 }} />
          <span className="eyebrow">{isIG ? "Instagram" : "TikTok"} Analysis</span>
          <div className={isIG ? "line-ig" : "line-tt"} style={{ width: 20 }} />
        </div>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      </div>

      {/* Heading row */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 32 }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: 6 }}>
            {s?.accounts?.slice(0, 3).map(a => `@${a}`).join(" · ")}
          </p>
          <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--text-1)", lineHeight: 1.15 }}>
            Performance Report
          </h2>
          <p style={{ fontSize: "0.825rem", color: "var(--text-4)", marginTop: 5 }}>
            {s?.totalPosts} posts analysed
          </p>
        </div>
        <button className="btn btn-dark" onClick={onRunAI} disabled={aiLoading}>
          {aiLoading ? <><Spinner /> Generating report…</> : <>✦ AI Strategy Report</>}
        </button>
      </div>

      {/* KPIs */}
      {isIG  && <StatsOverview stats={displayStats} />}
      {!isIG && <TikTokKPIs stats={s} />}

      {/* AI report */}
      {(aiReport || aiLoading) && (
        <div style={{ marginTop: 28 }}>
          <AIReport report={aiReport} loading={aiLoading} />
        </div>
      )}

      {/* Charts */}
      <div style={{ marginTop: 28 }}>
        <ChartsSection stats={displayStats} />
      </div>

      {/* TikTok audio */}
      {!isIG && s?.byAudio?.length > 1 && (
        <div style={{ marginTop: 16 }}>
          <AudioBreakdown byAudio={s.byAudio} best={s.bestAudio} />
        </div>
      )}

      {/* Table */}
      <div style={{ marginTop: 16 }}>
        {isIG
          ? <PostsTable  posts={s?.postsWithScore} />
          : <TikTokTable posts={s?.postsWithScore} />}
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function Home() {
  const [igStage,  setIgStage]  = useState("idle");
  const [igFile,   setIgFile]   = useState("");
  const [igData,   setIgData]   = useState(null);
  const [igError,  setIgError]  = useState("");
  const [igReport, setIgReport] = useState("");
  const [igAiLoad, setIgAiLoad] = useState(false);

  const [ttStage,  setTtStage]  = useState("idle");
  const [ttFile,   setTtFile]   = useState("");
  const [ttData,   setTtData]   = useState(null);
  const [ttError,  setTtError]  = useState("");
  const [ttReport, setTtReport] = useState("");
  const [ttAiLoad, setTtAiLoad] = useState(false);

  const handleIgFile = useCallback((file) => {
    if (!file) return;
    if (!file.name.endsWith(".csv")) { setIgError("Please upload a .csv file."); return; }
    setIgError(""); setIgFile(file.name); setIgStage("processing"); setIgReport("");
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: ({ data: rows }) => {
        try {
          const p = processCSV(rows);
          if (!p.posts.length) throw new Error("No valid posts found.");
          setIgData(p); setIgStage("ready");
        } catch (e) { setIgError(e.message); setIgStage("idle"); }
      },
      error: (e) => { setIgError(e.message); setIgStage("idle"); },
    });
  }, []);

  const handleTtFile = useCallback((file) => {
    if (!file) return;
    if (!file.name.endsWith(".csv")) { setTtError("Please upload a .csv file."); return; }
    setTtError(""); setTtFile(file.name); setTtStage("processing"); setTtReport("");
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: ({ data: rows }) => {
        try {
          const cols = Object.keys(rows[0] || {});
          if (!cols.includes("playCount") && !cols.includes("diggCount"))
            throw new Error("This doesn't look like a TikTok CSV.");
          const p = processTikTokCSV(rows);
          if (!p.posts.length) throw new Error("No valid posts found.");
          setTtData(p); setTtStage("ready");
        } catch (e) { setTtError(e.message); setTtStage("idle"); }
      },
      error: (e) => { setTtError(e.message); setTtStage("idle"); },
    });
  }, []);

  const runIgAI = async () => {
    if (!igData?.stats) return;
    setIgAiLoad(true); setIgReport("");
    try {
      const r = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stats: igData.stats }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setIgReport(j.analysis);
    } catch (e) { setIgReport(`**Error:** ${e.message}`); }
    finally { setIgAiLoad(false); }
  };

  const runTtAI = async () => {
    if (!ttData?.stats) return;
    setTtAiLoad(true); setTtReport("");
    try {
      const r = await fetch("/api/analyzeTikTok", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stats: ttData.stats }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setTtReport(j.analysis);
    } catch (e) { setTtReport(`**Error:** ${e.message}`); }
    finally { setTtAiLoad(false); }
  };

  const resetIG = () => { setIgStage("idle"); setIgData(null); setIgFile(""); setIgReport(""); setIgError(""); };
  const resetTT = () => { setTtStage("idle"); setTtData(null); setTtFile(""); setTtReport(""); setTtError(""); };

  return (
    <>
      <Head>
        <title>Pulse · Analytics</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(248,248,249,0.75)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 9,
              background: "var(--text-1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1"  y="8"  width="2.5" height="5" rx="1" fill="white" opacity="0.4"/>
                <rect x="5"  y="5"  width="2.5" height="8" rx="1" fill="white" opacity="0.7"/>
                <rect x="9"  y="1"  width="2.5" height="12" rx="1" fill="white"/>
                <circle cx="10.25" cy="1.25" r="1.5" fill="#6366f1"/>
              </svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: "0.9rem", letterSpacing: "-0.025em", color: "var(--text-1)" }}>
              Pulse <span style={{ fontWeight: 400, color: "var(--text-4)" }}>Analytics</span>
            </span>
          </div>

          {/* Status */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div className="blink" style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
            <span style={{ fontSize: "0.75rem", color: "var(--text-4)" }}>Internal</span>
          </div>
        </div>
      </nav>

      {/* ── Main ───────────────────────────────────────────── */}
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>

        {/* Hero */}
        <div style={{ padding: "64px 0 52px" }}>
          <div className="au d1" style={{ marginBottom: 14 }}>
            <span className="badge badge-neutral">Internal Tool · Social Analytics</span>
          </div>

          <h1 className="au d2" style={{
            fontSize: "clamp(2rem,4.5vw,3.25rem)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            color: "var(--text-1)",
            lineHeight: 1.1,
            marginBottom: 16,
            maxWidth: 560,
          }}>
            Social media <br />
            <span style={{ color: "var(--text-4)", fontWeight: 300 }}>performance insights</span>
          </h1>

          <p className="au d3" style={{ fontSize: "0.975rem", color: "var(--text-3)", maxWidth: 440, lineHeight: 1.65, marginBottom: 0 }}>
            Upload Instagram and TikTok CSV exports. Get engagement breakdowns, pattern analysis, and a free AI strategy report — all in your browser.
          </p>
        </div>

        {/* Upload grid */}
        <div className="upload-grid au d4" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 820, marginBottom: 8 }}>
          <UploadCard platform="ig" stage={igStage} error={igError} fileName={igFile} onFile={handleIgFile} onReset={resetIG} />
          <UploadCard platform="tt" stage={ttStage} error={ttError} fileName={ttFile} onFile={handleTtFile} onReset={resetTT} />
        </div>

        {/* Fine print */}
        <div className="au d5" style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 0, paddingLeft: 2 }}>
          {["All parsing happens in your browser", "No data stored externally", "Compatible with Apify & Phantombuster"].map((t, i) => (
            <span key={i} style={{ fontSize: "0.72rem", color: "var(--text-5)", display: "flex", alignItems: "center", gap: 5 }}>
              <span>—</span> {t}
            </span>
          ))}
        </div>

        {/* Analysis sections */}
        {igStage === "ready" && igData?.stats && (
          <AnalysisSection platform="ig" data={igData} aiReport={igReport} aiLoading={igAiLoad} onRunAI={runIgAI} />
        )}
        {ttStage === "ready" && ttData?.stats && (
          <AnalysisSection platform="tt" data={ttData} aiReport={ttReport} aiLoading={ttAiLoad} onRunAI={runTtAI} />
        )}

        {/* Empty nudge */}
        {igStage !== "ready" && ttStage !== "ready" && (
          <div className="ai d7" style={{ textAlign: "center", paddingTop: "80px", paddingBottom: "20px" }}>
            <p style={{ fontSize: "0.825rem", color: "var(--text-5)" }}>Upload a CSV above to begin ↑</p>
          </div>
        )}
      </main>
    </>
  );
}
