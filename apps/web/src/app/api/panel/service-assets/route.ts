import { NextRequest, NextResponse } from "next/server";
import { buildBrandAssetUrl } from "@/lib/storage/public-url";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const BRAND_ASSETS_BUCKET = "brand-assets";
const MAX_SERVICE_IMAGE_BYTES = 260 * 1024;

type ServiceAssetRow = {
  id: string;
  business_id: string;
  image_url: string | null;
};

function apiError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status, headers: { "Cache-Control": "no-store" } });
}

function isStoragePath(path: string | null | undefined) {
  const cleanPath = path?.trim();
  return Boolean(cleanPath && !/^https?:\/\//i.test(cleanPath));
}

export async function POST(request: NextRequest) {
  const formData = await request.formData().catch(() => null);
  const serviceId = String(formData?.get("serviceId") ?? "").trim();
  const file = formData?.get("file") ?? null;

  if (!serviceId) return apiError(400, "VALIDATION_ERROR", "Servicio requerido.");
  if (!(file instanceof File) || file.size <= 0) return apiError(400, "VALIDATION_ERROR", "Imagen invalida.");
  if (file.type !== "image/webp") return apiError(400, "VALIDATION_ERROR", "La imagen debe estar optimizada en WebP.");
  if (file.size > MAX_SERVICE_IMAGE_BYTES) return apiError(400, "VALIDATION_ERROR", "La imagen es demasiado pesada.");

  const sessionSupabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await sessionSupabase.auth.getUser();
  if (userError || !userData.user) return apiError(401, "UNAUTHORIZED", "Sesion requerida.");

  const { data: adminUser, error: adminError } = await sessionSupabase
    .from("admin_users")
    .select("business_id")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();

  if (adminError || !adminUser?.business_id) return apiError(401, "UNAUTHORIZED", "Admin no encontrado.");

  const supabase = createSupabaseAdminClient();
  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("id, business_id, image_url")
    .eq("id", serviceId)
    .eq("business_id", adminUser.business_id)
    .maybeSingle();

  if (serviceError || !service) return apiError(404, "NOT_FOUND", "Servicio no encontrado.");

  const row = service as ServiceAssetRow;
  const previousAssetPath = row.image_url?.trim() ?? "";
  const version = Date.now();
  const folder = `business/${row.business_id}/services/${row.id}`;
  const fileName = `service-image-${version}.webp`;
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
    console.error("[panel/service-assets] upload error", uploadError);
    return apiError(500, "UPLOAD_ERROR", "No se pudo subir la imagen.");
  }

  const { error: updateError } = await supabase
    .from("services")
    .update({ image_url: nextPath })
    .eq("id", row.id)
    .eq("business_id", row.business_id);

  if (updateError) {
    await supabase.storage.from(BRAND_ASSETS_BUCKET).remove([nextPath]);
    console.error("[panel/service-assets] update error", updateError);
    return apiError(500, "UPDATE_ERROR", "No se pudo guardar la imagen del servicio.");
  }

  if (isStoragePath(previousAssetPath) && previousAssetPath !== nextPath) {
    const { error: removePreviousError } = await supabase.storage.from(BRAND_ASSETS_BUCKET).remove([previousAssetPath]);
    if (removePreviousError) {
      console.error("[panel/service-assets] previous cleanup error", removePreviousError);
    }
  }

  return NextResponse.json({ ok: true, path: nextPath, publicUrl: buildBrandAssetUrl(nextPath) }, { headers: { "Cache-Control": "no-store" } });
}
