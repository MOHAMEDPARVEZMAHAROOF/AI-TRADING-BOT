import { NextRequest, NextResponse } from "next/server";
import { extractJSON, groqComplete, isLLMConfigured } from "@/lib/api/llm";
import { buildAgentDecisionPrompt, localFallbackSignal } from "@/lib/analysis/aiAnalysis";
import { gatherAnalysis } from "@/lib/analysis/gather";
import type { AISignal } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/ai/signal  Body: { symbol }
 * Returns a non-streaming structured AISignal. Used by the autonomous agents.
 */
export async function POST(req: NextRequest) {
  let symbol: string;
  try {
    const body = await req.json();
    symbol = (body.symbol as string)?.toUpperCase();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!symbol) return NextResponse.json({ error: "Missing 'symbol'" }, { status: 400 });

  let input;
  try {
    input = await gatherAnalysis(symbol);
  } catch (err) {
    return NextResponse.json(
      { error: `Could not load data for ${symbol}`, detail: (err as Error).message },
      { status: 502 }
    );
  }

  if (!isLLMConfigured()) {
    return NextResponse.json({
      signal: localFallbackSignal(input),
      score: input.score,
      source: "local-fallback",
    });
  }

  try {
    const text = await groqComplete(buildAgentDecisionPrompt(input, input.score), {
      json: true,
      maxTokens: 900,
    });
    const parsed = extractJSON<AISignal>(text);
    return NextResponse.json({
      signal: parsed ?? localFallbackSignal(input),
      score: input.score,
      source: parsed ? "groq" : "local-fallback",
    });
  } catch (err) {
    return NextResponse.json({
      signal: localFallbackSignal(input),
      score: input.score,
      source: "local-fallback",
      detail: (err as Error).message,
    });
  }
}
