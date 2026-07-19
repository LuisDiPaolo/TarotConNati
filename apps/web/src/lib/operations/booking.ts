import "server-only";

import { calculateAppointmentEnd, formatARS, resolveEffectiveSchedulesForDate } from "@/shared";
import { buildBrandAssetUrl } from "@/lib/storage/public-url";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ResolvedBusiness } from "@/lib/business/resolve";
import type { PublicBookingData, PublicIntakeForm, PublicPortfolioItem, PublicProduct, PublicPromotion, PublicService, PublicSlot } from "@/lib/operations/booking.types";

type BusinessRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  timezone: string;
  currency: string;
  locale: string;
  brand_primary: string;
  brand_accent: string;
  brand_radius: string;
  logo_url: string | null;
  logo_light_url: string | null;
  logo_dark_url: string | null;
  public_app_icon_url: string | null;
  public_bottom_nav_enabled: boolean | null;
};

type ServiceRow = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  image_url: string | null;
  service_modality: PublicService["serviceModality"] | null;
  scheduling_policy: PublicService["schedulingPolicy"] | null;
  duration_minutes: number;
  buffer_before_minutes: number | null;
  buffer_after_minutes: number | null;
  blocks_calendar: boolean | null;
  arrival_instructions: string | null;
  virtual_instructions: string | null;
  requires_manual_confirmation: boolean | null;
  price_pesos: number;
  deposit_pesos: number;
  payment_mode: "deposit" | "full" | "none";
  sort_order: number;
};

type ScheduleRow = {
  weekday: number;
  starts_at: string;
  ends_at: string;
  break_starts_at: string | null;
  break_ends_at: string | null;
};

type EffectiveSchedule = {
  weekday: number;
  startsAt: string;
  endsAt: string;
  breakStartsAt: string | null;
  breakEndsAt: string | null;
};

type ScheduleOverrideRow = {
  override_date: string;
  starts_at: string | null;
  ends_at: string | null;
  closed: boolean;
};

type AppointmentRow = {
  starts_at: string;
  ends_at: string;
  calendar_starts_at: string | null;
  calendar_ends_at: string | null;
};

type PromotionRow = {
  id: string;
  title: string;
  description: string | null;
  discount_type: "percent" | "fixed_amount";
  discount_value: number;
  starts_at: string | null;
  ends_at: string | null;
};

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  image_url: string | null;
  price_pesos: number;
  stock_quantity: number | null;
  sort_order: number;
};

type PortfolioRow = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  image_url: string | null;
  instagram_url: string | null;
  sort_order: number;
};

type IntakeFormLinkRow = {
  service_id: string;
  intake_forms: {
    id: string;
    name: string;
    description: string | null;
    active: boolean;
    deleted_at: string | null;
    intake_form_fields: Array<{
      field_key: string;
      label: string;
      help_text: string | null;
      field_type: PublicIntakeForm["fields"][number]["fieldType"];
      required: boolean;
      options: PublicIntakeForm["fields"][number]["options"] | null;
      sort_order: number;
    }> | null;
  } | null;
};

function toMoneyLabel(amountPesos: number) {
  return formatARS(amountPesos);
}

function timeToMinutes(value: string) {
  const [hours = "0", minutes = "0"] = value.slice(0, 5).split(":");
  return Number.parseInt(hours, 10) * 60 + Number.parseInt(minutes, 10);
}

function localDateKey(parts: { year: number; month: number; day: number }) {
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function formatSlotLabel(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone,
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getWeekdayIndex(date: Date, timeZone: string) {
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(date);
  return Math.max(0, ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday));
}

function getLocalDateParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  return {
    year: Number(parts.find((part) => part.type === "year")?.value ?? date.getUTCFullYear()),
    month: Number(parts.find((part) => part.type === "month")?.value ?? date.getUTCMonth() + 1),
    day: Number(parts.find((part) => part.type === "day")?.value ?? date.getUTCDate()),
  };
}

function zonedTimeToUtc(input: { year: number; month: number; day: number; hour: number; minute: number; timeZone: string }) {
  const guess = new Date(Date.UTC(input.year, input.month - 1, input.day, input.hour, input.minute));
  const actual = getLocalDateParts(guess, input.timeZone);
  const actualStart = Date.UTC(actual.year, actual.month - 1, actual.day, input.hour, input.minute);
  const expectedStart = Date.UTC(input.year, input.month - 1, input.day, input.hour, input.minute);
  const offset = actualStart - expectedStart;
  return new Date(guess.getTime() - offset);
}

