import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const BRAND_ASSETS_BUCKET = "brand-assets";
const MAX_IMAGE_BYTES_BY_TYPE = {
  logo: 180 * 1024,
  logoLight: 180 * 1024,
  logoDark: 180 * 1024,
  publicIcon: 96 * 1024,
  panelIcon: 96 * 1024,
  maskableIcon: 96 * 1024,
  appleTouchIcon: 160 * 1024,
} as const;

const ASSET_COLUMNS = {
  logo: "logo_url",
  logoLight: "logo_light_url",
  logoDark: "logo_dark_url",
  publicIcon: "public_app_icon_url",
  panelIcon: "panel_app_icon_url",
  maskableIcon: "maskable_icon_url",
  appleTouchIcon: "apple_touch_icon_url",
} as const;

type BrandAssetType = keyof typeof ASSET_COLUMNS;

type BusinessAssetRow = {
  id: string;
  logo_url: string | null;
  logo_light_url: string | null;
  logo_dark_url: string | null;
  public_app_icon_url: string | null;
  panel_app_icon_url: string | null;
  maskable_icon_url: string | null;
  apple_touch_icon_url: string | null;
};

function apiError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status, headers: { "Cache-Control": "no-store" } });
}

function isAssetType(value: FormDataEntryValue | null): value is BrandAssetType {
  return typeof value === "string" && value in ASSET_COLUMNS;
}

function isStoragePath(path: string | null | undefined) {
  const cleanPath = path?.trim();
  return Boolean(cleanPath && !/^https?:\/\//i.test(cleanPath));
}

function slugifyPathSegment(value: string, fallback: string) {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || fallback;
}

function expectedMimeType(assetType: BrandAssetType) {
  return assetType === "appleTouchIcon" ? "image/png" : "image/webp";
}

function previousPath(row: BusinessAssetRow, assetType: BrandAssetType) {
  return row[ASSET_COLUMNS[assetType]];
}

export async function POST(request: NextRequest) {
  const formData = await request.formData().catch(() => null);
  const assetType = formData?.get("assetType") ?? null;
  const file = formData?.get("file") ?? null;

  if (!isAssetType(assetType)) return apiError(400, "VALIDATION_ERROR", "Asset invalido.");
  if (!(file instanceof File) || file.size <= 0) return apiError(400, "VALIDATION_ERROR", "Imagen invalida.");
  if (file.type !== expectedMimeType(assetType)) return apiError(400, "VALIDATION_ERROR", "Formato de imagen invalido.");
  if (file.size > MAX_IMAGE_BYTES_BY_TYPE[assetType]) return apiError(400, "VALIDATION_ERROR", "La imagen es demasiado pesada.");

  const sessionSupabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await sessionSupabase.auth.getUser();
  if (userError || !userData.user) return apiError(401, "UNAUTHORIZED", "Sesion requerida.");

  const { data: adminUser, error: adminError } = await sessionSupabase
    .from("admin_users")
    .select("business_id")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();

  if (adminError || !adminUser) return apiError(401, "UNAUTHORIZED", "Admin no encontrado.");
  if (!adminUser.business_id) return apiError(400, "BUSINESS_REQUIRED", "Primero crea el negocio.");

  const supabase = createSupabaseAdminClient();
  const { data: business, error: businessError } = await supabase
    .from("business")
    .select("id, logo_url, logo_light_url, logo_dark_url, public_app_icon_url, panel_app_icon_url, maskable_icon_url, apple_touch_icon_url")
    .eq("id", adminUser.business_id)
    .single();

  if (businessError || !business) return apiError(404, "NOT_FOUND", "Negocio no encontrado.");

  const row = business as BusinessAssetRow;
  const previousAssetPath = previousPath(row, assetType)?.trim() ?? "";
  const extension = file.type === "image/png" ? "png" : "webp";
  const version = Date.now();
  const assetSlug = slugifyPathSegment(assetType, "asset");
  const folder = `business/${row.id}`;
  const fileName = `${assetSlug}-${version}.${extension}`;
  const nextPath = `${folder}/${fileName}`;
  const imageBytes = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from(BRAND_ASSETS_BUCKET)
    .upload(nextPath, imageBytes, {
      cacheControl: "31536000",
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("[panel/brand-assets] upload error", uploadError);
    return apiError(500, "UPLOAD_ERROR", "No se pudo subir la imagen.");
  }

  const { data: listed, error: listError } = await supabase.storage
    .from(BRAND_ASSETS_BUCKET)
    .list(folder, { limit: 1, search: fileName });

  if (listError || !listed?.some((item) => item.name === fileName)) {
    await supabase.storage.from(BRAND_ASSETS_BUCKET).remove([nextPath]);
    return apiError(500, "UPLOAD_VERIFY_ERROR", "No se pudo verificar la imagen subida.");
  }

  const { error: updateError } = await supabase
    .from("business")
    .update({ [ASSET_COLUMNS[assetType]]: nextPath })
    .eq("id", row.id);

  if (updateError) {
    await supabase.storage.from(BRAND_ASSETS_BUCKET).remove([nextPath]);
    console.error("[panel/brand-assets] update error", updateError);
    return apiError(500, "UPDATE_ERROR", "No se pudo guardar el asset.");
  }

  if (isStoragePath(previousAssetPath) && previousAssetPath !== nextPath) {
    const { error: removePreviousError } = await supabase.storage.from(BRAND_ASSETS_BUCKET).remove([previousAssetPath]);
    if (removePreviousError) {
      console.error("[panel/brand-assets] previous cleanup error", removePreviousError);
    }
  }

  return NextResponse.json({ ok: true, path: nextPath }, { headers: { "Cache-Control": "no-store" } });
}
