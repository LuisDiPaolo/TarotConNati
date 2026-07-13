import { z } from "zod";
import { publicIntakeResponseSchema } from "../forms/intake-forms";

export const publicReservationSchema = z.object({
  serviceId: z.string().uuid(),
  startsAt: z.string().datetime({ offset: true }),
  customer: z.object({
    fullName: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(6).max(40),
    email: z.string().trim().email().max(160).optional().or(z.literal("")),
    notes: z.string().trim().max(500).optional().or(z.literal("")),
  }),
  intakeResponses: publicIntakeResponseSchema.optional(),
});

export const appointmentStatusSchema = z.enum(["pending", "confirmed", "cancelled", "completed", "no_show"]);

export const updateAppointmentStatusSchema = z.object({
  status: appointmentStatusSchema,
});

export type PublicReservationInput = z.infer<typeof publicReservationSchema>;
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;
