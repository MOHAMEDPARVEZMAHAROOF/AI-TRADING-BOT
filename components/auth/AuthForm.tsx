"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { Mail, Lock, User, Loader2, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirect") || "/trading";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const isSignup = mode === "signup";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    const supabase = createClient();

    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (error) throw error;

        // Auto-confirm is enabled server-side, so sign in immediately.
        if (!data.session) {
          const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
          if (signInErr) throw signInErr;
        }

        // Fire a themed welcome email (best-effort).
        fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "welcome", to: email, name: name || email }),
        }).catch(() => {});

        toast.success("Welcome to Aurum! 🎉");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
      }

      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail("demo@aurum.ai");
    setPassword("demo123456");
  };

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="mb-8 lg:hidden">
        <div className="font-display text-2xl font-bold gold-text">Aurum</div>
        <div className="text-xs text-white/45">AI Trading Suite</div>
      </div>

      <h1 className="font-display text-2xl font-bold text-white">
        {isSignup ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-1 text-sm text-white/50">
        {isSignup ? "Start trading with AI in seconds." : "Sign in to your trading dashboard."}
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        {isSignup && (
          <Field
            icon={<User className="h-4 w-4" />}
            type="text"
            placeholder="Full name"
            value={name}
            onChange={setName}
            autoComplete="name"
            required
          />
        )}
        <Field
          icon={<Mail className="h-4 w-4" />}
          type="email"
          placeholder="Email address"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          required
        />
        <div className="relative">
          <Field
            icon={<Lock className="h-4 w-4" />}
            type={showPw ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={setPassword}
            autoComplete={isSignup ? "new-password" : "current-password"}
            minLength={6}
            required
          />
          <button
            type="button"
            onClick={() => setShowPw((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
            tabIndex={-1}
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-primary to-gold-accent py-3 font-semibold text-bg-primary transition hover:shadow-gold-glow",
            loading && "opacity-70"
          )}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSignup ? "Create account" : "Sign in"}
        </button>
      </form>

      <button
        onClick={fillDemo}
        className="mt-3 w-full rounded-xl border border-gold-primary/20 py-2.5 text-sm text-gold-primary transition hover:bg-gold-primary/10"
      >
        Use demo credentials
      </button>

      <p className="mt-6 text-center text-sm text-white/50">
        {isSignup ? "Already have an account? " : "New to Aurum? "}
        <Link
          href={isSignup ? "/login" : "/signup"}
          className="font-medium text-gold-primary hover:underline"
        >
          {isSignup ? "Sign in" : "Create one"}
        </Link>
      </p>
    </div>
  );
}

function Field({
  icon,
  type,
  placeholder,
  value,
  onChange,
  autoComplete,
  required,
  minLength,
}: {
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 transition focus-within:border-gold-primary/40">
      <span className="text-white/35">{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        className="w-full bg-transparent py-3 text-sm text-white placeholder:text-white/35 focus:outline-none"
      />
    </div>
  );
}
