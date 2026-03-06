import { useEffect, useState } from "react";

function renderMarkdown(text) {
  if (!text) return "";
  return text
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/gs, match => `<ul>${match}</ul>`)
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hul])(.+)$/gm, (m, p1) => p1.startsWith('<') ? m : `<p>${m}</p>`);
}

export default function AIReport({ report, loading }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 50); }, []);

  return (
    <div
      className={`bg-white border border-ink-100 rounded-2xl overflow-hidden transition-all duration-500 ${visible ? "opacity-100" : "opacity-0"}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100"
           style={{ background: "linear-gradient(135deg, #fff7ed 0%, #fff 60%)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center text-white text-sm">✦</div>
          <div>
            <div className="font-display font-700 text-sm text-ink-900">AI Strategy Report</div>
            <div className="text-xs text-ink-400">Powered by Llama 3.3 70B via OpenRouter</div>
          </div>
        </div>
        <span className="tag tag-orange">Free AI</span>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {loading && (
          <div className="space-y-3">
            {[100, 85, 92, 70, 88].map((w, i) => (
              <div key={i} className="skeleton h-4" style={{ width: `${w}%`, animationDelay: `${i * 0.1}s` }} />
            ))}
            <div className="flex items-center gap-2 pt-2">
              <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse-dot" />
              <span className="text-xs text-ink-400">Llama is analysing your data…</span>
            </div>
          </div>
        )}

        {!loading && report && (
          <div
            className="ai-prose"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(report) }}
          />
        )}
      </div>
    </div>
  );
}
