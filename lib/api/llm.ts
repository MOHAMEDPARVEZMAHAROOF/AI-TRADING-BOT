import "server-only";

/**
 * LLM client backed by Groq's OpenAI-compatible API.
 * Used for all AI analysis and autonomous agent decisions.
 */
export const LLM_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
export const LLM_PROVIDER = "groq";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export function isLLMConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY);
}

interface ChatOpts {
  stream?: boolean;
  json?: boolean;
  maxTokens?: number;
  temperature?: number;
  system?: string;
}

/**
 * Low-level call returning the raw fetch Response (so callers can stream).
 */
export async function groqChat(prompt: string, opts: ChatOpts = {}): Promise<Response> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY is not configured");

  const messages: { role: string; content: string }[] = [];
  if (opts.system) messages.push({ role: "system", content: opts.system });
  messages.push({ role: "user", content: prompt });

  return fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages,
      temperature: opts.temperature ?? 0.4,
      max_tokens: opts.maxTokens ?? 1200,
      stream: opts.stream ?? false,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
}

/**
 * Non-streaming completion. Returns the assistant message text.
 */
export async function groqComplete(prompt: string, opts: ChatOpts = {}): Promise<string> {
  const res = await groqChat(prompt, { ...opts, stream: false });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Groq API error ${res.status}: ${detail.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

/**
 * Streams a Groq completion as a ReadableStream of decoded text chunks
 * (assistant content deltas), parsing the OpenAI-style SSE protocol.
 */
export async function groqStreamText(prompt: string, opts: ChatOpts = {}): Promise<ReadableStream<Uint8Array>> {
  const res = await groqChat(prompt, { ...opts, stream: true });
  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Groq API error ${res.status}: ${detail.slice(0, 200)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]") {
          controller.close();
          return;
        }
        try {
          const json = JSON.parse(payload);
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) controller.enqueue(encoder.encode(delta));
        } catch {
          // ignore keep-alive / partial lines
        }
      }
    },
    cancel() {
      reader.cancel().catch(() => {});
    },
  });
}

/**
 * Extract a JSON object from a model response that may contain prose or code fences.
 */
export function extractJSON<T>(text: string): T | null {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}