function overlaps(candidate: { startsAt: Date; endsAt: Date }, appointments: AppointmentRow[]) {
  return appointments.some((appointment) => {
    const startsAt = new Date(appointment.calendar_starts_at ?? appointment.starts_at);
    const endsAt = new Date(appointment.calendar_ends_at ?? appointment.ends_at);
    return candidate.startsAt < endsAt && startsAt < candidate.endsAt;
  });
}

function calculateCalendarRange(input: { startsAt: Date; durationMinutes: number; bufferBeforeMinutes: number; bufferAfterMinutes: number }) {
  return {
    startsAt: new Date(input.startsAt.getTime() - input.bufferBeforeMinutes * 60_000),
    endsAt: new Date(input.startsAt.getTime() + (input.durationMinutes + input.bufferAfterMinutes) * 60_000),
  };
}

async function getBusiness(businessId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("business")
    .select("id, name, slug, description, timezone, currency, locale, brand_primary, brand_accent, brand_radius, logo_url, logo_light_url, logo_dark_url, public_app_icon_url, public_bottom_nav_enabled")
    .eq("id", businessId)
    .maybeSingle();

  if (error || !data) return null;
  return data as BusinessRow;
}

export async function getPublicBookingData(resolvedBusiness: ResolvedBusiness): Promise<PublicBookingData | null> {
  const supabase = createSupabaseAdminClient();
  const business = await getBusiness(resolvedBusiness.id);
  if (!business) return null;

  const [{ data: inquiriesEnabled }, { data: portfolioEnabled }, { data: productsEnabled }, { data: promotionsEnabled }, { data: giftCardsEnabled }] = await Promise.all([
    supabase.rpc("has_feature", {
      p_business_id: business.id,
      p_feature_key: "inquiries_enabled",
    }),
    supabase.rpc("has_feature", {
      p_business_id: business.id,
      p_feature_key: "portfolio_enabled",
    }),
    supabase.rpc("has_feature", {
      p_business_id: business.id,
      p_feature_key: "products_enabled",
    }),
    supabase.rpc("has_feature", {
      p_business_id: business.id,
      p_feature_key: "promotions_enabled",
    }),
    supabase.rpc("has_feature", {
      p_business_id: business.id,
      p_feature_key: "gift_cards_enabled",
    }),
  ]);

  const now = new Date();
  if (productsEnabled) {
    await supabase.rpc("release_expired_product_order_stock", {
      p_business_id: business.id,
      p_now: now.toISOString(),
    });
  }

  const todayParts = getLocalDateParts(now, business.timezone);
  const untilParts = getLocalDateParts(new Date(now.getTime() + 13 * 24 * 60 * 60_000), business.timezone);

  const [{ data: servicesData }, { data: schedulesData }, { data: overridesData }, { data: appointmentsData }, { data: intakeLinksData }, { data: portfolioData }, { data: productsData }, { data: promotionsData }] = await Promise.all([
    supabase
      .from("services")
      .select("id, name, description, category, image_url, service_modality, scheduling_policy, duration_minutes, buffer_before_minutes, buffer_after_minutes, blocks_calendar, arrival_instructions, virtual_instructions, requires_manual_confirmation, price_pesos, deposit_pesos, payment_mode, sort_order")
      .eq("business_id", business.id)
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("schedules")
      .select("weekday, starts_at, ends_at, break_starts_at, break_ends_at")
      .eq("business_id", business.id)
      .eq("active", true),
    supabase
      .from("schedule_overrides")
      .select("override_date, starts_at, ends_at, closed")
      .eq("business_id", business.id)
      .gte("override_date", localDateKey(todayParts))
      .lte("override_date", localDateKey(untilParts)),
    supabase
      .from("appointments")
      .select("starts_at, ends_at, calendar_starts_at, calendar_ends_at")
      .eq("business_id", business.id)
      .is("deleted_at", null)
      .neq("status", "cancelled")
      .gte("calendar_ends_at", now.toISOString()),
    supabase
      .from("service_intake_forms")
      .select("service_id, intake_forms(id, name, description, active, deleted_at, intake_form_fields(field_key, label, help_text, field_type, required, options, sort_order))")
      .eq("business_id", business.id)
      .eq("active", true),
    portfolioEnabled
      ? supabase
        .from("portfolio_items")
        .select("id, title, description, category, image_url, instagram_url, sort_order")
        .eq("business_id", business.id)
        .eq("active", true)
        .or("image_url.not.is.null,instagram_url.not.is.null")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    productsEnabled
      ? supabase
        .from("products")
        .select("id, name, description, category, image_url, price_pesos, stock_quantity, sort_order")
        .eq("business_id", business.id)
        .eq("active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true })
      : Promise.resolve({ data: [] }),
    promotionsEnabled
      ? supabase
        .from("promotions")
        .select("id, title, description, discount_type, discount_value, starts_at, ends_at")
        .eq("business_id", business.id)
        .eq("active", true)
        .or(`starts_at.is.null,starts_at.lte.${now.toISOString()}`)
        .or(`ends_at.is.null,ends_at.gte.${now.toISOString()}`)
        .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const services = ((servicesData ?? []) as ServiceRow[]).map((service) => ({
    id: service.id,
    name: service.name,
    description: service.description ?? "",
    category: service.category ?? "General",
    imageUrl: buildBrandAssetUrl(service.image_url),
    serviceModality: service.service_modality ?? "in_person",
    schedulingPolicy: service.scheduling_policy ?? "scheduled",
    durationMinutes: service.duration_minutes,
    bufferBeforeMinutes: service.buffer_before_minutes ?? 0,
    bufferAfterMinutes: service.buffer_after_minutes ?? 0,
    blocksCalendar: service.blocks_calendar ?? true,
    arrivalInstructions: service.arrival_instructions ?? "",
    virtualInstructions: service.virtual_instructions ?? "",
    requiresManualConfirmation: service.requires_manual_confirmation ?? false,
    pricePesos: service.price_pesos,
    depositPesos: service.deposit_pesos,
    paymentMode: service.payment_mode,
    priceLabel: toMoneyLabel(service.price_pesos),
    depositLabel: toMoneyLabel(service.deposit_pesos),
  }));

  const products: PublicProduct[] = ((productsData ?? []) as ProductRow[])
    .filter((product) => product.stock_quantity === null || product.stock_quantity > 0)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description ?? "",
      category: product.category ?? "",
      imageUrl: buildBrandAssetUrl(product.image_url),
      pricePesos: product.price_pesos,
      priceLabel: toMoneyLabel(product.price_pesos),
      stockQuantity: product.stock_quantity,
    }));

  const promotions: PublicPromotion[] = ((promotionsData ?? []) as PromotionRow[]).map((promotion) => ({
    id: promotion.id,
    title: promotion.title,
    description: promotion.description ?? "",
    discountType: promotion.discount_type,
    discountValue: promotion.discount_value,
    discountLabel: promotion.discount_type === "percent" ? `${promotion.discount_value}%` : toMoneyLabel(promotion.discount_value),
    startsAt: promotion.starts_at ?? "",
    endsAt: promotion.ends_at ?? "",
  }));

  const portfolioItems: PublicPortfolioItem[] = ((portfolioData ?? []) as PortfolioRow[])
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item) => ({
      id: item.id,
      title: item.title ?? "",
      description: item.description ?? "",
      category: item.category ?? "",
      imageUrl: buildBrandAssetUrl(item.image_url),
      instagramUrl: item.instagram_url ?? "",
    }))
    .filter((item) => Boolean(item.imageUrl || item.instagramUrl));

  const intakeFormsByService: Record<string, PublicIntakeForm[]> = {};
  for (const link of (intakeLinksData ?? []) as unknown as IntakeFormLinkRow[]) {
    if (!link.intake_forms || !link.intake_forms.active || link.intake_forms.deleted_at) continue;
    const fields = (link.intake_forms.intake_form_fields ?? [])
      .map((field) => ({
        fieldKey: field.field_key,
        label: field.label,
        helpText: field.help_text ?? "",
        fieldType: field.field_type,
        required: field.required,
        options: field.options ?? [],
        sortOrder: field.sort_order,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((field) => ({
        fieldKey: field.fieldKey,
        label: field.label,
        helpText: field.helpText,
        fieldType: field.fieldType,
        required: field.required,
        options: field.options,
      }));

    intakeFormsByService[link.service_id] = [
      ...(intakeFormsByService[link.service_id] ?? []),
      {
        id: link.intake_forms.id,
        name: link.intake_forms.name,
        description: link.intake_forms.description ?? "",
        fields,
      },
    ];
  }

  const schedules: EffectiveSchedule[] = ((schedulesData ?? []) as ScheduleRow[]).map((schedule) => ({
    weekday: schedule.weekday,
    startsAt: schedule.starts_at,
    endsAt: schedule.ends_at,
    breakStartsAt: schedule.break_starts_at,
    breakEndsAt: schedule.break_ends_at,
  }));
  const overrides = ((overridesData ?? []) as ScheduleOverrideRow[]).map((override) => ({
    overrideDate: override.override_date,
    startsAt: override.starts_at,
    endsAt: override.ends_at,
    closed: override.closed,
  }));
  const appointments = (appointmentsData ?? []) as AppointmentRow[];
  const slotsByService: Record<string, PublicSlot[]> = {};

  for (const service of services) {
    const slots: PublicSlot[] = [];

    if (service.schedulingPolicy !== "scheduled") {
      slotsByService[service.id] = slots;
      continue;
    }

    for (let dayOffset = 0; dayOffset < 14; dayOffset += 1) {
      const cursor = new Date(now.getTime() + dayOffset * 24 * 60 * 60_000);
      const localParts = getLocalDateParts(cursor, business.timezone);
      const localNoon = zonedTimeToUtc({ ...localParts, hour: 12, minute: 0, timeZone: business.timezone });
      const weekday = getWeekdayIndex(localNoon, business.timezone);
      const daySchedules = resolveEffectiveSchedulesForDate({
        dateKey: localDateKey(localParts),
        weekday,
        schedules,
        overrides,
      });

      for (const schedule of daySchedules) {
        const startMinutes = timeToMinutes(schedule.startsAt);
        const endMinutes = timeToMinutes(schedule.endsAt);
        const breakStart = schedule.breakStartsAt ? timeToMinutes(schedule.breakStartsAt) : null;
        const breakEnd = schedule.breakEndsAt ? timeToMinutes(schedule.breakEndsAt) : null;

        for (let minute = startMinutes; minute + service.durationMinutes <= endMinutes; minute += 30) {
          const blockStartMinute = service.blocksCalendar ? minute - service.bufferBeforeMinutes : minute;
          const blockEndMinute = minute + service.durationMinutes + (service.blocksCalendar ? service.bufferAfterMinutes : 0);
          if (blockStartMinute < startMinutes || blockEndMinute > endMinutes) continue;
          if (breakStart !== null && breakEnd !== null && blockStartMinute < breakEnd && blockEndMinute > breakStart) continue;

          const startsAt = zonedTimeToUtc({
            ...localParts,
            hour: Math.floor(minute / 60),
            minute: minute % 60,
            timeZone: business.timezone,
          });
          const calendarRange = service.blocksCalendar
            ? calculateCalendarRange({
              startsAt,
              durationMinutes: service.durationMinutes,
              bufferBeforeMinutes: service.bufferBeforeMinutes,
              bufferAfterMinutes: service.bufferAfterMinutes,
            })
            : { startsAt, endsAt: calculateAppointmentEnd(startsAt, service.durationMinutes) };
          if (startsAt <= now) continue;
          if (service.blocksCalendar && overlaps(calendarRange, appointments)) continue;

          slots.push({ serviceId: service.id, startsAt: startsAt.toISOString(), label: formatSlotLabel(startsAt, business.timezone) });
          if (slots.length >= 12) break;
        }

        if (slots.length >= 12) break;
      }

      if (slots.length >= 12) break;
    }

    slotsByService[service.id] = slots;
  }

  return {
    business: {
      id: business.id,
      name: business.name,
      slug: business.slug,
      description: business.description ?? "",
      timezone: business.timezone,
      brandPrimary: business.brand_primary,
      brandAccent: business.brand_accent,
      brandRadius: business.brand_radius,
      logoUrl: buildBrandAssetUrl(business.logo_url),
      logoLightUrl: buildBrandAssetUrl(business.logo_light_url),
      logoDarkUrl: buildBrandAssetUrl(business.logo_dark_url),
      publicAppIconUrl: buildBrandAssetUrl(business.public_app_icon_url),
      publicBottomNavEnabled: business.public_bottom_nav_enabled ?? false,
      inquiriesEnabled: Boolean(inquiriesEnabled),
      portfolioEnabled: Boolean(portfolioEnabled),
      productsEnabled: Boolean(productsEnabled),
      promotionsEnabled: Boolean(promotionsEnabled),
      giftCardsEnabled: Boolean(giftCardsEnabled),
    },
    services,
    portfolioItems,
    products,
    promotions,
    slotsByService,
    intakeFormsByService,
  };
}
