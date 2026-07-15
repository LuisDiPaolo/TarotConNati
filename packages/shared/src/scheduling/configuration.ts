import { z } from "zod";

const hexColorSchema = z.string().trim().regex(/^#[0-9a-fA-F]{6}$/);
const themeModeSchema = z.enum(["light", "brand", "dark"]);
const onboardingStatusSchema = z.enum(["incomplete", "review", "ready"]);
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const hostnameSchema = z.string().trim().max(253).regex(/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/);

export const businessSettingsSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  whatsappPhone: z.string().trim().max(40).optional().or(z.literal("")),
  publicDomain: hostnameSchema.optional().or(z.literal("")),
  publicAppName: z.string().trim().max(60).optional().or(z.literal("")),
  panelAppName: z.string().trim().max(60).optional().or(z.literal("")),
  publicShortName: z.string().trim().max(24).optional().or(z.literal("")),
  panelShortName: z.string().trim().max(24).optional().or(z.literal("")),
  onboardingStatus: onboardingStatusSchema.default("incomplete"),
  brandPrimary: hexColorSchema,
  brandAccent: hexColorSchema,
  themeBackground: hexColorSchema,
  brandRadius: z.string().trim().regex(/^([0-9]|1[0-6])px$/),
  defaultThemeMode: themeModeSchema,
  publicBottomNavEnabled: z.coerce.boolean().default(false),
});

export const serviceModalitySchema = z.enum(["in_person", "virtual_scheduled", "virtual_on_demand", "contact_request"]);
export const schedulingPolicySchema = z.enum(["scheduled", "day_request", "manual_coordination", "no_calendar_block"]);

export const serviceSettingsSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  category: z.string().trim().max(80).optional().or(z.literal("")),
  serviceModality: serviceModalitySchema.default("in_person"),
  schedulingPolicy: schedulingPolicySchema.default("scheduled"),
  durationMinutes: z.coerce.number().int().min(5).max(480),
  bufferBeforeMinutes: z.coerce.number().int().min(0).max(480).default(0),
  bufferAfterMinutes: z.coerce.number().int().min(0).max(480).default(0),
  blocksCalendar: z.coerce.boolean().default(true),
  arrivalInstructions: z.string().trim().max(500).optional().or(z.literal("")),
  virtualInstructions: z.string().trim().max(500).optional().or(z.literal("")),
  requiresManualConfirmation: z.coerce.boolean().default(false),
  pricePesos: z.coerce.number().int().min(0).max(100_000_000),
  depositPesos: z.coerce.number().int().min(0).max(100_000_000),
  paymentMode: z.enum(["deposit", "full", "none"]),
  active: z.coerce.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(10_000),
}).refine((value) => value.depositPesos <= value.pricePesos || value.pricePesos === 0, {
  path: ["depositPesos"],
  message: "La sena no puede superar el precio.",
}).refine((value) => value.schedulingPolicy === "scheduled" || !value.blocksCalendar, {
  path: ["blocksCalendar"],
  message: "Solo los servicios con horario pactado bloquean agenda automaticamente.",
}).refine((value) => value.serviceModality !== "contact_request" || value.schedulingPolicy === "manual_coordination", {
  path: ["schedulingPolicy"],
  message: "Las solicitudes de contacto deben coordinarse manualmente.",
});

export const weeklyScheduleSchema = z.object({
  weekday: z.coerce.number().int().min(0).max(6),
  startsAt: timeSchema,
  endsAt: timeSchema,
  breakStartsAt: timeSchema.optional().or(z.literal("")),
  breakEndsAt: timeSchema.optional().or(z.literal("")),
  active: z.coerce.boolean(),
}).refine((value) => value.startsAt < value.endsAt, {
  path: ["endsAt"],
  message: "El cierre debe ser posterior a la apertura.",
}).refine((value) => {
  if (!value.breakStartsAt && !value.breakEndsAt) return true;
  if (!value.breakStartsAt || !value.breakEndsAt) return false;
  return value.startsAt < value.breakStartsAt && value.breakStartsAt < value.breakEndsAt && value.breakEndsAt < value.endsAt;
}, {
  path: ["breakEndsAt"],
  message: "La pausa debe estar dentro del horario.",
});

export const scheduleOverrideSchema = z.object({
  id: z.string().uuid().optional(),
  overrideDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startsAt: timeSchema.optional().or(z.literal("")),
  endsAt: timeSchema.optional().or(z.literal("")),
  closed: z.coerce.boolean(),
  reason: z.string().trim().max(160).optional().or(z.literal("")),
}).refine((value) => {
  if (value.closed) return true;
  if (!value.startsAt || !value.endsAt) return false;
  return value.startsAt < value.endsAt;
}, {
  path: ["endsAt"],
  message: "El cierre excepcional debe ser posterior a la apertura.",
});

export type ServiceModality = z.infer<typeof serviceModalitySchema>;
export type SchedulingPolicy = z.infer<typeof schedulingPolicySchema>;
export type ThemeMode = z.infer<typeof themeModeSchema>;
export type OnboardingStatus = z.infer<typeof onboardingStatusSchema>;
export type BusinessSettingsInput = z.infer<typeof businessSettingsSchema>;
export type ServiceSettingsInput = z.infer<typeof serviceSettingsSchema>;
export type WeeklyScheduleInput = z.infer<typeof weeklyScheduleSchema>;
export type ScheduleOverrideInput = z.infer<typeof scheduleOverrideSchema>;
