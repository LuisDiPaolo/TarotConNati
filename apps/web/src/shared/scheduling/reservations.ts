import { z } from "zod";
import { publicIntakeResponseSchema } from "../forms/intake-forms";

const publicCustomerSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(40),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export const publicReservationSchema = z.object({
  serviceId: z.string().uuid(),
  startsAt: z.string().datetime({ offset: true }),
  customer: publicCustomerSchema,
  couponCode: z.string().trim().max(40).optional().or(z.literal("")),
  intakeResponses: publicIntakeResponseSchema.optional(),
});

export const publicServiceRequestSchema = z.object({
  serviceId: z.string().uuid(),
  customer: publicCustomerSchema,
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  preferredWindow: z.string().trim().max(160).optional().or(z.literal("")),
  contactChannel: z.enum(["whatsapp", "phone", "email"]).default("whatsapp"),
  intakeResponses: publicIntakeResponseSchema.optional(),
});

export const appointmentStatusSchema = z.enum(["pending", "confirmed", "cancelled", "completed", "no_show"]);
export const serviceRequestStatusSchema = z.enum(["pending_review", "pending_coordination", "converted", "closed", "cancelled"]);

export const createPanelAppointmentSchema = z.object({
  serviceId: z.string().uuid(),
  startsAt: z.string().datetime({ offset: true }),
  status: z.enum(["pending", "confirmed"]).default("confirmed"),
  customer: publicCustomerSchema,
});

export const updateAppointmentStatusSchema = z.object({
  status: appointmentStatusSchema,
  reason: z.string().trim().max(500).optional().or(z.literal("")),
});

export const updateServiceRequestSchema = z.object({
  status: serviceRequestStatusSchema,
  adminNotes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const convertServiceRequestSchema = z.object({
  startsAt: z.string().datetime({ offset: true }),
  durationMinutes: z.number().int().positive().max(24 * 60).optional(),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type PublicReservationInput = z.infer<typeof publicReservationSchema>;
export type PublicServiceRequestInput = z.infer<typeof publicServiceRequestSchema>;
export type CreatePanelAppointmentInput = z.infer<typeof createPanelAppointmentSchema>;
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;
export type UpdateServiceRequestInput = z.infer<typeof updateServiceRequestSchema>;
export type ConvertServiceRequestInput = z.infer<typeof convertServiceRequestSchema>;
