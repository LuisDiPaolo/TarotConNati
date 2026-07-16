import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getCurrentPanelBusinessId(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return null;

  const { data: adminUser, error: adminError } = await supabase
    .from("admin_users")
    .select("business_id")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();

  if (adminError || !adminUser?.business_id) return null;
  return adminUser.business_id as string;
}
