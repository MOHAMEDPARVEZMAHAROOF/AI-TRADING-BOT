import type { LiveBotMarket, LiveBotState } from "@/lib/types";

export async function fetchLiveBotStatus(market: LiveBotMarket): Promise<LiveBotState | null> {
  const res = await fetch(`/api/bots/${market}/status`, { credentials: "include" });
  if (!res.ok) return null;
  const data = await res.json();
  return data.bot as LiveBotState;
}

export async function startLiveBot(market: LiveBotMarket): Promise<LiveBotState | null> {
  const res = await fetch(`/api/bots/${market}/start`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = (err as { error?: string }).error ?? "Failed to start bot";
    if (res.status === 500 && msg.toLowerCase().includes("live_bots")) {
      throw new Error(
        "Cloud persistence unavailable. Apply supabase/migrations/20260530120000_live_bots.sql, then retry."
      );
    }
    throw new Error(msg);
  }
  const data = await res.json();
  return data.bot as LiveBotState;
}

export async function stopLiveBot(market: LiveBotMarket): Promise<LiveBotState | null> {
  const res = await fetch(`/api/bots/${market}/stop`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Failed to stop bot");
  }
  const data = await res.json();
  return data.bot as LiveBotState;
}

/** Poll server state — bot keeps running server-side when tab is closed. */
export function subscribeLiveBotSync(
  market: LiveBotMarket,
  onUpdate: (bot: LiveBotState) => void,
  intervalMs = 12_000
): () => void {
  const tick = async () => {
    const bot = await fetchLiveBotStatus(market);
    if (bot) onUpdate(bot);
  };
  void tick();
  const id = setInterval(tick, intervalMs);
  return () => clearInterval(id);
}
