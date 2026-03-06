import Head from "next/head";
import { useState, useRef, useCallback } from "react";
import Papa from "papaparse";
import { processCSV, formatNumber, hourLabel } from "../lib/processCSV";
import StatsOverview   from "../components/StatsOverview";
import ChartsSection   from "../components/ChartsSection";
import PostsTable      from "../components/PostsTable";
import AIReport        from "../components/AIReport";

export default function Dashboard() {
  const [stage, setStage]       = useState("upload"); // upload | processing | ready
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [data, setData]         = useState(null);   // { posts, stats }
  const [error, setError]       = useState("");
  const [aiReport, setAiReport] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const fileRef = useRef();

  // ── File handling ─────────────────────────────────────────
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
          const processed = processCSV(results.data);
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

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  // ── AI Analysis ───────────────────────────────────────────
  const runAI = async () => {
    if (!data?.stats) return;
    setAiLoading(true);
    setAiReport("");
    try {
      const res = await fetch("/api/analyze", {
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

  // ── Reset ─────────────────────────────────────────────────
  const reset = () => {
    setStage("upload");
    setData(null);
    setFileName("");
    setAiReport("");
    setError("");
  };

  return (
    <>
      <Head>
        <title>Pulse · Internal Analytics</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      {/* ── Nav ───────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-ink-100">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="7" width="2.5" height="6" rx="1" fill="white"/>
                <rect x="5" y="4" width="2.5" height="9" rx="1" fill="white"/>
                <rect x="9" y="1" width="2.5" height="12" rx="1" fill="white"/>
                <circle cx="11.5" cy="1.5" r="1.5" fill="#fed7aa"/>
              </svg>
            </div>
            <span className="font-display font-700 text-ink-900 text-base tracking-tight">
              Pulse <span className="text-ink-400 font-400">· Internal</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Link to TikTok page */}
            <a href="/tiktok" className="text-xs font-500 text-ink-400 hover:text-ink-700 transition-colors flex items-center gap-1">
              <span>🎵</span> TikTok
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

        {/* ── Upload stage ──────────────────────────────────── */}
        {stage === "upload" && (
          <div className="animate-fade-up opacity-0" style={{ animationDelay: "0.05s", animationFillMode: "forwards" }}>
            <div className="max-w-xl mx-auto text-center pt-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-600 text-xs font-600 mb-6">
                📊 Instagram Analytics
              </div>
              <h1 className="font-display font-700 text-3xl md:text-4xl text-ink-900 mb-3 leading-tight">
                Upload your Instagram<br />data export
              </h1>
              <p className="text-ink-500 text-sm mb-10 leading-relaxed">
                Drop any Instagram scraper CSV — we'll parse it, compute engagement metrics across every post, and generate an AI strategy report tailored to your account's actual performance.
              </p>

              {/* Drop zone */}
              <div
                className={`drop-zone rounded-2xl p-10 cursor-pointer mb-4 ${dragging ? "dragging" : ""}`}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => fileRef.current?.click()}
              >
                <div className="text-4xl mb-4">📂</div>
                <p className="font-600 text-ink-700 mb-1">Drop your CSV here</p>
                <p className="text-sm text-ink-400">or click to browse</p>
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => handleFile(e.target.files[0])} />
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mt-3">
                  ⚠️ {error}
                </div>
              )}

              <p className="text-xs text-ink-300 mt-6">
                Compatible with Instagram scraper exports (Apify, Phantombuster, etc.).<br/>
                All processing happens locally — no data is stored.
              </p>
            </div>
          </div>
        )}

        {/* ── Processing stage ──────────────────────────────── */}
        {stage === "processing" && (
          <div className="flex flex-col items-center justify-center pt-32 gap-4">
            <div className="flex gap-2">
              {[0,1,2].map(i => (
                <div key={i} className="w-2.5 h-2.5 rounded-full bg-brand-400 animate-pulse-dot"
                     style={{ animationDelay: `${i * 0.3}s` }} />
              ))}
            </div>
            <p className="text-ink-500 text-sm">Parsing CSV &amp; computing engagement metrics…</p>
          </div>
        )}

        {/* ── Ready stage ───────────────────────────────────── */}
        {stage === "ready" && data?.stats && (
          <div className="space-y-10 animate-fade-in opacity-0" style={{ animationFillMode: "forwards" }}>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="text-xs text-ink-400 uppercase tracking-widest font-600 mb-1">
                  {data.stats.accounts.slice(0,3).join(" · ")}
                </p>
                <h2 className="font-display font-700 text-2xl md:text-3xl text-ink-900">
                  Performance Analysis
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
                ) : (
                  <> ✦ Generate AI Strategy Report </>
                )}
              </button>
            </div>

            {/* Stats overview */}
            <StatsOverview stats={data.stats} />

            {/* AI Report */}
            {(aiReport || aiLoading) && (
              <AIReport report={aiReport} loading={aiLoading} />
            )}

            {/* Charts */}
            <ChartsSection stats={data.stats} />

            {/* Posts table */}
            <PostsTable posts={data.stats.postsWithScore} />

          </div>
        )}
      </main>
    </>
  );
}
