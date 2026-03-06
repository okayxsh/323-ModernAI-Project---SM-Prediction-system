/**
 * POST /api/analyzeTikTok
 * Body: { stats: {...} }
 * Returns AI analysis via OpenRouter (Llama 3.3 70B free) — TikTok specific
 */

export const config = { api: { responseLimit: false } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { stats } = req.body;
  if (!stats) return res.status(400).json({ error: "Missing stats" });

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "OPENROUTER_API_KEY not set in .env.local" });

  const summary = buildTikTokSummary(stats);

  const systemPrompt = `You are a TikTok growth strategist and data analyst.
You have been given aggregated performance data from a TikTok account.
Produce a clear, actionable analysis report that marketing staff can act on immediately.
Format using simple markdown (## headings, bullet points, **bold**).
Be specific — mention exact hours, days, durations, hashtag counts from the data.
Only reference data provided. Do NOT invent numbers.`;

  const userPrompt = `Here is the TikTok performance data:

${summary}

Write a structured analysis report with these sections:
## 📅 Best Time to Post
## 📆 Best Day to Post
## 🎬 Ideal Video Duration
## #️⃣ Hashtag Strategy
## 🎵 Audio Strategy (Original vs Licensed)
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
        "X-Title": "Pulse Internal TikTok Analytics",
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
      return res.status(upstream.status).json({ error: "OpenRouter API error", detail: err });
    }

    const data = await upstream.json();
    const text = data.choices?.[0]?.message?.content || "";
    return res.status(200).json({ analysis: text });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

function buildTikTokSummary(s) {
  const lines = [];

  lines.push(`OVERVIEW`);
  lines.push(`- Total posts analysed: ${s.totalPosts}`);
  lines.push(`- Total plays: ${s.totalPlays.toLocaleString()}`);
  lines.push(`- Total likes: ${s.totalLikes.toLocaleString()}`);
  lines.push(`- Total shares: ${s.totalShares.toLocaleString()}`);
  lines.push(`- Total comments: ${s.totalComments.toLocaleString()}`);
  lines.push(`- Total saves: ${s.totalSaves.toLocaleString()}`);
  lines.push(`- Avg plays per post: ${s.avgPlays.toLocaleString()}`);
  lines.push(`- Avg likes per post: ${s.avgLikes.toLocaleString()}`);
  lines.push(`- Avg engagement score: ${s.avgEngagement}`);
  lines.push(``);

  lines.push(`ENGAGEMENT BY HOUR`);
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

  if (s.byAudio?.length) {
    lines.push(`AUDIO TYPE PERFORMANCE`);
    for (const a of s.byAudio) {
      lines.push(`- ${a.label}: score ${a.avgEngagement}, ${a.count} posts`);
    }
    lines.push(`→ BEST AUDIO: ${s.bestAudio?.label}`);
    lines.push(``);
  }

  if (s.topHashtags?.length) {
    lines.push(`TOP PERFORMING HASHTAGS`);
    for (const h of s.topHashtags.slice(0, 10)) {
      lines.push(`- #${h.tag}: avg score ${h.avgEngagement} (used ${h.count}x)`);
    }
    lines.push(``);
  }

  if (s.topPosts?.length) {
    lines.push(`TOP 5 POSTS`);
    for (const p of s.topPosts) {
      const d = p.timestamp instanceof Date ? p.timestamp.toDateString() : String(p.timestamp);
      lines.push(`- ${d} | ${p.plays.toLocaleString()} plays | ${p.likes} likes | ${p.shares} shares | ${p.hashtagCount} hashtags | ${Math.round(p.duration)}s`);
    }
  }

  return lines.join("\n");
}
