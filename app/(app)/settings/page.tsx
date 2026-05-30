import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/settings/SettingsForm";

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, email_notifications")
    .eq("id", user.id)
    .maybeSingle();

  const { count } = await supabase
    .from("trade_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <SettingsForm
        email={user.email ?? ""}
        initialName={profile?.full_name ?? (user.user_metadata?.full_name as string) ?? ""}
        initialNotifications={profile?.email_notifications ?? true}
        eventCount={count ?? 0}
      />
    </div>
  );
}
