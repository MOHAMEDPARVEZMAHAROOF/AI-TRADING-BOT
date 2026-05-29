# Aurum — AI Trading Software

A full-stack, production-quality **AI trading platform** with two core modules, built with Next.js 14, TypeScript, Tailwind CSS, TradingView Lightweight Charts, Zustand, and the Anthropic Claude API. Real market data is sourced from Yahoo Finance.

> **DEMO MODE ONLY — no real money is ever used.** All trading is paper trading against a virtual `$100,000` balance persisted in your browser.

---

## Features

### 1. Manual AI Trading Assistant (`/trading`)
- Premium typeahead search across **international (AAPL, TSLA, …) and Indian (RELIANCE.NS, TCS.NS, …)** stocks with keyboard navigation.
- TradingView Lightweight candlestick / line / area chart with **SMA20, SMA50, EMA9 overlays**, a **volume** pane, **RSI(14)** and **MACD(12,26,9)** sub-charts, all time-synced.
- Time ranges: `1D, 5D, 1M, 3M, 6M, 1Y, 5Y`.
- Full technical engine implemented from scratch: **RSI, MACD, SMA, EMA, Bollinger Bands, ATR, support/resistance, volume analysis**.
- **Candlestick & chart pattern recognition** (Doji, Hammer, Engulfing, Morning/Evening Star, Three Soldiers/Crows, Golden/Death Cross, Double Top/Bottom, Breakouts…).
- **AI analysis panel** that streams Claude's reasoning live and renders a `BUY/SELL/HOLD/WATCH` signal card with confidence meter, entry/target/stop, risk:reward, bullish/bearish factors and pattern explanation. Chart is annotated with entry/target/stop price lines and signal markers.
- **Demo order panel** to execute trades into the persisted portfolio.

### 2. Autonomous Agentic AI Trader (`/autonomous`)
- A coordinated **multi-agent system** (Market Scanner → Technical Analyst → AI Strategist → Risk Manager → Execution → Portfolio Monitor) that autonomously scans a 40+ stock watchlist, scores opportunities, asks Claude for high-confidence setups, applies risk management, and executes demo trades.
- Live **agent status dashboard** with animated data-flow diagram, a **real-time activity feed** (filterable), a **market scanner grid**, and a **recent auto-trades** table.
- Hard risk limits: max 20% single-stock exposure, daily loss limit, max open positions, min AI confidence & technical score.

### 3. Portfolio (`/portfolio`)
- Animated summary cards (total value, today's P&L, all-time P&L %, win rate).
- Portfolio value line chart + asset allocation donut.
- Holdings table with live prices & one-click close, full trade history with **CSV export**, and a notifications panel.

---

## Tech Stack
Next.js 14 (App Router) · TypeScript · Tailwind CSS · TradingView `lightweight-charts` · `yahoo-finance2` · `@anthropic-ai/sdk` (Claude `claude-sonnet-4-20250514`) · Zustand (+persist) · Framer Motion · react-hot-toast · lucide-react.

---

## Getting Started

```bash
npm install
cp .env.local.example .env.local   # add your ANTHROPIC_API_KEY
npm run dev                         # http://localhost:3000
```

### Environment variables
| Variable | Required | Description |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | optional* | Enables real Claude analysis. |
| `ANTHROPIC_MODEL` | optional | Defaults to `claude-sonnet-4-20250514`. |

\* If no key is set, the app falls back to a **deterministic local technical-analysis engine** so every feature still works end-to-end (signals, agents, charts).

### Scripts
- `npm run dev` — development server
- `npm run build` / `npm run start` — production build & serve
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript check

---

## Architecture

```
app/
  trading/ autonomous/ portfolio/    # the three pages
  api/                               # serverless routes
    stock/{quote,history,search}     # Yahoo Finance (server-only)
    ai/{analyse,signal}              # Claude analysis (analyse streams)
    agents/{scan,trade}              # autonomous pipeline
components/{layout,trading,autonomous,portfolio,shared}
lib/
  analysis/   technicalIndicators · patternRecognition · snapshot · aiAnalysis
  agents/     agentOrchestrator + scan/analysis/risk/execution agents
  api/        yahooFinance (server) · anthropic (server) · client fetchers
  store/      portfolioStore (persisted) · agentStore · tradingStore
```

Yahoo Finance and Anthropic are only ever called from server-side API routes — keys and data fetching never run in the browser.

---

## Notes
- Stock data is cached server-side (30s quotes / 60s history) and the search input is debounced (300ms).
- This project is for **educational/demo purposes only** and is **not financial advice**.
