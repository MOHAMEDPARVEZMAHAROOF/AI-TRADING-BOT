import "server-only";
import { ACTIVEPIECES_WEBHOOK_URL } from "@/lib/config";

/**
 * Relay a pre-built email to the Activepieces Gmail flow. Best-effort.
 */
export async function relayEmail(
  to: string,
  subject: string,
  html: string,
  type: string
): Promise<boolean> {
  if (!ACTIVEPIECES_WEBHOOK_URL || !to) return false;
  try {
    const res = await fetch(ACTIVEPIECES_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, html, type }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
