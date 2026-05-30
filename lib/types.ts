export interface OHLCV {
  date: string; // ISO date
  time: number; // unix seconds (for lightweight-charts)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockQuote {
  symbol: string;
  shortName: string;
  longName?: string;
  exchange: string;
  currency: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  dayHigh?: number;
  dayLow?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  pe?: number;
  eps?: number;
}

export interface SearchResult {
  symbol: string;
  shortname: string;
  exchDisp: string;
  typeDisp: string;
  flag: string;
}

export interface VolumeAnalysis {
  trend: "increasing" | "decreasing" | "stable";
  avgVolume: number;
  latestVolume: number;
  relativeVolume: number; // latest / avg
  spike: boolean;
}

export interface PatternResult {
  pattern: string;
  type: "bullish" | "bearish" | "neutral";
  confidence: number; // 0-100
  description: string;
  candleIndex: number;
}

export interface IndicatorSnapshot {
  rsi: number;
  macd: number;
  macdSignal: number;
  macdHistogram: number;
  sma20: number;
  sma50: number;
  sma200: number;
  ema9: number;
  bbUpper: number;
  bbMiddle: number;
  bbLower: number;
  atr: number;
  supports: number[];
  resistances: number[];
  volume: VolumeAnalysis;
}

export interface AISignal {
  signal: "BUY" | "SELL" | "HOLD" | "WATCH";
  confidence: number;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  riskRewardRatio: number;
  timeframe: string;
  keyReason: string;
  bullishFactors: string[];
  bearishFactors: string[];
  patternExplanation: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  marketContext: string;
  suggestedAction: string;
}

export interface Holding {
  symbol: string;
  companyName: string;
  exchange: string;
  currency: string;
  quantity: number;
  avgEntry: number;
  currentPrice: number;
  targetPrice?: number;
  stopLoss?: number;
  aiSignal?: string;
  source: "manual" | "auto";
  openedAt: number;
}

export interface Trade {
  id: string;
  symbol: string;
  companyName: string;
  exchange: string;
  currency: string;
  type: "BUY" | "SELL_SHORT";
  quantity: number;
  entryPrice: number;
  targetPrice?: number;
  stopLoss?: number;
  entryTime: number;
  exitTime?: number;
  exitPrice?: number;
  status: "OPEN" | "CLOSED" | "TARGET_HIT" | "STOP_HIT";
  pnl?: number;
  pnlPercent?: number;
  pattern?: string;
  source: "manual" | "auto";
  aiConfidence?: number;
}

export type AgentType =
  | "scanner"
  | "analysis"
  | "strategy"
  | "risk"
  | "execution"
  | "portfolio";

export type AgentStatus =
  | "IDLE"
  | "SCANNING"
  | "ANALYSING"
  | "DECIDING"
  | "EXECUTING"
  | "MONITORING";

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  currentTask: string;
  tradesAttributed: number;
}

export interface ActivityEntry {
  id: string;
  timestamp: number;
  agentName: string;
  agentType: AgentType;
  action: string;
  symbol?: string;
  category: "scan" | "analysis" | "decision" | "trade" | "alert";
  detail?: string;
}

export interface ScanResult {
  symbol: string;
  price: number;
  changePercent: number;
  volume: number;
  score: number;
  signalStrength: number; // 0-100
  flagged: boolean;
  reason: string;
}

export interface NotificationItem {
  id: string;
  timestamp: number;
  title: string;
  message: string;
  type: "price-alert" | "trade" | "agent" | "info";
}
