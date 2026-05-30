import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, email_notifications, email_verified")
    .eq("id", user.id)
    .maybeSingle();

  // Enforce email verification before granting access to the app.
  if (profile && profile.email_verified === false) redirect("/verify");

  const displayName =
    profile?.full_name || (user.user_metadata?.full_name as string) || user.email || "Trader";

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0 lg:ml-[260px]">
        <TopBar userName={displayName} userEmail={user.email ?? ""} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
