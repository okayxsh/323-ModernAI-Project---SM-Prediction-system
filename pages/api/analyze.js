/**
 * POST /api/analyze
 * Body: { stats: {...} }  — the processed stats object from processCSV
 * Returns streaming AI analysis via OpenRouter (Llama 3.3 70B free)
 */

export const config = { api: { responseLimit: false } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { stats } = req.body;
  if (!stats) return res.status(400).json({ error: "Missing stats" });

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "OPENROUTER_API_KEY not set in .env.local" });

  // Build a concise data summary to send to the LLM (keep tokens low)
  const summary = buildSummary(stats);

  const systemPrompt = `You are a social media strategist and data analyst specialising in Instagram growth.
You have been given aggregated performance data from a company's Instagram account.
Your job is to produce a clear, actionable analysis report that non-technical marketing staff can act on immediately.
Format your response using simple markdown (## headings, bullet points, **bold**).
Be specific — mention exact hours, days, durations, hashtag counts from the data.
Do NOT make up data. Only reference what is provided.`;

  const userPrompt = `Here is the Instagram performance data summary:

${summary}

Please write a structured analysis report with these sections:
## 📅 Best Time to Post
## 📆 Best Day to Post
## 🎬 Ideal Video Duration
## #️⃣ Hashtag Strategy
## 🏆 Top Performing Content Types
## 💡 Key Recommendations
## ⚠️ What to Avoid

For each section give 2-4 specific, data-backed bullet points. End with a short "Strategy Summary" paragraph (3-5 sentences).`;

  try {
    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://pulse-internal.vercel.app",
        "X-Title": "Pulse Internal Analytics",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct:free",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user",   content: userPrompt },
        ],
        max_tokens: 1200,
        temperature: 0.5,
        stream: false,
      }),
    });

    if (!upstream.ok) {
      const err = await upstream.text();
      console.error("OpenRouter error:", err);
      return res.status(upstream.status).json({ error: "OpenRouter API error", detail: err });
    }

    const data = await upstream.json();
    const text = data.choices?.[0]?.message?.content || "";
    return res.status(200).json({ analysis: text });

  } catch (err) {
    console.error("Analyze error:", err);
    return res.status(500).json({ error: err.message });
  }
}

function buildSummary(s) {
  const lines = [];

  lines.push(`OVERVIEW`);
  lines.push(`- Total posts analysed: ${s.totalPosts}`);
  lines.push(`- Total likes: ${s.totalLikes.toLocaleString()}`);
  lines.push(`- Total video views: ${s.totalViews.toLocaleString()}`);
  lines.push(`- Avg likes per post: ${s.avgLikes}`);
  lines.push(`- Avg video views per post: ${s.avgViews}`);
  lines.push(`- Avg engagement score per post: ${s.avgEngagement}`);
  lines.push(``);

  lines.push(`ENGAGEMENT BY HOUR (hour → avg engagement score, post count)`);
  for (const h of s.byHour) {
    const label = `${h.hour % 12 || 12}${h.hour < 12 ? "AM" : "PM"}`;
    lines.push(`- ${label}: score ${h.avgEngagement}, ${h.count} posts`);
  }
  lines.push(`→ BEST HOUR: ${s.bestHour?.hour % 12 || 12}${(s.bestHour?.hour || 0) < 12 ? "AM" : "PM"} (score ${s.bestHour?.avgEngagement})`);
  lines.push(``);

  lines.push(`ENGAGEMENT BY DAY`);
  for (const d of s.byDay) {
    lines.push(`- ${d.day}: score ${d.avgEngagement}, ${d.count} posts`);
  }
  lines.push(`→ BEST DAY: ${s.bestDay?.day} (score ${s.bestDay?.avgEngagement})`);
  lines.push(``);

  lines.push(`ENGAGEMENT BY CONTENT TYPE`);
  for (const t of s.byType) {
    lines.push(`- ${t.type}: score ${t.avgEngagement}, ${t.count} posts`);
  }
  lines.push(`→ BEST TYPE: ${s.bestType?.type}`);
  lines.push(``);

  if (s.durationBuckets?.length) {
    lines.push(`VIDEO DURATION BUCKETS`);
    for (const b of s.durationBuckets) {
      lines.push(`- ${b.label}: score ${b.avgEngagement}, ${b.count} videos`);
    }
    lines.push(`→ BEST DURATION: ${s.bestDuration?.label} (score ${s.bestDuration?.avgEngagement})`);
    lines.push(``);
  }

  if (s.hashtagBuckets?.length) {
    lines.push(`HASHTAG COUNT BUCKETS`);
    for (const b of s.hashtagBuckets) {
      lines.push(`- ${b.label} hashtags: score ${b.avgEngagement}, ${b.count} posts`);
    }
    lines.push(`→ BEST HASHTAG COUNT: ${s.bestHashtagBucket?.label}`);
    lines.push(``);
  }

  if (s.topHashtags?.length) {
    lines.push(`TOP PERFORMING HASHTAGS (by avg engagement)`);
    for (const h of s.topHashtags.slice(0, 10)) {
      lines.push(`- #${h.tag}: avg score ${h.avgEngagement} (used ${h.count}x)`);
    }
    lines.push(``);
  }

  if (s.topPosts?.length) {
    lines.push(`TOP 5 POSTS`);
    for (const p of s.topPosts) {
      const d = p.timestamp instanceof Date ? p.timestamp.toDateString() : String(p.timestamp);
      lines.push(`- ${d} | ${p.type} | ${p.likes} likes | ${p.views} views | ${p.hashtagCount} hashtags | ${Math.round(p.duration)}s duration`);
    }
  }

  return lines.join("\n");
}
