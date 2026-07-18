import { z } from "zod";

const optionalUrlSchema = z.string().trim().url().max(500).optional().or(z.literal(""));

export const portfolioItemSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  category: z.string().trim().max(80).optional().or(z.literal("")),
  imageUrl: z.string().trim().max(800).optional().or(z.literal("")),
  instagramUrl: optionalUrlSchema,
  active: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(10000).default(0),
}).refine((value) => Boolean(value.imageUrl?.trim() || value.instagramUrl?.trim()), {
  path: ["imageUrl"],
  message: "Carga una imagen o un enlace de Instagram.",
});

export type PortfolioItemInput = z.infer<typeof portfolioItemSchema>;
