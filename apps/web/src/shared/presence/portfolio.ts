import { z } from "zod";

const allowedInstagramHosts = new Set(["instagram.com", "www.instagram.com"]);
const allowedTikTokHosts = new Set(["tiktok.com", "www.tiktok.com", "m.tiktok.com"]);

function hasInstagramPostPath(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  return parts.some((part, index) => ["p", "reel", "tv"].includes(part) && Boolean(parts[index + 1]));
}

const optionalSocialUrlSchema = z.string().trim().url().max(500).optional().or(z.literal("")).refine((value) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (allowedInstagramHosts.has(host)) return hasInstagramPostPath(url.pathname);
    if (allowedTikTokHosts.has(host)) return /\/video\/\d+/.test(url.pathname);
    return false;
  } catch {
    return false;
  }
}, "Usa un link directo de post/reel de Instagram o video de TikTok.");

export const portfolioItemSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().max(120).optional().or(z.literal("")),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  category: z.string().trim().max(80).optional().or(z.literal("")),
  imageUrl: z.string().trim().max(800).optional().or(z.literal("")),
  instagramUrl: optionalSocialUrlSchema,
  active: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(10000).default(0),
}).refine((value) => !value.active || Boolean(value.imageUrl?.trim() || value.instagramUrl?.trim()), {
  path: ["imageUrl"],
  message: "Carga una imagen o un enlace de Instagram/TikTok antes de publicarlo.",
});

export type PortfolioItemInput = z.infer<typeof portfolioItemSchema>;
