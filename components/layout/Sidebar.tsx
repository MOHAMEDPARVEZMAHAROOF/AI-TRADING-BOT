"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Bot, Wallet, Menu, X, Sparkles, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/trading", label: "AI Trader", icon: LineChart, desc: "Manual assistant" },
  { href: "/autonomous", label: "Autonomous", icon: Bot, desc: "Agent network" },
  { href: "/portfolio", label: "Portfolio", icon: Wallet, desc: "Holdings & history" },
  { href: "/settings", label: "Settings", icon: Settings, desc: "Profile & alerts" },
];

function NavItems({ scope, onNavigate }: { scope: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1.5">
      {NAV.map((item) => {
        const active = pathname?.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-3 transition-colors",
              active ? "text-white" : "text-white/55 hover:bg-white/5 hover:text-white"
            )}
          >
            {active && (
              <motion.div
                // Unique per scope so the desktop & mobile menus don't share a
                // layout node (which caused the bar to fly in from below).
                layoutId={`nav-highlight-${scope}`}
                className="absolute inset-0 rounded-xl bg-gold-primary/10 ring-1 ring-gold-primary/15"
                transition={{ type: "spring", stiffness: 500, damping: 38, mass: 0.7 }}
              >
                <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-gold-primary shadow-gold-glow" />
              </motion.div>
            )}
            <span className="relative z-10 flex items-center gap-3">
              <Icon
                className={cn("h-5 w-5 shrink-0 transition-colors", active && "text-gold-primary")}
                strokeWidth={1.8}
              />
              <span>
                <span className="block text-sm font-medium">{item.label}</span>
                <span className="block truncate text-[11px] text-white/35">{item.desc}</span>
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBody({ scope, onNavigate }: { scope: string; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-2 p-5">
      <Link href="/trading" className="mb-6 flex items-center gap-3" onClick={onNavigate}>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-gold-primary to-gold-accent font-display text-xl font-bold text-bg-primary shadow-gold-glow">
          AT
        </div>
        <div>
          <div className="font-display text-lg font-bold leading-tight gold-text">Aurum</div>
          <div className="text-[11px] text-white/45">AI Trading Suite</div>
        </div>
      </Link>

      <NavItems scope={scope} onNavigate={onNavigate} />

      <div className="mt-auto">
        <div className="glass-card flex items-start gap-2 p-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-gold-primary" />
          <div className="text-[11px] leading-snug text-white/55">
            <span className="font-semibold text-gold-primary">Paper Trading</span> — practice with
            virtual capital. Not financial advice.
          </div>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-lg border border-gold-primary/20 bg-bg-secondary/80 p-2 backdrop-blur lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5 text-gold-primary" />
      </button>

      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[260px] border-r border-gold-primary/10 bg-bg-secondary/40 backdrop-blur-xl lg:block">
        <SidebarBody scope="desktop" />
      </aside>

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
              <SidebarBody scope="mobile" onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
