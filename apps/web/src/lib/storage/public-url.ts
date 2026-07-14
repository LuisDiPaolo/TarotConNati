const PUBLIC_BUCKETS = {
  brandAssets: "brand-assets",
} as const;

function encodeStoragePath(path: string) {
  return path.split("/").map((segment) => encodeURIComponent(segment)).join("/");
}

export function buildPublicStorageUrl(bucket: string, path: string | null | undefined) {
  const cleanPath = path?.trim();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!cleanPath || !supabaseUrl) return "";
  if (/^https?:\/\//i.test(cleanPath)) return cleanPath;

  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${encodeStoragePath(cleanPath)}`;
}

export function buildBrandAssetUrl(path: string | null | undefined) {
  return buildPublicStorageUrl(PUBLIC_BUCKETS.brandAssets, path);
}
