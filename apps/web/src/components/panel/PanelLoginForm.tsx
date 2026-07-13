"use client";

import { LogIn } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function PanelLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(searchParams.get("error") ? "No se pudo completar el acceso." : "");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (authError) {
      setError("Credenciales invalidas o usuario sin acceso al panel.");
      return;
    }

    router.replace("/panel");
    router.refresh();
  }

  return (
    <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
      <label className="flex flex-col gap-2 text-sm font-semibold">
        Email
        <input
          autoComplete="email"
          className="min-h-11 rounded-brand border border-border bg-background px-3 text-base outline-none focus:border-primary"
          inputMode="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </label>
      <label className="flex flex-col gap-2 text-sm font-semibold">
        Password
        <input
          autoComplete="current-password"
          className="min-h-11 rounded-brand border border-border bg-background px-3 text-base outline-none focus:border-primary"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </label>
      {error ? <p className="rounded-brand border border-red-300 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
      <button className="primary-action" disabled={loading} type="submit">
        <LogIn aria-hidden="true" className="h-5 w-5" />
        {loading ? "Ingresando" : "Ingresar"}
      </button>
    </form>
  );
}
