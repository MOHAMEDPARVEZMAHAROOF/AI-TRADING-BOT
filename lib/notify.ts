import type { EmailType } from "@/lib/email/templates";

/**
 * Fire-and-forget client helper that triggers a themed email notification via
 * the /api/notify route. Never throws — notifications are best-effort.
 */
export function notify(payload: { type: EmailType } & Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  fetch("/api/notify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {});
}
