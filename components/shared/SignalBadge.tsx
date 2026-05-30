"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Signal = "BUY" | "SELL" | "HOLD" | "WATCH" | string;

const STYLES: Record<string, string> = {
  BUY: "bg-profit/15 text-profit border-profit/40 shadow-[0_0_20px_rgba(0,255,136,0.25)]",
  SELL: "bg-loss/15 text-loss border-loss/40 shadow-[0_0_20px_rgba(255,68,102,0.25)]",
  HOLD: "bg-gold-primary/15 text-gold-primary border-gold-primary/40 shadow-[0_0_20px_rgba(255,215,0,0.2)]",
  WATCH: "bg-info/15 text-info border-info/40 shadow-[0_0_20px_rgba(68,136,255,0.2)]",
};

export function SignalBadge({
  signal,
  size = "md",
  animate = true,
}: {
  signal: Signal;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
}) {
  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-5 py-2 text-lg",
  };
  const Comp = animate ? motion.span : "span";
  const props = animate
    ? {
        initial: { scale: 0.7, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: { type: "spring" as const, damping: 14, stiffness: 260 },
      }
    : {};
  return (
    <Comp
      {...props}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-bold uppercase tracking-wide",
        STYLES[signal] ?? STYLES.HOLD,
        sizes[size]
      )}
    >
      {signal}
    </Comp>
  );
}
