interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/**
 * Simple in-memory rate limiter (per key, e.g. IP + route).
 * Suitable for serverless warm instances; resets on cold start.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; remaining: number; retryAfterSec: number } {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count++;
  const ok = bucket.count <= limit;
  const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  return { ok, remaining: Math.max(0, limit - bucket.count), retryAfterSec };
}

export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}
