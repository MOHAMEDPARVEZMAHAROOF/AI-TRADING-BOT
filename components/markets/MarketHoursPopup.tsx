"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, TrendingUp, Globe2, Bitcoin, Banknote } from "lucide-react";
import type { MarketSessionStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const REGION_ICON = {
  india: Globe2,
  us: TrendingUp,
  crypto: Bitcoin,
  forex: Banknote,
} as const;

const REGION_GRADIENT = {
  india: "from-orange-500/30 via-amber-500/10 to-transparent",
  us: "from-blue-500/30 via-indigo-500/10 to-transparent",
  crypto: "from-violet-500/40 via-fuchsia-500/10 to-transparent",
  forex: "from-emerald-500/30 via-teal-500/10 to-transparent",
} as const;

export function MarketHoursPopup({
  session,
  onDismiss,
}: {
  session: MarketSessionStatus;
  onDismiss: () => void;
}) {
  const Icon = REGION_ICON[session.region];
  const isOpen = session.event === "open";

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
          onClick={onDismiss}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        <motion.div
          role="dialog"
          aria-labelledby="market-hours-title"
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gold-primary/25 bg-bg-secondary/95 shadow-2xl shadow-gold-primary/10"
          initial={{ scale: 0.85, y: 40, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
        >
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-80",
              REGION_GRADIENT[session.region]
            )}
          />
          <motion.div
            className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gold-primary/20 blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />

          <button
            onClick={onDismiss}
            className="absolute right-3 top-3 z-10 rounded-lg p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
            aria-label="Dismiss"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="relative p-8 text-center">
            <motion.div
              className={cn(
                "mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl ring-2",
                isOpen
                  ? "bg-profit/15 ring-profit/40 text-profit"
                  : "bg-white/5 ring-white/20 text-white/70"
              )}
              animate={isOpen ? { rotate: [0, -4, 4, 0] } : { scale: [1, 0.97, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.8 }}
            >
              <Icon className="h-10 w-10" strokeWidth={1.5} />
            </motion.div>

            <motion.p
              className={cn(
                "mb-2 text-xs font-bold uppercase tracking-[0.2em]",
                isOpen ? "text-profit" : "text-loss"
              )}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              {isOpen ? "Market Open" : "Market Closed"}
            </motion.p>

            <h2
              id="market-hours-title"
              className="font-display text-2xl font-bold text-white"
            >
              {session.label}
            </h2>

            <p className="mt-2 text-sm text-white/55">{session.scheduleLabel}</p>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-white/40">
              <Clock className="h-3.5 w-3.5" />
              <span>
                {session.isOpen ? "Trading active" : "Trading paused"} ·{" "}
                {session.timezone.replace("_", " ")}
              </span>
            </div>

            <motion.button
              onClick={onDismiss}
              className="mt-8 w-full rounded-xl bg-gradient-to-r from-gold-primary to-gold-accent py-3 text-sm font-semibold text-bg-primary shadow-gold-glow"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Continue
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
