import { z } from "zod";

export const inquirySourceSchema = z.enum(["contact_form", "booking_question", "product_question"]);
export const inquiryStatusSchema = z.enum(["new", "read", "answered_panel", "answered_whatsapp", "converted", "archived"]);

export const publicInquirySchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  message: z.string().trim().min(8).max(1200),
  source: inquirySourceSchema.default("contact_form"),
}).refine((value) => Boolean(value.phone?.trim() || value.email?.trim()), {
  path: ["phone"],
  message: "Deja un telefono o email de contacto.",
});

export const updateInquirySchema = z.object({
  status: inquiryStatusSchema,
  adminNotes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type PublicInquiryInput = z.infer<typeof publicInquirySchema>;
export type InquiryStatus = z.infer<typeof inquiryStatusSchema>;
export type UpdateInquiryInput = z.infer<typeof updateInquirySchema>;
