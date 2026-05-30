import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VerifyForm } from "@/components/auth/VerifyForm";

export default async function VerifyPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("email_verified")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.email_verified) redirect("/trading");

  return <VerifyForm email={user.email ?? ""} />;
}
