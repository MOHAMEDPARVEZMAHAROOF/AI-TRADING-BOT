# Aurum — AI Trading Software

A full-stack, production-quality **AI trading platform** built with Next.js 14, TypeScript and Tailwind CSS. It pairs real Yahoo Finance market data and Claude-powered analysis with **Supabase authentication** and **themed Gmail email notifications** (via Activepieces).

> **DEMO MODE ONLY — no real money is ever used.** All trading is paper trading against a virtual `$100,000` balance.

---

## Features

### Authentication (Supabase)
- Email/password **sign up & sign in** with a premium split-screen auth UI.
- Server-side session handling via `@supabase/ssr` + Next.js middleware that **guards every app route** and redirects unauthenticated users to `/login`.
- `profiles` table auto-created on signup (Postgres trigger), with RLS so users only see their own data.
- Users are **auto-confirmed** (DB trigger) so signup → login is instant. A ready-to-use demo account is provided: `demo@aurum.ai` / `demo123456` (or click **Use demo credentials**).
- **Settings** page to edit your name and toggle email notifications, plus a "send test email" button. A `trade_events` table records your notification history.

### Email notifications (Activepieces → Gmail)
- A published Activepieces flow (**webhook → Gmail Send**) relays beautifully **themed, brand-matched HTML emails**.
- Triggered on: **welcome** (signup), **trade executed**, **autonomous agent trade**, **🎯 target hit**, **⚠️ stop-loss hit**, and **position closed**.
- Emails are composed server-side in `lib/email/templates.ts` (dark + gold glassmorphism, inline-styled & email-client safe) and sent through `/api/notify`.

### 1. Manual AI Trading Assistant (`/trading`)
Typeahead search (international + Indian NSE/BSE), TradingView Lightweight candlestick/line/area chart with SMA/EMA overlays + volume + RSI + MACD panes, a from-scratch technical engine (RSI, MACD, SMA, EMA, Bollinger, ATR, S/R, volume), candlestick/chart pattern recognition, a **streaming** Claude analysis panel (BUY/SELL/HOLD/WATCH signal card), and a demo order panel.

### 2. Autonomous Agentic AI Trader (`/autonomous`)
A coordinated **multi-agent system** (Scanner → Analyst → Claude Strategist → Risk Manager → Execution → Portfolio Monitor) that scans a 40+ stock watchlist, scores opportunities, gets AI decisions, applies risk limits and auto-executes/auto-exits demo trades — with a live dashboard, activity feed, scanner grid and auto-trade table.

### 3. Portfolio (`/portfolio`)
Animated summary cards, portfolio value chart, allocation donut, live holdings with one-click close, full trade history with CSV export, and a notifications panel.

---

## Tech Stack
Next.js 14 (App Router) · TypeScript · Tailwind CSS · **Supabase** (`@supabase/ssr`) · **Activepieces** (Gmail) · TradingView `lightweight-charts` · `yahoo-finance2` · `@anthropic-ai/sdk` (Claude `claude-sonnet-4`) · Zustand (+persist) · Framer Motion · react-hot-toast · lucide-react.

---

## Getting Started

```bash
npm install
cp .env.local.example .env.local   # fill in values (sensible public defaults are baked in)
npm run dev                         # http://localhost:3000
```

### Environment variables
| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | recommended | Supabase project URL. A working default is baked in. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | recommended | Supabase publishable/anon key (default baked in). |
| `ACTIVEPIECES_WEBHOOK_URL` | recommended | Gmail flow webhook (default baked in). |
| `ANTHROPIC_API_KEY` | optional | Enables real Claude analysis (local fallback otherwise). |
| `ANTHROPIC_MODEL` | optional | Defaults to `claude-sonnet-4-20250514`. |
| `NEXT_PUBLIC_SITE_URL` | optional | Used for links in notification emails. |

> The public Supabase URL/key and the Activepieces webhook have safe defaults in `lib/config.ts`, so **the app works on a fresh deploy with zero env configuration**. Set `ANTHROPIC_API_KEY` to switch from the local technical-analysis engine to live Claude.

---

## Deploying to Vercel

The project is a standard Next.js app — Vercel auto-detects it. Either:

1. **Import the repo** at [vercel.com/new](https://vercel.com/new) → select this repository → Deploy. (Optionally add `ANTHROPIC_API_KEY`.)
2. **Or via CLI:** `vercel --prod` (requires `vercel login` / a `VERCEL_TOKEN`).

No env vars are required for a working deployment thanks to the baked-in public defaults.

---

## Architecture

```
app/
  (auth)/{login,signup}        # auth UI (split-screen)
  (app)/{trading,autonomous,portfolio,settings}   # guarded app shell
  auth/callback                # Supabase code exchange
  api/
    stock/{quote,history,search}   # Yahoo Finance (server-only)
    ai/{analyse,signal}            # Claude (analyse streams)
    agents/{scan,trade}            # autonomous pipeline
    notify                         # themed email relay → Activepieces
  middleware.ts                # session refresh + route guard
lib/
  supabase/{client,server,middleware}  # @supabase/ssr clients
  email/templates              # themed HTML email builder
  analysis/ · agents/ · store/ · api/
```

---

## Notes
- Yahoo Finance is called server-side with a browser User-Agent (datacenter IPs are otherwise 429-throttled).
- This project is for **educational/demo purposes only** and is **not financial advice**.
