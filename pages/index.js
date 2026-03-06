import Head from "next/head";
import { useState, useRef, useCallback } from "react";
import Papa from "papaparse";
import { processCSV,        formatNumber as fmtIG } from "../lib/processCSV";
import { processTikTokCSV,  formatNumber as fmtTT } from "../lib/processTikTokCSV";
import StatsOverview from "../components/StatsOverview";
import ChartsSection from "../components/ChartsSection";
import PostsTable    from "../components/PostsTable";
import TikTokTable   from "../components/TikTokTable";
import AIReport      from "../components/AIReport";

/* ── Reusable atoms ─────────────────────────────────────────────────────── */
function Logo() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
      <div style={{ width:32, height:32, borderRadius:10, background:"var(--ink-900)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 8px rgba(0,0,0,0.18)" }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="1"  y="9"  width="3" height="6" rx="1.2" fill="white" opacity="0.45"/>
          <rect x="6"  y="5"  width="3" height="10" rx="1.2" fill="white" opacity="0.72"/>
          <rect x="11" y="1"  width="3" height="14" rx="1.2" fill="white"/>
          <circle cx="12.5" cy="1.5" r="1.8" fill="#f97316"/>
        </svg>
      </div>
      <span style={{ fontFamily:"DM Sans,sans-serif", fontWeight:700, fontSize:"0.95rem", letterSpacing:"-0.02em", color:"var(--ink-900)" }}>
        Pulse <span style={{ fontWeight:400, color:"var(--ink-400)" }}>Analytics</span>
      </span>
    </div>
  );
}

function Spinner() {
  return <span style={{ width:14, height:14, border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"white", borderRadius:"50%", display:"inline-block" }} className="animate-spin" />;
}

function SectionLabel({ children, style }) {
  return (
    <p style={{ fontSize:"0.65rem", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"var(--ink-400)", ...style }}>
      {children}
    </p>
  );
}

