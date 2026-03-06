/**
 * Parse and process Instagram scraper CSV data.
 * Extracts only the columns we need, computes derived fields,
 * and returns a clean array of post objects + aggregate stats.
 */

export function processCSV(rawRows) {
  const posts = [];

  for (const row of rawRows) {
    // Skip rows with no timestamp or engagement
    if (!row.timestamp) continue;

    const ts = new Date(row.timestamp);
    if (isNaN(ts)) continue;

    const likes      = parseFloat(row.likesCount)      || 0;
    const views      = parseFloat(row.videoViewCount)  || 0;
    const plays      = parseFloat(row.videoPlayCount)  || 0;
    const comments   = parseFloat(row.commentsCount)   || 0;
    const duration   = parseFloat(row.videoDuration)   || 0;
    const caption    = (row.caption || "").trim();
    const type       = (row.type || row.productType || "Image").trim();

    // Count hashtags across hashtags/0 … hashtags/23 columns
    let hashtagCount = 0;
    for (let i = 0; i <= 23; i++) {
      if (row[`hashtags/${i}`] && row[`hashtags/${i}`] !== "") hashtagCount++;
    }

    // Collect hashtag strings
    const hashtags = [];
    for (let i = 0; i <= 23; i++) {
      const h = row[`hashtags/${i}`];
      if (h && h !== "") hashtags.push(h.toLowerCase().replace(/^#/, ""));
    }

    const captionLength = caption.length;
    const wordCount     = caption ? caption.split(/\s+/).filter(Boolean).length : 0;
    const hour          = ts.getHours();
    const dayOfWeek     = ts.getDay(); // 0=Sun … 6=Sat
    const isWeekend     = dayOfWeek === 0 || dayOfWeek === 6 ? 1 : 0;

    // Engagement score: weighted combo of likes, views, comments
    const engagementScore = likes + views * 0.3 + plays * 0.2 + comments * 2;

    posts.push({
      id:             row.id || row.shortCode || String(Math.random()),
      shortCode:      row.shortCode || "",
      url:            row.url || "",
      timestamp:      ts,
      hour,
      dayOfWeek,
      dayName:        ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][dayOfWeek],
      isWeekend,
      type:           normalizeType(type),
      caption,
      captionLength,
      wordCount,
      hashtagCount,
      hashtags,
      likes,
      views,
      plays,
      comments,
      duration,
      engagementScore,
      ownerUsername:  row.ownerUsername || "",
    });
  }

  // Sort chronologically
  posts.sort((a, b) => a.timestamp - b.timestamp);

  return {
    posts,
    stats: computeStats(posts),
  };
}

function normalizeType(t) {
  const lower = (t || "").toLowerCase();
  if (lower.includes("video") || lower.includes("clip") || lower.includes("reel")) return "Video";
  if (lower.includes("sidecar") || lower.includes("carousel") || lower.includes("album")) return "Carousel";
  return "Image";
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

  // ── By type ─────────────────────────────────────────────
  const types = [...new Set(posts.map(x => x.type))];
  const byType = types.map(type => {
    const p = posts.filter(x => x.type === type);
    return { type, count: p.length, avgEngagement: Math.round(avg(p.map(x => x.engagementScore))) };
  });

  // ── Video duration buckets ───────────────────────────────
  const videos = posts.filter(x => x.type === "Video" && x.duration > 0);
  const durationBuckets = [
    { label: "0–15s",   min: 0,  max: 15  },
    { label: "15–30s",  min: 15, max: 30  },
    { label: "30–60s",  min: 30, max: 60  },
    { label: "60–90s",  min: 60, max: 90  },
    { label: "90s+",    min: 90, max: 9999 },
  ].map(b => {
    const p = videos.filter(x => x.duration >= b.min && x.duration < b.max);
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

  // ── Top hashtags by avg engagement ──────────────────────
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

  // ── Best hour / day / type ───────────────────────────────
  const bestHour = [...byHour].sort((a, b) => b.avgEngagement - a.avgEngagement)[0];
  const bestDay  = [...byDay].sort((a, b) => b.avgEngagement - a.avgEngagement)[0];
  const bestType = [...byType].sort((a, b) => b.avgEngagement - a.avgEngagement)[0];
  const bestDuration = durationBuckets.length
    ? [...durationBuckets].sort((a, b) => b.avgEngagement - a.avgEngagement)[0]
    : null;
  const bestHashtagBucket = hashtagBuckets.length
    ? [...hashtagBuckets].sort((a, b) => b.avgEngagement - a.avgEngagement)[0]
    : null;

  // ── Per-row normalised score 0–100 ──────────────────────
  const maxScore = Math.max(...posts.map(x => x.engagementScore), 1);
  const postsWithScore = posts.map(p => ({
    ...p,
    normalizedScore: Math.round((p.engagementScore / maxScore) * 100),
  }));

  // ── Totals ──────────────────────────────────────────────
  const totalPosts    = posts.length;
  const totalLikes    = posts.reduce((s, p) => s + p.likes, 0);
  const totalViews    = posts.reduce((s, p) => s + p.views, 0);
  const totalComments = posts.reduce((s, p) => s + p.comments, 0);
  const avgLikes      = Math.round(avg(posts.map(p => p.likes)));
  const avgViews      = Math.round(avg(posts.map(p => p.views)));
  const avgEngagement = Math.round(avg(posts.map(p => p.engagementScore)));

  // Top 5 posts
  const topPosts = [...postsWithScore]
    .sort((a, b) => b.engagementScore - a.engagementScore)
    .slice(0, 5);

  return {
    totalPosts, totalLikes, totalViews, totalComments,
    avgLikes, avgViews, avgEngagement,
    byHour, byDay, byType,
    durationBuckets, hashtagBuckets, topHashtags,
    bestHour, bestDay, bestType, bestDuration, bestHashtagBucket,
    postsWithScore, topPosts,
    accounts: [...new Set(posts.map(p => p.ownerUsername).filter(Boolean))],
  };
}

export function formatNumber(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}

export function hourLabel(h) {
  const suffix = h < 12 ? "AM" : "PM";
  const display = h % 12 || 12;
  return `${display}${suffix}`;
}
