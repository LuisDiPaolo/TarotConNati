import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getAdminBusinessContext() {
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return { supabase, businessId: null };

  const { data } = await supabase
    .from("admin_users")
    .select("business_id")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();

  return { supabase, businessId: data?.business_id ?? null };
}
