/**
 * Parse and process TikTok scraper CSV data.
 * Columns: authorMeta.name, text, diggCount, shareCount, playCount,
 *          commentCount, collectCount, videoMeta.duration,
 *          musicMeta.musicName, musicMeta.musicAuthor, musicMeta.musicOriginal,
 *          createTimeISO, webVideoUrl
 */

export function processTikTokCSV(rawRows) {
  const posts = [];

  for (const row of rawRows) {
    if (!row["createTimeISO"]) continue;

    const ts = new Date(row["createTimeISO"]);
    if (isNaN(ts)) continue;

    const plays    = parseFloat(row["playCount"])    || 0;
    const likes    = parseFloat(row["diggCount"])    || 0;
    const shares   = parseFloat(row["shareCount"])   || 0;
    const comments = parseFloat(row["commentCount"]) || 0;
    const saves    = parseFloat(row["collectCount"]) || 0;
    const duration = parseFloat(row["videoMeta.duration"]) || 0;
    const caption  = (row["text"] || "").trim();

    // Count hashtags from caption text
    const hashtagMatches = caption.match(/#\w+/g) || [];
    const hashtagCount   = hashtagMatches.length;
    const hashtags       = hashtagMatches.map(h => h.replace(/^#/, "").toLowerCase());

    const captionLength = caption.length;
    const wordCount     = caption ? caption.split(/\s+/).filter(Boolean).length : 0;
    const hour          = ts.getHours();
    const dayOfWeek     = ts.getDay();
    const isWeekend     = dayOfWeek === 0 || dayOfWeek === 6 ? 1 : 0;

    // TikTok engagement score: plays weighted lowest, saves/shares highest
    const engagementScore = plays * 0.1 + likes * 1 + shares * 3 + comments * 2 + saves * 2.5;

    const isOriginalAudio = row["musicMeta.musicOriginal"] === "True" || row["musicMeta.musicOriginal"] === true;

    posts.push({
      id:            row["webVideoUrl"] || String(Math.random()),
      url:           row["webVideoUrl"] || "",
      timestamp:     ts,
      hour,
      dayOfWeek,
      dayName:       ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][dayOfWeek],
      isWeekend,
      type:          "Video", // TikTok is always video
      caption,
      captionLength,
      wordCount,
      hashtagCount,
      hashtags,
      plays,
      likes,
      shares,
      comments,
      saves,
      duration,
      isOriginalAudio,
      musicName:     row["musicMeta.musicName"]   || "",
      musicAuthor:   row["musicMeta.musicAuthor"] || "",
      ownerUsername: row["authorMeta.name"]        || "",
      engagementScore,
    });
  }

  posts.sort((a, b) => a.timestamp - b.timestamp);

  return {
    posts,
    stats: computeStats(posts),
  };
}

function avg(arr) {
  if (!arr.length) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function computeStats(posts) {
  if (!posts.length) return null;

  // ── By hour ─────────────────────────────────────────────
  const byHour = Array.from({ length: 24 }, (_, h) => {
    const p = posts.filter(x => x.hour === h);
    return { hour: h, count: p.length, avgEngagement: Math.round(avg(p.map(x => x.engagementScore))) };
  }).filter(x => x.count > 0);

  // ── By day ──────────────────────────────────────────────
  const byDay = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((name, i) => {
    const p = posts.filter(x => x.dayOfWeek === i);
    return { day: name, count: p.length, avgEngagement: Math.round(avg(p.map(x => x.engagementScore))) };
  }).filter(x => x.count > 0);

  // ── Video duration buckets ───────────────────────────────
  const durationBuckets = [
    { label: "0–15s",   min: 0,  max: 15  },
    { label: "15–30s",  min: 15, max: 30  },
    { label: "30–60s",  min: 30, max: 60  },
    { label: "60–90s",  min: 60, max: 90  },
    { label: "90s+",    min: 90, max: 9999 },
  ].map(b => {
    const p = posts.filter(x => x.duration >= b.min && x.duration < b.max);
    return { ...b, count: p.length, avgEngagement: Math.round(avg(p.map(x => x.engagementScore))) };
  }).filter(x => x.count > 0);

  // ── Hashtag count buckets ───────────────────────────────
  const hashtagBuckets = [
    { label: "0–3",   min: 0,  max: 3  },
    { label: "4–7",   min: 4,  max: 7  },
    { label: "8–12",  min: 8,  max: 12 },
    { label: "13–20", min: 13, max: 20 },
    { label: "21+",   min: 21, max: 99 },
  ].map(b => {
    const p = posts.filter(x => x.hashtagCount >= b.min && x.hashtagCount <= b.max);
    return { ...b, count: p.length, avgEngagement: Math.round(avg(p.map(x => x.engagementScore))) };
  }).filter(x => x.count > 0);

  // ── Original vs licensed audio ───────────────────────────
  const byAudio = [
    { label: "Original Audio", posts: posts.filter(p => p.isOriginalAudio) },
    { label: "Licensed Audio", posts: posts.filter(p => !p.isOriginalAudio) },
  ].filter(a => a.posts.length > 0).map(a => ({
    type: a.label,
    count: a.posts.length,
    avgEngagement: Math.round(avg(a.posts.map(p => p.engagementScore))),
  }));

  // ── Top hashtags ─────────────────────────────────────────
  const hashMap = {};
  for (const post of posts) {
    for (const tag of post.hashtags) {
      if (!hashMap[tag]) hashMap[tag] = { tag, total: 0, count: 0 };
      hashMap[tag].total += post.engagementScore;
      hashMap[tag].count++;
    }
  }
  const topHashtags = Object.values(hashMap)
    .filter(h => h.count >= 2)
    .map(h => ({ tag: h.tag, avgEngagement: Math.round(h.total / h.count), count: h.count }))
    .sort((a, b) => b.avgEngagement - a.avgEngagement)
    .slice(0, 12);

  // ── Best performers ──────────────────────────────────────
  const bestHour          = [...byHour].sort((a, b) => b.avgEngagement - a.avgEngagement)[0];
  const bestDay           = [...byDay].sort((a, b) => b.avgEngagement - a.avgEngagement)[0];
  const bestDuration      = durationBuckets.length ? [...durationBuckets].sort((a, b) => b.avgEngagement - a.avgEngagement)[0] : null;
  const bestHashtagBucket = hashtagBuckets.length  ? [...hashtagBuckets].sort((a, b) => b.avgEngagement - a.avgEngagement)[0]  : null;
  const bestAudio         = byAudio.length         ? [...byAudio].sort((a, b) => b.avgEngagement - a.avgEngagement)[0]         : null;

  // ── Normalised score per post ────────────────────────────
  const maxScore = Math.max(...posts.map(x => x.engagementScore), 1);
  const postsWithScore = posts.map(p => ({
    ...p,
    normalizedScore: Math.round((p.engagementScore / maxScore) * 100),
  }));

  // ── Totals ───────────────────────────────────────────────
  const totalPosts    = posts.length;
  const totalPlays    = posts.reduce((s, p) => s + p.plays,    0);
  const totalLikes    = posts.reduce((s, p) => s + p.likes,    0);
  const totalShares   = posts.reduce((s, p) => s + p.shares,   0);
  const totalComments = posts.reduce((s, p) => s + p.comments, 0);
  const totalSaves    = posts.reduce((s, p) => s + p.saves,    0);
  const avgPlays      = Math.round(avg(posts.map(p => p.plays)));
  const avgLikes      = Math.round(avg(posts.map(p => p.likes)));
  const avgEngagement = Math.round(avg(posts.map(p => p.engagementScore)));

  const topPosts = [...postsWithScore]
    .sort((a, b) => b.engagementScore - a.engagementScore)
    .slice(0, 5);

  return {
    totalPosts, totalPlays, totalLikes, totalShares, totalComments, totalSaves,
    avgPlays, avgLikes, avgEngagement,
    byHour, byDay, byAudio,
    durationBuckets, hashtagBuckets, topHashtags,
    bestHour, bestDay, bestDuration, bestHashtagBucket, bestAudio,
    postsWithScore, topPosts,
    accounts: [...new Set(posts.map(p => p.ownerUsername).filter(Boolean))],
    // byType shim so ChartsSection doesn't break (TikTok is always Video)
    byType: [{ type: "Video", count: totalPosts, avgEngagement }],
    bestType: { type: "Video", avgEngagement },
  };
}

export function formatNumber(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}

export function hourLabel(h) {
  const suffix = h < 12 ? "AM" : "PM";
  return `${h % 12 || 12}${suffix}`;
}
