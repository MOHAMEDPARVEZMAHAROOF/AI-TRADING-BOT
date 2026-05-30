import type { MarketRegion, MarketSessionEvent, MarketSessionStatus } from "@/lib/types";

const REGION_META: Record<
  MarketRegion,
  { label: string; scheduleLabel: string; timezone: string }
> = {
  india: {
    label: "Indian Markets (NSE/BSE)",
    scheduleLabel: "Mon–Fri 9:15 AM – 3:30 PM IST",
    timezone: "Asia/Kolkata",
  },
  us: {
    label: "US Markets (NYSE/NASDAQ)",
    scheduleLabel: "Mon–Fri 9:30 AM – 4:00 PM ET",
    timezone: "America/New_York",
  },
  crypto: {
    label: "Crypto Markets",
    scheduleLabel: "24 hours · 7 days a week",
    timezone: "UTC",
  },
  forex: {
    label: "Forex Markets",
    scheduleLabel: "Sun 5 PM – Fri 5 PM ET (24/5)",
    timezone: "America/New_York",
  },
};

function getParts(date: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return { day: dayMap[weekday.slice(0, 3)] ?? 0, minutes: hour * 60 + minute };
}

function isIndiaOpen(date: Date): boolean {
  const { day, minutes } = getParts(date, "Asia/Kolkata");
  if (day === 0 || day === 6) return false;
  const open = 9 * 60 + 15;
  const close = 15 * 60 + 30;
  return minutes >= open && minutes < close;
}

function isUsOpen(date: Date): boolean {
  const { day, minutes } = getParts(date, "America/New_York");
  if (day === 0 || day === 6) return false;
  const open = 9 * 60 + 30;
  const close = 16 * 60;
  return minutes >= open && minutes < close;
}

/** Crypto never closes. */
function isCryptoOpen(): boolean {
  return true;
}

/** Forex: closed Saturday and most of Sunday (ET). */
function isForexOpen(date: Date): boolean {
  const { day, minutes } = getParts(date, "America/New_York");
  if (day === 6) return false;
  if (day === 0) return minutes >= 17 * 60;
  if (day === 5) return minutes < 17 * 60;
  return true;
}

function isOpen(region: MarketRegion, date = new Date()): boolean {
  switch (region) {
    case "india":
      return isIndiaOpen(date);
    case "us":
      return isUsOpen(date);
    case "crypto":
      return isCryptoOpen();
    case "forex":
      return isForexOpen(date);
    default:
      return false;
  }
}

/** Sample next session boundary (within ~7 days) for countdown display. */
function nextChangeMs(region: MarketRegion, currentlyOpen: boolean, from = new Date()): number {
  for (let i = 0; i < 7 * 24 * 60; i += 15) {
    const t = new Date(from.getTime() + i * 60_000);
    if (isOpen(region, t) !== currentlyOpen) return t.getTime();
  }
  return from.getTime() + 3_600_000;
}

export function getMarketSessionStatus(
  region: MarketRegion,
  prevOpen?: boolean
): MarketSessionStatus {
  const meta = REGION_META[region];
  const open = isOpen(region);
  let event: MarketSessionEvent | null = null;
  if (prevOpen !== undefined && prevOpen !== open) {
    event = open ? "open" : "close";
  }
  return {
    region,
    label: meta.label,
    isOpen: open,
    event,
    nextChangeAt: nextChangeMs(region, open),
    scheduleLabel: meta.scheduleLabel,
    timezone: meta.timezone,
  };
}

export function getAllMarketStatuses(prev?: Record<MarketRegion, boolean>): MarketSessionStatus[] {
  const regions: MarketRegion[] = ["india", "us", "crypto", "forex"];
  return regions.map((r) => getMarketSessionStatus(r, prev?.[r]));
}

export function liveBotSchedule(market: "crypto" | "forex"): "24/7" | "24/5" {
  return market === "crypto" ? "24/7" : "24/5";
}

export function canLiveBotRun(market: "crypto" | "forex", date = new Date()): boolean {
  if (market === "crypto") return true;
  return isForexOpen(date);
}
