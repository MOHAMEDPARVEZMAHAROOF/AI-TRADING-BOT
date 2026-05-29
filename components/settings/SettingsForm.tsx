"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { User, Mail, Bell, Save, Loader2, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function SettingsForm({
  email,
  initialName,
  initialNotifications,
  eventCount,
}: {
  email: string;
  initialName: string;
  initialNotifications: boolean;
  eventCount: number;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const save = async () => {
    setSaving(true);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) {
      toast.error("Not signed in");
      setSaving(false);
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: name, email_notifications: notifications })
      .eq("id", uid);
    if (error) toast.error(error.message);
    else {
      toast.success("Settings saved");
      router.refresh();
    }
    setSaving(false);
  };

  const sendTest = async () => {
    setTesting(true);
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "welcome", name: name || "Trader" }),
      });
      const data = await res.json();
      if (data.emailSent) toast.success("Test email sent — check your inbox 📧");
      else toast("Notifications are off or email service unavailable", { icon: "⚠️" });
    } catch {
      toast.error("Could not send test email");
    } finally {
      setTesting(false);
    }
  };

  return (
    <>
      <div className="glass-card p-6">
        <h2 className="font-display text-xl font-bold text-white">Account Settings</h2>
        <p className="mt-1 text-sm text-white/45">Manage your profile and notification preferences.</p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wide text-white/45">Full name</label>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5">
              <User className="h-4 w-4 text-white/35" />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-transparent py-3 text-sm text-white placeholder:text-white/35 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wide text-white/45">Email</label>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3.5 opacity-70">
              <Mail className="h-4 w-4 text-white/35" />
              <input
                value={email}
                disabled
                className="w-full bg-transparent py-3 text-sm text-white/70 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-primary/10">
                <Bell className="h-5 w-5 text-gold-primary" />
              </div>
              <div>
                <div className="text-sm font-medium text-white">Email notifications</div>
                <div className="text-xs text-white/45">Trade fills, target & stop-loss alerts via Gmail.</div>
              </div>
            </div>
            <button
              onClick={() => setNotifications((n) => !n)}
              className={cn(
                "relative h-7 w-12 rounded-full transition",
                notifications ? "bg-gold-primary" : "bg-white/15"
              )}
              role="switch"
              aria-checked={notifications}
            >
              <span
                className={cn(
                  "absolute top-1 h-5 w-5 rounded-full bg-bg-primary transition",
                  notifications ? "left-6" : "left-1"
                )}
              />
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold-primary to-gold-accent px-5 py-2.5 font-semibold text-bg-primary transition hover:shadow-gold-glow"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save changes
          </button>
          <button
            onClick={sendTest}
            disabled={testing}
            className="flex items-center gap-2 rounded-xl border border-gold-primary/25 px-5 py-2.5 font-semibold text-gold-primary transition hover:bg-gold-primary/10"
          >
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send test email
          </button>
        </div>
      </div>

      <div className="glass-card flex items-center justify-between p-5">
        <div>
          <div className="text-sm font-medium text-white">Notification history</div>
          <div className="text-xs text-white/45">Events recorded to your Supabase account.</div>
        </div>
        <div className="font-mono-data text-2xl font-bold text-gold-primary">{eventCount}</div>
      </div>
    </>
  );
}
