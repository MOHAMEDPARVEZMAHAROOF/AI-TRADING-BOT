import { NextRequest, NextResponse } from "next/server";
import { extractJSON, groqComplete, isLLMConfigured } from "@/lib/api/llm";
import { buildAgentDecisionPrompt, localFallbackSignal } from "@/lib/analysis/aiAnalysis";
import { gatherAnalysis } from "@/lib/analysis/gather";
import type { AISignal } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/agents/trade  Body: { symbol }
 * Runs the full agent pipeline (analysis -> AI strategy decision) for one symbol
 * and returns the decision. Actual demo execution + risk checks happen client-side
 * in the orchestrator so portfolio state stays in localStorage.
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

  const topPattern = input.patterns[0]?.pattern;

  if (!isLLMConfigured()) {
    return NextResponse.json({
      symbol,
      quote: input.quote,
      score: input.score,
      pattern: topPattern,
      signal: localFallbackSignal(input),
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
      symbol,
      quote: input.quote,
      score: input.score,
      pattern: topPattern,
      signal: parsed ?? localFallbackSignal(input),
      source: parsed ? "groq" : "local-fallback",
    });
  } catch (err) {
    return NextResponse.json({
      symbol,
      quote: input.quote,
      score: input.score,
      pattern: topPattern,
      signal: localFallbackSignal(input),
      source: "local-fallback",
      detail: (err as Error).message,
    });
  }
}
