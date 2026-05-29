import { NextRequest, NextResponse } from "next/server";
import { CLAUDE_MODEL, extractJSON, getAnthropicClient, isAnthropicConfigured } from "@/lib/api/anthropic";
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

  if (!isAnthropicConfigured()) {
    return NextResponse.json({
      signal: localFallbackSignal(input),
      score: input.score,
      source: "local-fallback",
    });
  }

  try {
    const client = getAnthropicClient();
    const msg = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1000,
      messages: [{ role: "user", content: buildAgentDecisionPrompt(input, input.score) }],
    });
    const text = msg.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("");
    const parsed = extractJSON<AISignal>(text);
    return NextResponse.json({
      signal: parsed ?? localFallbackSignal(input),
      score: input.score,
      source: parsed ? "claude" : "local-fallback",
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
