import { z } from "zod";

const giftCardPersonSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(40).optional().or(z.literal("")),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
});

export const publicGiftCardCheckoutSchema = z.object({
  serviceId: z.string().uuid(),
  purchaser: giftCardPersonSchema.extend({
    phone: z.string().trim().min(6).max(40),
  }),
  recipient: giftCardPersonSchema,
  message: z.string().trim().max(500).optional().or(z.literal("")),
});

export type PublicGiftCardCheckoutInput = z.infer<typeof publicGiftCardCheckoutSchema>;