/* ── Upload panel ───────────────────────────────────────────────────────── */
function UploadPanel({ platform, stage, onFile, onReset, fileName, error }) {
  const [dragging, setDragging] = useState(false);
  const ref = useRef();
  const isIG = platform === "ig";

  const cfg = isIG ? {
    label:"Instagram", hint:"Instagram scraper CSV", emoji:"📸",
    stripClass:"strip-ig", cardClass:"ig",
    accentText:"#e1306c",
  } : {
    label:"TikTok", hint:"TikTok scraper CSV", emoji:"🎵",
    stripClass:"strip-tt", cardClass:"tt",
    accentText:"#69C9D0",
  };

  const onDrop  = (e) => { e.preventDefault(); setDragging(false); onFile(e.dataTransfer.files[0]); };
  const onOver  = (e) => { e.preventDefault(); setDragging(true); };
  const onLeave = () => setDragging(false);

  return (
    <div className={`platform-card ${cfg.cardClass}`} style={{ display:"flex", flexDirection:"column", minHeight:280 }}>
      {/* Gradient strip top */}
      <div className={cfg.stripClass} style={{ margin:"1.25rem 1.5rem 0" }} />

      <div style={{ padding:"1.25rem 1.5rem 1.5rem", flex:1, display:"flex", flexDirection:"column" }}>
        {/* Header row */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.1rem" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:"1.3rem" }}>{cfg.emoji}</span>
            <div>
              <div style={{ fontWeight:600, fontSize:"0.9rem", color:"var(--ink-900)" }}>{cfg.label}</div>
              <div style={{ fontSize:"0.72rem", color:"var(--ink-400)" }}>{cfg.hint}</div>
            </div>
          </div>
          {stage === "ready" && (
            <button
              onClick={onReset}
              style={{ fontSize:"0.75rem", padding:"6px 12px", borderRadius:8, background:"var(--ink-50)", color:"var(--ink-500)", border:"1px solid var(--ink-100)", cursor:"pointer", transition:"all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background="var(--ink-100)"; }}
              onMouseLeave={e => { e.currentTarget.style.background="var(--ink-50)"; }}
            >
              ↑ New file
            </button>
          )}
        </div>

        {/* States */}
        {stage === "idle" && (
          <>
            <div
              className={`drop-zone${dragging ? " dragging" : ""}`}
              style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"2rem 1rem" }}
              onDrop={onDrop} onDragOver={onOver} onDragLeave={onLeave}
              onClick={() => ref.current?.click()}
            >
              <div style={{ fontSize:"2rem", marginBottom:"0.75rem" }} className="animate-float-a">📂</div>
              <p style={{ fontWeight:600, fontSize:"0.875rem", color:"var(--ink-700)", marginBottom:4 }}>Drop CSV here</p>
              <p style={{ fontSize:"0.78rem", color:"var(--ink-400)" }}>or click to browse</p>
              <input ref={ref} type="file" accept=".csv" style={{ display:"none" }} onChange={e => onFile(e.target.files[0])} />
            </div>
            {error && (
              <div style={{ marginTop:10, fontSize:"0.78rem", color:"#dc2626", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8, padding:"8px 12px" }}>
                ⚠️ {error}
              </div>
            )}
          </>
        )}

        {stage === "processing" && (
          <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12 }}>
            <div style={{ display:"flex", gap:6 }}>
              {[0,1,2].map(i => (
                <div key={i} className="animate-pulse-dot"
                  style={{ width:8, height:8, borderRadius:"50%", background:"#f97316", animationDelay:`${i*0.25}s` }} />
              ))}
            </div>
            <p style={{ fontSize:"0.825rem", color:"var(--ink-500)" }}>Parsing & computing metrics…</p>
          </div>
        )}

        {stage === "ready" && (
          <div className="animate-slide-right" style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
              <span style={{ color:"#16a34a", fontSize:"1rem" }}>✓</span>
              <span style={{ fontSize:"0.825rem", fontWeight:500, color:"var(--ink-700)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:220 }}>{fileName}</span>
            </div>
            <p style={{ fontSize:"0.75rem", color:"var(--ink-400)" }}>Scroll down to view your {cfg.label} analysis ↓</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── TikTok KPI cards ───────────────────────────────────────────────────── */
function KpiCard({ emoji, label, value, sub, accent }) {
  return (
    <div className="stat-card" style={{ padding:"1.1rem 1.25rem" }}>
      <div style={{ fontSize:"1.1rem", marginBottom:"0.6rem" }}>{emoji}</div>
      <SectionLabel style={{ marginBottom:4 }}>{label}</SectionLabel>
      <div style={{ fontWeight:700, fontSize:"1.3rem", color: accent || "var(--ink-900)", fontVariantNumeric:"tabular-nums", marginBottom:2 }}>{value}</div>
      {sub && <div style={{ fontSize:"0.72rem", color:"var(--ink-400)" }}>{sub}</div>}
    </div>
  );
}

function TikTokKPIs({ stats: s }) {
  if (!s) return null;
  const DAYS = { Sun:"Sunday", Mon:"Monday", Tue:"Tuesday", Wed:"Wednesday", Thu:"Thursday", Fri:"Friday", Sat:"Saturday" };
  const hl = h => `${h%12||12}${h<12?"AM":"PM"}`;
  return (
    <div style={{ marginBottom:"1.5rem" }}>
      <SectionLabel style={{ marginBottom:"0.875rem" }}>Overview</SectionLabel>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"0.75rem", marginBottom:"0.75rem" }}>
        <KpiCard emoji="▶️" label="Total Plays"    value={fmtTT(s.totalPlays)}    sub={`avg ${fmtTT(s.avgPlays)}/post`} />
        <KpiCard emoji="❤️" label="Total Likes"    value={fmtTT(s.totalLikes)}    sub={`avg ${fmtTT(s.avgLikes)}/post`} />
        <KpiCard emoji="🔁" label="Total Shares"   value={fmtTT(s.totalShares)}   sub="all posts" />
        <KpiCard emoji="💬" label="Comments"       value={fmtTT(s.totalComments)} sub="all posts" />
        <KpiCard emoji="🔖" label="Total Saves"    value={fmtTT(s.totalSaves)}    sub="all posts" />
      </div>
      <SectionLabel style={{ margin:"1.25rem 0 0.875rem" }}>Best Patterns</SectionLabel>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"0.75rem" }}>
        <KpiCard emoji="🕐" label="Best Hour"     value={s.bestHour ? hl(s.bestHour.hour) : "—"}          sub={s.bestHour ? `score ${s.bestHour.avgEngagement}` : ""} accent="var(--orange)" />
        <KpiCard emoji="📅" label="Best Day"      value={s.bestDay  ? (DAYS[s.bestDay.day]||s.bestDay.day) : "—"} sub={s.bestDay ? `score ${s.bestDay.avgEngagement}` : ""} accent="var(--orange)" />
        <KpiCard emoji="⏱️" label="Best Duration" value={s.bestDuration?.label || "—"}                     sub={s.bestDuration ? `score ${s.bestDuration.avgEngagement}` : ""} accent="var(--orange)" />
        <KpiCard emoji="🎵" label="Best Audio"    value={s.bestAudio?.type?.split(" ")[0] || "—"}          sub={s.bestAudio ? `score ${s.bestAudio.avgEngagement}` : ""} accent="var(--orange)" />
      </div>
    </div>
  );
}

/* ── Audio breakdown ────────────────────────────────────────────────────── */
function AudioBreakdown({ byAudio, best }) {
  const max = Math.max(...byAudio.map(a => a.avgEngagement), 1);
  return (
    <div className="stat-card" style={{ padding:"1.5rem", marginTop:"1.5rem" }}>
      <SectionLabel style={{ marginBottom:"1.25rem" }}>🎵 Original vs Licensed Audio</SectionLabel>
      <div style={{ display:"flex", gap:"3rem", flexWrap:"wrap" }}>
        {byAudio.map((a, i) => (
          <div key={i} style={{ flex:1, minWidth:140 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
              <span style={{ fontSize:"1.1rem" }}>{a.type.includes("Original") ? "🎙️" : "🎵"}</span>
              <span style={{ fontSize:"0.825rem", fontWeight:600, color:"var(--ink-700)" }}>{a.type}</span>
              {best?.type === a.type && <span className="tag tag-orange">Best</span>}
            </div>
            <div style={{ fontWeight:700, fontSize:"1.5rem", color: best?.type===a.type ? "var(--orange)" : "var(--ink-200)", fontVariantNumeric:"tabular-nums" }}>
              {a.avgEngagement.toLocaleString()}
            </div>
            <div style={{ fontSize:"0.72rem", color:"var(--ink-400)", marginTop:2, marginBottom:12 }}>avg score · {a.count} posts</div>
            <div className="score-bar-track">
              <div className="score-bar-fill" style={{ width:`${(a.avgEngagement/max)*100}%`, background: best?.type===a.type ? "var(--orange)" : "var(--ink-200)" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Analysis section ───────────────────────────────────────────────────── */
function AnalysisSection({ platform, data, aiReport, aiLoading, onRunAI }) {
  const isIG = platform === "ig";
  const stats = data?.stats;
  const displayStats = isIG ? stats : (stats ? { ...stats, totalViews: stats.totalPlays, totalLikes: stats.totalLikes, avgViews: stats.avgPlays } : null);

  return (
    <div
      className="animate-fade-up opacity-0"
      style={{ animationFillMode:"forwards", marginTop:"3rem", paddingTop:"2.5rem",
        borderTop:"2.5px solid transparent",
        borderImage: isIG
          ? "linear-gradient(90deg,#833ab4,#fd1d1d,#fcb045) 1"
          : "linear-gradient(90deg,#69C9D0,#EE1D52,#010101) 1",
      }}
    >
      {/* Section heading */}
      <div style={{ display:"flex", flexDirection:"row", alignItems:"flex-end", justifyContent:"space-between", gap:"1rem", flexWrap:"wrap", marginBottom:"2rem" }}>
        <div>
          <SectionLabel style={{ marginBottom:6 }}>
            {isIG ? "📸 Instagram" : "🎵 TikTok"} · {stats?.accounts?.slice(0,3).map(a=>`@${a}`).join(" · ")}
          </SectionLabel>
          <h2 style={{ fontFamily:"Instrument Serif,serif", fontSize:"clamp(1.5rem,3vw,2rem)", lineHeight:1.15, color:"var(--ink-900)", margin:0 }}>
            Performance Analysis
          </h2>
          <p style={{ fontSize:"0.825rem", color:"var(--ink-400)", marginTop:4 }}>
            {stats?.totalPosts} posts analysed
          </p>
        </div>
        <button onClick={onRunAI} disabled={aiLoading} className="btn-orange">
          {aiLoading ? <><Spinner /> Analysing…</> : <>✦ AI Strategy Report</>}
        </button>
      </div>

      {/* Platform-specific KPIs */}
      {!isIG && <TikTokKPIs stats={stats} />}
      {isIG  && <StatsOverview stats={displayStats} />}

      {/* AI report */}
      {(aiReport || aiLoading) && <div style={{ marginTop:"2rem" }}><AIReport report={aiReport} loading={aiLoading} /></div>}

      {/* Charts */}
      <div style={{ marginTop:"2rem" }}><ChartsSection stats={displayStats} /></div>

      {/* TikTok audio */}
      {!isIG && stats?.byAudio?.length > 1 && <AudioBreakdown byAudio={stats.byAudio} best={stats.bestAudio} />}

      {/* Table */}
      <div style={{ marginTop:"2rem" }}>
        {isIG ? <PostsTable posts={stats?.postsWithScore} /> : <TikTokTable posts={stats?.postsWithScore} />}
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */
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
      header:true, skipEmptyLines:true,
      complete:({ data: rows }) => {
        try {
          const p = processCSV(rows);
          if (!p.posts.length) throw new Error("No valid posts found.");
          setIgData(p); setIgStage("ready");
        } catch(e) { setIgError(e.message); setIgStage("idle"); }
      },
      error:(e) => { setIgError(e.message); setIgStage("idle"); },
    });
  }, []);

  const handleTtFile = useCallback((file) => {
    if (!file) return;
    if (!file.name.endsWith(".csv")) { setTtError("Please upload a .csv file."); return; }
    setTtError(""); setTtFile(file.name); setTtStage("processing"); setTtReport("");
    Papa.parse(file, {
      header:true, skipEmptyLines:true,
      complete:({ data: rows }) => {
        try {
          const cols = Object.keys(rows[0]||{});
          if (!cols.includes("playCount") && !cols.includes("diggCount"))
            throw new Error("Doesn't look like a TikTok CSV.");
          const p = processTikTokCSV(rows);
          if (!p.posts.length) throw new Error("No valid posts found.");
          setTtData(p); setTtStage("ready");
        } catch(e) { setTtError(e.message); setTtStage("idle"); }
      },
      error:(e) => { setTtError(e.message); setTtStage("idle"); },
    });
  }, []);

  const runIgAI = async () => {
    if (!igData?.stats) return;
    setIgAiLoad(true); setIgReport("");
    try {
      const r = await fetch("/api/analyze", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ stats:igData.stats }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setIgReport(j.analysis);
    } catch(e) { setIgReport(`**Error:** ${e.message}`); }
    finally { setIgAiLoad(false); }
  };

  const runTtAI = async () => {
    if (!ttData?.stats) return;
    setTtAiLoad(true); setTtReport("");
    try {
      const r = await fetch("/api/analyzeTikTok", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ stats:ttData.stats }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setTtReport(j.analysis);
    } catch(e) { setTtReport(`**Error:** ${e.message}`); }
    finally { setTtAiLoad(false); }
  };

  const resetIG = () => { setIgStage("idle"); setIgData(null); setIgFile(""); setIgReport(""); setIgError(""); };
  const resetTT = () => { setTtStage("idle"); setTtData(null); setTtFile(""); setTtReport(""); setTtError(""); };

  return (
    <>
      <Head>
        <title>Pulse Analytics · Internal</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      {/* Navbar */}
      <nav style={{ position:"sticky", top:0, zIndex:50, background:"rgba(250,249,247,0.88)", backdropFilter:"blur(14px)", borderBottom:"1px solid var(--ink-100)" }}>
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"0 1.5rem", height:56, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <Logo />
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:"#4ade80", boxShadow:"0 0 0 2px rgba(74,222,128,0.2)" }} className="animate-pulse-dot" />
            <span style={{ fontSize:"0.75rem", color:"var(--ink-400)" }}>Internal only</span>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-bg" style={{ padding:"5rem 1.5rem 3.5rem" }}>
        <div style={{ maxWidth:1280, margin:"0 auto" }}>

          <div className="animate-fade-up opacity-0" style={{ animationDelay:"0.04s", animationFillMode:"forwards", marginBottom:"1.25rem" }}>
            <span className="tag tag-dark">✦ Social Media Analytics · Internal</span>
          </div>

          <div className="animate-fade-up opacity-0" style={{ animationDelay:"0.1s", animationFillMode:"forwards", marginBottom:"0.875rem" }}>
            <h1 style={{ fontFamily:"Instrument Serif,serif", fontSize:"clamp(2.2rem,5vw,3.75rem)", lineHeight:1.1, color:"var(--ink-900)", margin:0, maxWidth:600 }}>
              Turn raw data into<br />
              <em style={{ fontStyle:"italic", color:"var(--orange)" }}>strategy</em>
            </h1>
          </div>

          <div className="animate-fade-up opacity-0" style={{ animationDelay:"0.17s", animationFillMode:"forwards", marginBottom:"3rem" }}>
            <p style={{ fontSize:"0.975rem", color:"var(--ink-500)", maxWidth:460, lineHeight:1.65, margin:0 }}>
              Upload your Instagram and TikTok CSV exports. We compute engagement scores across every post and generate a free AI strategy report tailored to your actual data.
            </p>
          </div>

          {/* Two upload panels */}
          <div className="animate-fade-up opacity-0" style={{ animationDelay:"0.24s", animationFillMode:"forwards", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.25rem", maxWidth:820 }}>
            <UploadPanel platform="ig" stage={igStage} onFile={handleIgFile} onReset={resetIG} fileName={igFile} error={igError} />
            <UploadPanel platform="tt" stage={ttStage} onFile={handleTtFile} onReset={resetTT} fileName={ttFile} error={ttError} />
          </div>

          {/* Fine print */}
          <div className="animate-fade-up opacity-0" style={{ animationDelay:"0.32s", animationFillMode:"forwards", marginTop:"1.1rem", display:"flex", flexWrap:"wrap", gap:"1.5rem" }}>
            {["Compatible with Apify & Phantombuster exports","All parsing happens in your browser","No data stored or sent externally"].map((t,i) => (
              <span key={i} style={{ fontSize:"0.72rem", color:"var(--ink-300)", display:"flex", alignItems:"center", gap:5 }}>
                <span style={{ color:"var(--ink-200)" }}>—</span>{t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Analysis output */}
      <main style={{ maxWidth:1280, margin:"0 auto", padding:"0 1.5rem 6rem" }}>

        {igStage === "ready" && igData?.stats && (
          <AnalysisSection platform="ig" data={igData} aiReport={igReport} aiLoading={igAiLoad} onRunAI={runIgAI} />
        )}

        {ttStage === "ready" && ttData?.stats && (
          <AnalysisSection platform="tt" data={ttData} aiReport={ttReport} aiLoading={ttAiLoad} onRunAI={runTtAI} />
        )}

        {igStage !== "ready" && ttStage !== "ready" && (
          <div className="animate-fade-in opacity-0" style={{ animationDelay:"0.5s", animationFillMode:"forwards", textAlign:"center", padding:"5rem 0 2rem" }}>
            <div style={{ fontSize:"2rem", marginBottom:"1rem", color:"var(--ink-200)" }}>↑</div>
            <p style={{ color:"var(--ink-300)", fontSize:"0.875rem" }}>Upload a CSV above to see your analysis</p>
          </div>
        )}
      </main>
    </>
  );
}
