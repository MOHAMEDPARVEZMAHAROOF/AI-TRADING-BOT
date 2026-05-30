import type { LiveBotMarket } from "@/lib/types";

export function parseLiveBotMarket(raw: string): LiveBotMarket | null {
  if (raw === "crypto" || raw === "forex") return raw;
  return null;
}
