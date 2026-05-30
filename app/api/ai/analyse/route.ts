import { NextRequest } from "next/server";
import { groqStreamText, isLLMConfigured } from "@/lib/api/llm";
import { buildAnalysisPrompt, localFallbackSignal } from "@/lib/analysis/aiAnalysis";
import { gatherAnalysis } from "@/lib/analysis/gather";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SYSTEM =
  "You are an expert quantitative trading analyst. Respond ONLY with a single valid JSON object matching the requested schema — no markdown, no prose.";

/**
 * POST /api/ai/analyse  Body: { symbol }
 * Streams the Groq model's JSON analysis back as plain text for a live typing
 * effect. Falls back to a deterministic locally-computed signal if Groq is
 * unavailable.
 */
export async function POST(req: NextRequest) {
  let symbol: string;
  try {
    const body = await req.json();
    symbol = (body.symbol as string)?.toUpperCase();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 });
  }
  if (!symbol) {
    return new Response(JSON.stringify({ error: "Missing 'symbol'" }), { status: 400 });
  }

  let input;
  try {
    input = await gatherAnalysis(symbol);
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Could not load market data for ${symbol}`, detail: (err as Error).message }),
      { status: 502 }
    );
  }

  const encoder = new TextEncoder();

  const streamFallback = () => {
    const text = JSON.stringify(localFallbackSignal(input), null, 2);
    return new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(text));
        controller.close();
      },
    });
  };

  if (!isLLMConfigured()) {
    return new Response(streamFallback(), {
      headers: { "Content-Type": "text/plain; charset=utf-8", "X-AI-Source": "local-fallback" },
    });
  }

  try {
    const stream = await groqStreamText(buildAnalysisPrompt(input), {
      system: SYSTEM,
      maxTokens: 1100,
    });
    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "X-AI-Source": "groq" },
    });
  } catch {
    return new Response(streamFallback(), {
      headers: { "Content-Type": "text/plain; charset=utf-8", "X-AI-Source": "local-fallback" },
    });
  }
}
