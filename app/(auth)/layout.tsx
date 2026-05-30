import Link from "next/link";
import { Sparkles, TrendingUp, Bot, ShieldCheck } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-gold-primary/15 bg-white/[0.02] shadow-card backdrop-blur-xl lg:grid-cols-2">
        {/* Brand / marketing side */}
        <div className="relative hidden flex-col justify-between border-r border-gold-primary/10 p-10 lg:flex">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-gold-primary/10 blur-3xl" />
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gold-primary to-gold-accent font-display text-xl font-bold text-bg-primary shadow-gold-glow">
              AT
            </div>
            <div>
              <div className="font-display text-2xl font-bold gold-text">Aurum</div>
              <div className="text-xs text-white/45">AI Trading Suite</div>
            </div>
          </Link>

          <div className="space-y-6">
            <h2 className="font-display text-3xl font-bold leading-tight text-white">
              Trade smarter with <span className="gold-text">AI on your side.</span>
            </h2>
            <ul className="space-y-4">
              <Feature icon={<TrendingUp className="h-5 w-5" />} title="AI Trading Assistant" desc="Live charts, technical analysis & Claude-powered buy/sell calls." />
              <Feature icon={<Bot className="h-5 w-5" />} title="Autonomous Agents" desc="A multi-agent system that scans, decides & trades on its own." />
              <Feature icon={<ShieldCheck className="h-5 w-5" />} title="Risk-Managed" desc="Practice with $100,000 virtual capital — zero real risk." />
            </ul>
          </div>

          <p className="flex items-center gap-2 text-xs text-white/40">
            <Sparkles className="h-3.5 w-3.5 text-gold-primary" />
            Paper-trading platform · Not financial advice.
          </p>
        </div>

        {/* Form side */}
        <div className="p-8 sm:p-10">{children}</div>
      </div>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-primary/10 text-gold-primary">
        {icon}
      </span>
      <div>
        <div className="font-semibold text-white">{title}</div>
        <div className="text-sm text-white/50">{desc}</div>
      </div>
    </li>
  );
}
