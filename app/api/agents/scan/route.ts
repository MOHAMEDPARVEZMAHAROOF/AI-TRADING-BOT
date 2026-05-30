import { NextRequest, NextResponse } from "next/server";
import { getHistory, getQuotesBatch } from "@/lib/api/yahooFinance";
import { computeIndicatorSnapshot, scoreSnapshot } from "@/lib/analysis/snapshot";
import type { ScanResult } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/agents/scan  Body: { symbols: string[] }
 * Fetches quotes in parallel, runs a lightweight technical score on each, and
 * returns the top opportunities sorted by score.
 */
export async function POST(req: NextRequest) {
  let symbols: string[];
  try {
    const body = await req.json();
    symbols = Array.isArray(body.symbols) ? body.symbols.slice(0, 60) : [];
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!symbols.length) {
    return NextResponse.json({ error: "Provide 'symbols' array" }, { status: 400 });
  }

  const quotes = await getQuotesBatch(symbols);

  const scanned: ScanResult[] = await Promise.all(
    quotes.map(async (q) => {
      let score = 50;
      let reason = "quote-only";
      try {
        const candles = await getHistory(q.symbol, "3m", "1d");
        if (candles.length > 30) {
          const snap = computeIndicatorSnapshot(candles);
          const res = scoreSnapshot(snap, q.price, q.changePercent);
          score = res.score;
          reason = res.reason;
        }
      } catch {
        // keep quote-only neutral score
      }
      return {
        symbol: q.symbol,
        price: q.price,
        changePercent: q.changePercent,
        volume: q.volume,
        score,
        signalStrength: score,
        flagged: score >= 72,
        reason,
      };
    })
  );

  scanned.sort((a, b) => b.score - a.score);

  return NextResponse.json({
    scanned,
    top: scanned.slice(0, 5),
    scannedCount: scanned.length,
  });
}
