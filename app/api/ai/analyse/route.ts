import { NextRequest } from "next/server";
import { CLAUDE_MODEL, getAnthropicClient, isAnthropicConfigured } from "@/lib/api/anthropic";
import { buildAnalysisPrompt, localFallbackSignal } from "@/lib/analysis/aiAnalysis";
import { gatherAnalysis } from "@/lib/analysis/gather";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/ai/analyse  Body: { symbol }
 * Streams Claude's JSON analysis back as plain text for a live typing effect.
 * Falls back to a deterministic locally-computed signal if Claude is unavailable.
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

  if (!isAnthropicConfigured()) {
    const fallback = localFallbackSignal(input);
    const text = JSON.stringify(fallback, null, 2);
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(text));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "X-AI-Source": "local-fallback" },
    });
  }

  const prompt = buildAnalysisPrompt(input);

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const client = getAnthropicClient();
        const messageStream = client.messages.stream({
          model: CLAUDE_MODEL,
          max_tokens: 1200,
          messages: [{ role: "user", content: prompt }],
        });
        for await (const event of messageStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        // Stream the local fallback so the UI still resolves.
        const fallback = localFallbackSignal(input);
        controller.enqueue(encoder.encode(JSON.stringify(fallback, null, 2)));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-AI-Source": "claude" },
  });
}
