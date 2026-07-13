import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requirePanelSession() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();

    if (!error && data.user) return data.user;
  } catch {
    redirect("/panel/login?error=missing_supabase_env");
  }

  redirect("/panel/login");
}
