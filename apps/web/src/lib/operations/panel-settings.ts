import "server-only";

import { buildBrandAssetUrl } from "@/lib/storage/public-url";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  PanelBusinessSettings,
  PanelIntakeFieldSettings,
  PanelIntakeFormSettings,
  PanelScheduleOverrideSettings,
  PanelScheduleSettings,
  PanelServiceSettings,
} from "./panel-settings.types";

export async function getPanelBusinessSettings(): Promise<PanelBusinessSettings | null> {
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return null;

  const { data: adminUser, error: adminError } = await supabase
    .from("admin_users")
    .select("business_id")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();

  if (adminError || !adminUser?.business_id) return null;

  const { data, error } = await supabase
    .from("business")
    .select("id, name, slug, description, public_domain, whatsapp_phone, public_app_name, panel_app_name, public_short_name, panel_short_name, onboarding_status, brand_primary, brand_accent, theme_background, brand_radius, default_theme_mode, public_bottom_nav_enabled, logo_url, logo_light_url, logo_dark_url, public_app_icon_url, panel_app_icon_url, maskable_icon_url, apple_touch_icon_url")
    .eq("id", adminUser.business_id)
    .maybeSingle();

  if (error || !data) return null;

  const { data: pushFeature } = await supabase
    .from("features")
    .select("enabled")
    .eq("business_id", adminUser.business_id)
    .eq("feature_key", "push_enabled")
    .maybeSingle();

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description ?? "",
    whatsappPhone: data.whatsapp_phone ?? "",
    publicDomain: data.public_domain ?? "",
    publicAppName: data.public_app_name ?? "",
    panelAppName: data.panel_app_name ?? "",
    publicShortName: data.public_short_name ?? "",
    panelShortName: data.panel_short_name ?? "",
    onboardingStatus: (data.onboarding_status ?? "incomplete") as PanelBusinessSettings["onboardingStatus"],
    brandPrimary: data.brand_primary,
    brandAccent: data.brand_accent,
    themeBackground: data.theme_background ?? data.brand_primary,
    brandRadius: data.brand_radius,
    defaultThemeMode: data.default_theme_mode ?? "light",
    publicBottomNavEnabled: data.public_bottom_nav_enabled ?? false,
    notificationsEnabled: pushFeature?.enabled !== false,
    logoUrl: buildBrandAssetUrl(data.logo_url),
    logoLightUrl: buildBrandAssetUrl(data.logo_light_url),
    logoDarkUrl: buildBrandAssetUrl(data.logo_dark_url),
    publicAppIconUrl: buildBrandAssetUrl(data.public_app_icon_url),
    panelAppIconUrl: buildBrandAssetUrl(data.panel_app_icon_url),
    maskableIconUrl: buildBrandAssetUrl(data.maskable_icon_url),
    appleTouchIconUrl: buildBrandAssetUrl(data.apple_touch_icon_url),
  };
}

export async function getPanelServices(): Promise<PanelServiceSettings[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("services")
    .select("id, name, description, category, image_url, service_modality, scheduling_policy, duration_minutes, buffer_before_minutes, buffer_after_minutes, blocks_calendar, arrival_instructions, virtual_instructions, requires_manual_confirmation, price_pesos, deposit_pesos, payment_mode, active, sort_order")
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error || !data) return [];

  return data.map((service) => ({
    id: service.id,
    name: service.name,
    description: service.description ?? "",
    category: service.category ?? "",
    imageUrl: buildBrandAssetUrl(service.image_url),
    serviceModality: (service.service_modality ?? "in_person") as PanelServiceSettings["serviceModality"],
    schedulingPolicy: (service.scheduling_policy ?? "scheduled") as PanelServiceSettings["schedulingPolicy"],
    durationMinutes: service.duration_minutes,
    bufferBeforeMinutes: service.buffer_before_minutes ?? 0,
    bufferAfterMinutes: service.buffer_after_minutes ?? 0,
    blocksCalendar: service.blocks_calendar ?? true,
    arrivalInstructions: service.arrival_instructions ?? "",
    virtualInstructions: service.virtual_instructions ?? "",
    requiresManualConfirmation: service.requires_manual_confirmation ?? false,
    pricePesos: service.price_pesos,
    depositPesos: service.deposit_pesos,
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

type IntakeFieldRow = {
  id: string;
  field_key: string;
  label: string;
  help_text: string | null;
  field_type: PanelIntakeFieldSettings["fieldType"];
  required: boolean;
  sort_order: number;
  options: PanelIntakeFieldSettings["options"] | null;
};

type ServiceIntakeFormRow = {
  service_id: string;
};

type IntakeFormRow = {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  intake_form_fields: IntakeFieldRow[] | null;
  service_intake_forms: ServiceIntakeFormRow[] | null;
};

export async function getPanelIntakeForms(): Promise<PanelIntakeFormSettings[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("intake_forms")
    .select("id, name, description, active, intake_form_fields(id, field_key, label, help_text, field_type, required, sort_order, options), service_intake_forms(service_id)")
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  return ((data ?? []) as unknown as IntakeFormRow[]).map((form) => ({
    id: form.id,
    name: form.name,
    description: form.description ?? "",
    active: form.active,
    serviceIds: (form.service_intake_forms ?? []).map((link) => link.service_id),
    fields: (form.intake_form_fields ?? [])
      .map((field) => ({
        id: field.id,
        fieldKey: field.field_key,
        label: field.label,
        helpText: field.help_text ?? "",
        fieldType: field.field_type,
        required: field.required,
        sortOrder: field.sort_order,
        options: field.options ?? [],
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder),
  }));
}
