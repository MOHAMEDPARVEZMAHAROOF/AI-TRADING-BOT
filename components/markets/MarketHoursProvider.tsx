"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getAllMarketStatuses } from "@/lib/market/marketHours";
import type { MarketRegion, MarketSessionStatus } from "@/lib/types";
import { MarketHoursPopup } from "./MarketHoursPopup";

const CHECK_MS = 45_000;
const DISMISS_KEY = "aurum-market-dismiss";

function loadDismissed(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(DISMISS_KEY) ?? "{}") as Record<string, number>;
  } catch {
    return {};
  }
}

function saveDismissed(map: Record<string, number>) {
  localStorage.setItem(DISMISS_KEY, JSON.stringify(map));
}

export function MarketHoursProvider() {
  const prevOpen = useRef<Record<MarketRegion, boolean> | undefined>(undefined);
  const [popup, setPopup] = useState<MarketSessionStatus | null>(null);
  const queue = useRef<MarketSessionStatus[]>([]);

  const showNext = useCallback(() => {
    if (popup) return;
    const next = queue.current.shift();
    if (next) setPopup(next);
  }, [popup]);

  const check = useCallback(() => {
    const sessions = getAllMarketStatuses(prevOpen.current);
    const dismissed = loadDismissed();
    const now = Date.now();

    for (const s of sessions) {
      if (s.event) {
        const key = `${s.region}-${s.event}-${new Date().toDateString()}`;
        if (!dismissed[key] || dismissed[key] < now - 4 * 60 * 60 * 1000) {
          queue.current.push(s);
        }
      }
    }

    prevOpen.current = Object.fromEntries(
      sessions.map((s) => [s.region, s.isOpen])
    ) as Record<MarketRegion, boolean>;

    showNext();
  }, [showNext]);

  useEffect(() => {
    const sessions = getAllMarketStatuses();
    prevOpen.current = Object.fromEntries(
      sessions.map((s) => [s.region, s.isOpen])
    ) as Record<MarketRegion, boolean>;
    const id = setInterval(check, CHECK_MS);
    return () => clearInterval(id);
  }, [check]);

  const dismiss = () => {
    if (popup?.event) {
      const dismissed = loadDismissed();
      const key = `${popup.region}-${popup.event}-${new Date().toDateString()}`;
      dismissed[key] = Date.now();
      saveDismissed(dismissed);
    }
    setPopup(null);
    setTimeout(showNext, 400);
  };

  if (!popup) return null;
  return <MarketHoursPopup session={popup} onDismiss={dismiss} />;
}
