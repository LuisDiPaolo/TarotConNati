import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = requestUrl.searchParams.get("next") ?? "/panel";
  const redirectTo = nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/panel";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
  }

  return NextResponse.redirect(new URL("/panel/login?error=auth_callback", requestUrl.origin));
}
