import { useEffect, useState } from "react";

function renderMarkdown(text) {
  if (!text) return "";
  return text
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/gs, m => `<ul>${m}</ul>`)
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hul])(.+)$/gm, (m, p1) => p1.startsWith('<') ? m : `<p>${m}</p>`);
}

export default function AIReport({ report, loading }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), 40); return () => clearTimeout(t); }, []);

  return (
    <div className="as" style={{
      opacity: show ? 1 : 0,
      background: "rgba(255,255,255,0.80)",
      backdropFilter: "blur(24px) saturate(180%)",
      WebkitBackdropFilter: "blur(24px) saturate(180%)",
      border: "1px solid var(--border)",
      borderRadius: 18,
      overflow: "hidden",
      transition: "opacity .4s ease",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 24px",
        borderBottom: "1px solid var(--border)",
        background: "rgba(255,255,255,0.6)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: "var(--text-1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.85rem", color: "#fff",
          }}>✦</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-1)" }}>AI Strategy Report</div>
            <div style={{ fontSize: "0.71rem", color: "var(--text-4)", marginTop: 1 }}>Llama 3.3 70B · OpenRouter · Free</div>
          </div>
        </div>
        <span className="badge badge-neutral">AI-generated</span>
      </div>

      {/* Body */}
      <div style={{ padding: "24px" }}>
        {loading && (
          <div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              {[100, 82, 94, 68, 88, 76].map((w, i) => (
                <div key={i} className="skeleton" style={{ height: 14, width: `${w}%`, animationDelay: `${i * 0.08}s` }} />
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div className="blink" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--text-4)" }} />
              <span style={{ fontSize: "0.78rem", color: "var(--text-4)" }}>Analysing your data with Llama…</span>
            </div>
          </div>
        )}
        {!loading && report && (
          <div className="ai-prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(report) }} />
        )}
      </div>
    </div>
  );
}
