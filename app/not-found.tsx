import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="glass-card max-w-md p-8 text-center">
        <div className="font-display text-6xl font-bold gold-text">404</div>
        <h2 className="mt-2 font-display text-xl font-semibold text-white">Page not found</h2>
        <p className="mt-2 text-sm text-white/55">
          The page you are looking for doesn’t exist.
        </p>
        <Link
          href="/trading"
          className="mt-5 inline-block rounded-xl bg-gradient-to-r from-gold-primary to-gold-accent px-5 py-2.5 font-semibold text-bg-primary transition hover:shadow-gold-glow"
        >
          Back to AI Trader
        </Link>
      </div>
    </div>
  );
}
