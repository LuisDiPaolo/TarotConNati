import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Route } from "next";

function getPanelLoginPath(query = "") {
  return `/login${query}` as Route;
}

export async function requirePanelSession() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();

    if (!error && data.user) return data.user;
  } catch {
    redirect(getPanelLoginPath("?error=missing_supabase_env"));
  }

  redirect(getPanelLoginPath());
}
