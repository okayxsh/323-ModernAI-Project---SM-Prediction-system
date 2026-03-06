# Pulse · Internal Instagram Analytics

Internal-only tool for analysing Instagram scraper CSV exports using AI.

## Setup

```bash
npm install
npm run dev
# → http://localhost:3000
```

## Environment Variables

Create `.env.local` in the project root (already included, **never commit this**):

```
OPENROUTER_API_KEY=your_key_here
```

Get a free key at https://openrouter.ai — no credit card needed.

## What it does

1. **Upload any Instagram scraper CSV** (Apify, Phantombuster, etc.)
2. **Auto-computes** engagement scores for every post
3. **Charts** best hours, days, video durations, hashtag counts
4. **AI Strategy Report** via Llama 3.3 70B (free) — gives specific, data-backed recommendations

## Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

Then add `OPENROUTER_API_KEY` in Vercel → Settings → Environment Variables.

## Security

- `.env.local` is in `.gitignore` — API key never goes to GitHub
- Add Vercel Password Protection for internal-only access
- No user data is stored — all processing is in-session
