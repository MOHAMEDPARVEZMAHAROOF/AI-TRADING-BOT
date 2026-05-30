import "server-only";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "./rateLimit";

const WRITE_LIMIT = 120;
const WRITE_WINDOW_MS = 60_000;

export type AuthResult =
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse };

/**
 * Require an authenticated Supabase user for protected API routes.
 */
export async function requireApiUser(req: Request): Promise<AuthResult> {
  const ip = clientIp(req);
  const rl = rateLimit(`api:${ip}`, WRITE_LIMIT, WRITE_WINDOW_MS);
  if (!rl.ok) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Too many requests. Please slow down." },
        {
          status: 429,
          headers: { "Retry-After": String(rl.retryAfterSec) },
        }
      ),
    };
  }

  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host && !originHost.endsWith(`.${host}`)) {
        return {
          ok: false,
          response: NextResponse.json({ error: "Invalid origin" }, { status: 403 }),
        };
      }
    } catch {
      return {
        ok: false,
        response: NextResponse.json({ error: "Invalid origin" }, { status: 403 }),
      };
    }
  }

  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { ok: true, userId: user.id };
}

/** Sanitize symbol strings for Yahoo Finance API. */
export function sanitizeSymbol(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim().toUpperCase();
  if (!/^[A-Z0-9.\-=]{1,24}$/.test(s)) return null;
  return s;
}

export function sanitizeSymbols(raw: unknown, max = 60): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const sym = sanitizeSymbol(item);
    if (sym && !out.includes(sym)) out.push(sym);
    if (out.length >= max) break;
  }
  return out;
}
