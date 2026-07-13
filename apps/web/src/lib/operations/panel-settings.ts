import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PanelBusinessSettings, PanelScheduleOverrideSettings, PanelScheduleSettings, PanelServiceSettings } from "./panel-settings.types";

export async function getPanelBusinessSettings(): Promise<PanelBusinessSettings | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("business")
    .select("id, name, slug, description, public_domain, whatsapp_phone, brand_primary, brand_accent, brand_radius")
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description ?? "",
    whatsappPhone: data.whatsapp_phone ?? "",
    publicDomain: data.public_domain ?? "",
    brandPrimary: data.brand_primary,
    brandAccent: data.brand_accent,
    brandRadius: data.brand_radius,
  };
}

export async function getPanelServices(): Promise<PanelServiceSettings[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("services")
    .select("id, name, description, category, duration_minutes, price_cents, deposit_cents, payment_mode, active, sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error || !data) return [];

  return data.map((service) => ({
    id: service.id,
    name: service.name,
    description: service.description ?? "",
    category: service.category ?? "",
    durationMinutes: service.duration_minutes,
    priceCents: service.price_cents,
    depositCents: service.deposit_cents,
    paymentMode: service.payment_mode as PanelServiceSettings["paymentMode"],
    active: service.active,
    sortOrder: service.sort_order,
  }));
}

export async function getPanelSchedules(): Promise<PanelScheduleSettings[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("schedules")
    .select("id, weekday, starts_at, ends_at, break_starts_at, break_ends_at, active")
    .order("weekday", { ascending: true })
    .order("starts_at", { ascending: true });

  if (error || !data) return [];

  return data.map((schedule) => ({
    id: schedule.id,
    weekday: schedule.weekday,
    startsAt: schedule.starts_at.slice(0, 5),
    endsAt: schedule.ends_at.slice(0, 5),
    breakStartsAt: schedule.break_starts_at?.slice(0, 5) ?? "",
    breakEndsAt: schedule.break_ends_at?.slice(0, 5) ?? "",
    active: schedule.active,
  }));
}

export async function getPanelScheduleOverrides(): Promise<PanelScheduleOverrideSettings[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("schedule_overrides")
    .select("id, override_date, starts_at, ends_at, closed, reason")
    .order("override_date", { ascending: true });

  if (error || !data) return [];

  return data.map((override) => ({
    id: override.id,
    overrideDate: override.override_date,
    startsAt: override.starts_at?.slice(0, 5) ?? "",
    endsAt: override.ends_at?.slice(0, 5) ?? "",
    closed: override.closed,
    reason: override.reason ?? "",
  }));
}
