import { z } from "zod";

export const productSettingsSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(700).optional().or(z.literal("")),
  category: z.string().trim().max(80).optional().or(z.literal("")),
  imageUrl: z.string().trim().max(800).optional().or(z.literal("")),
  pricePesos: z.coerce.number().int().min(1).max(10_000_000),
  stockQuantity: z.coerce.number().int().min(0).max(100_000).nullable().optional(),
  active: z.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).max(10_000).default(0),
});

export const publicProductOrderSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(20),
  customer: z.object({
    fullName: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(6).max(40),
    email: z.string().trim().email().max(160).optional().or(z.literal("")),
    notes: z.string().trim().max(500).optional().or(z.literal("")),
  }),
  couponCode: z.string().trim().max(40).optional().or(z.literal("")),
});

export type ProductSettingsInput = z.infer<typeof productSettingsSchema>;
export type PublicProductOrderInput = z.infer<typeof publicProductOrderSchema>;
