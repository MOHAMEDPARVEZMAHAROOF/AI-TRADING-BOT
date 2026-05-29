"use client";

import { Brain, AlertTriangle, RotateCw, Sparkles } from "lucide-react";
import type { AISignal, StockQuote } from "@/lib/types";
import { TradeSignalCard } from "./TradeSignalCard";
import { currencyForSymbol } from "@/lib/utils";

export function AIAnalysisPanel({
  quote,
  analysing,
  rawStream,
  signal,
  source,
  error,
  onRetry,
  onExecute,
}: {
  quote: StockQuote | null;
  analysing: boolean;
  rawStream: string;
  signal: AISignal | null;
  source: string;
  error: string | null;
  onRetry: () => void;
  onExecute: () => void;
}) {
  if (!quote) {
    return (
      <div className="glass-card flex h-full min-h-[300px] flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-primary/10">
          <Brain className="h-8 w-8 text-gold-primary" />
        </div>
        <h3 className="font-display text-lg font-semibold text-white">AI Analyst Ready</h3>
        <p className="mt-1 max-w-xs text-sm text-white/45">
          Search and select a stock to receive a live, AI-powered trading recommendation with
          entry, target, and stop-loss levels.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="glass-card flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-primary/10">
            <Sparkles className="h-5 w-5 text-gold-primary" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold text-white">AI Analysis</h3>
            <p className="text-xs text-white/45">
              {source === "groq" ? "Powered by Groq · Llama 3.3 70B" : source === "local-fallback" ? "Local technical engine" : "Quantitative analyst"}
            </p>
          </div>
        </div>
        {!analysing && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 rounded-lg border border-gold-primary/20 px-3 py-1.5 text-xs text-gold-primary transition hover:bg-gold-primary/10"
          >
            <RotateCw className="h-3.5 w-3.5" /> Re-run
          </button>
        )}
      </div>

      {analysing && !signal && <AnalysingState rawStream={rawStream} />}

      {error && (
        <div className="glass-card flex items-center gap-3 border-loss/30 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-loss" />
          <div className="flex-1">
            <p className="text-sm text-white/80">{error}</p>
            <button onClick={onRetry} className="mt-1 text-xs text-gold-primary underline">
              Retry analysis
            </button>
          </div>
        </div>
      )}

      {signal && (
        <TradeSignalCard
          signal={signal}
          currency={currencyForSymbol(quote.symbol)}
          onExecute={onExecute}
        />
      )}
    </div>
  );
}

function AnalysingState({ rawStream }: { rawStream: string }) {
  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex items-center gap-3">
        <NeuralPulse />
        <div>
          <div className="text-sm font-semibold text-white">AI Analysing…</div>
          <div className="text-xs text-white/45">Crunching indicators & patterns</div>
        </div>
      </div>
      {rawStream ? (
        <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg border border-white/5 bg-black/30 p-3 font-mono-data text-[11px] leading-relaxed text-gold-primary/80">
          {rawStream}
          <span className="animate-pulse">▋</span>
        </pre>
      ) : (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="shimmer h-4 rounded" style={{ width: `${90 - i * 12}%` }} />
          ))}
        </div>
      )}
    </div>
  );
}

function NeuralPulse() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" className="text-gold-primary">
      {[
        [8, 12],
        [8, 28],
        [20, 20],
        [32, 12],
        [32, 28],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="3" fill="currentColor">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.4s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
        </circle>
      ))}
      <g stroke="currentColor" strokeWidth="0.8" opacity="0.4">
        <line x1="8" y1="12" x2="20" y2="20" />
        <line x1="8" y1="28" x2="20" y2="20" />
        <line x1="20" y1="20" x2="32" y2="12" />
        <line x1="20" y1="20" x2="32" y2="28" />
      </g>
    </svg>
  );
}
