export const STARTING_BALANCE = 100_000;

export const INTL_WATCHLIST = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA", "TSLA", "AMD",
  "NFLX", "BABA", "JPM", "V", "MA", "PYPL", "COIN",
  "PLTR", "RBLX", "SNAP", "UBER", "LYFT", "ABNB", "DASH",
];

export const INDIA_WATCHLIST = [
  "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS",
  "HINDUNILVR.NS", "SBIN.NS", "BHARTIARTL.NS", "KOTAKBANK.NS", "ITC.NS",
  "AXISBANK.NS", "BAJFINANCE.NS", "WIPRO.NS", "HCLTECH.NS", "TATAMOTORS.NS",
  "ADANIENT.NS", "MARUTI.NS", "SUNPHARMA.NS", "TITAN.NS", "ASIANPAINT.NS",
];

export const FULL_WATCHLIST = [...INTL_WATCHLIST, ...INDIA_WATCHLIST];

// Curated, fast-loading basket shown on the trading page markets panel.
export const MARKETS_US = [
  "AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA", "AMD",
  "NFLX", "JPM", "V", "COIN", "PLTR", "UBER",
];
export const MARKETS_INDIA = [
  "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS",
  "SBIN.NS", "BHARTIARTL.NS", "ITC.NS", "TATAMOTORS.NS", "MARUTI.NS",
  "SUNPHARMA.NS", "TITAN.NS",
];
export const MARKETS_WATCHLIST = [...MARKETS_US, ...MARKETS_INDIA];

// Risk-management thresholds for the autonomous trader.
export const RISK = {
  maxSinglePositionPct: 0.2, // max 20% of portfolio in one stock
  dailyLossLimitPct: 0.05, // stop trading after -5% day
  maxOpenPositions: 8,
  minAIConfidence: 80,
  minTechnicalScore: 75,
  positionSizePct: 0.08, // deploy ~8% of equity per auto trade
};

export const POPULAR_SYMBOLS = [
  "AAPL", "TSLA", "NVDA", "MSFT", "GOOGL", "AMZN", "META",
  "RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS",
];
