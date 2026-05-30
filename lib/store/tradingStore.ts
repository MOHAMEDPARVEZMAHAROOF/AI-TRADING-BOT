import { create } from "zustand";
import type { AISignal, IndicatorSnapshot, OHLCV, PatternResult, StockQuote } from "@/lib/types";

interface TradingState {
  symbol: string | null;
  quote: StockQuote | null;
  candles: OHLCV[];
  range: string;
  indicators: IndicatorSnapshot | null;
  patterns: PatternResult[];
  signal: AISignal | null;
  loadingQuote: boolean;
  loadingChart: boolean;
  analysing: boolean;
  analysisError: string | null;

  setSymbol: (symbol: string | null) => void;
  setQuote: (q: StockQuote | null) => void;
  setCandles: (c: OHLCV[]) => void;
  setRange: (r: string) => void;
  setIndicators: (i: IndicatorSnapshot | null) => void;
  setPatterns: (p: PatternResult[]) => void;
  setSignal: (s: AISignal | null) => void;
  setLoadingQuote: (b: boolean) => void;
  setLoadingChart: (b: boolean) => void;
  setAnalysing: (b: boolean) => void;
  setAnalysisError: (e: string | null) => void;
  resetAnalysis: () => void;
}

export const useTradingStore = create<TradingState>((set) => ({
  symbol: null,
  quote: null,
  candles: [],
  range: "6m",
  indicators: null,
  patterns: [],
  signal: null,
  loadingQuote: false,
  loadingChart: false,
  analysing: false,
  analysisError: null,

  setSymbol: (symbol) => set({ symbol }),
  setQuote: (quote) => set({ quote }),
  setCandles: (candles) => set({ candles }),
  setRange: (range) => set({ range }),
  setIndicators: (indicators) => set({ indicators }),
  setPatterns: (patterns) => set({ patterns }),
  setSignal: (signal) => set({ signal }),
  setLoadingQuote: (loadingQuote) => set({ loadingQuote }),
  setLoadingChart: (loadingChart) => set({ loadingChart }),
  setAnalysing: (analysing) => set({ analysing }),
  setAnalysisError: (analysisError) => set({ analysisError }),
  resetAnalysis: () => set({ signal: null, analysisError: null }),
}));
