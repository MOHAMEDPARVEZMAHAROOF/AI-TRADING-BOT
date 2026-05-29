"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Bot,
  Wallet,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/trading", label: "AI Trader", icon: LineChart, desc: "Manual assistant" },
  { href: "/autonomous", label: "Autonomous", icon: Bot, desc: "Agent network" },
  { href: "/portfolio", label: "Portfolio", icon: Wallet, desc: "Holdings & history" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const content = (
    <div className="flex h-full flex-col gap-2 p-5">
      <Link href="/trading" className="mb-6 flex items-center gap-3" onClick={() => setMobileOpen(false)}>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-gold-primary to-gold-accent font-display text-xl font-bold text-bg-primary shadow-gold-glow">
          AT
        </div>
        <div>
          <div className="font-display text-lg font-bold leading-tight gold-text">Aurum</div>
          <div className="text-[11px] text-white/45">AI Trading Suite</div>
        </div>
      </Link>

      <nav className="flex flex-col gap-1.5">
        {NAV.map((item) => {
          const active = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-3 transition-all",
                active
                  ? "bg-gold-primary/10 text-white"
                  : "text-white/55 hover:bg-white/5 hover:text-white"
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r bg-gold-primary shadow-gold-glow"
                />
              )}
              <Icon
                className={cn("h-5 w-5 shrink-0", active ? "text-gold-primary" : "")}
                strokeWidth={1.8}
              />
              <div className="min-w-0">
                <div className="text-sm font-medium">{item.label}</div>
                <div className="truncate text-[11px] text-white/35">{item.desc}</div>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <div className="glass-card flex items-start gap-2 p-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-gold-primary" />
          <div className="text-[11px] leading-snug text-white/55">
            <span className="font-semibold text-gold-primary">DEMO MODE</span> — paper trading
            only. No real money is used.
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-lg border border-gold-primary/20 bg-bg-secondary/80 p-2 backdrop-blur lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5 text-gold-primary" />
      </button>

      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[260px] border-r border-gold-primary/10 bg-bg-secondary/40 backdrop-blur-xl lg:block">
        {content}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 26, stiffness: 240 }}
              className="fixed left-0 top-0 z-50 h-screen w-[260px] border-r border-gold-primary/10 bg-bg-secondary/95 backdrop-blur-xl lg:hidden"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-3 rounded-lg p-2 text-white/60 hover:text-white"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
