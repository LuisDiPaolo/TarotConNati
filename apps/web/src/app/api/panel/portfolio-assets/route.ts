import { NextResponse, type NextRequest } from "next/server";
import { apiError } from "@/shared";
import { buildBrandAssetUrl } from "@/lib/storage/public-url";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const BRAND_ASSETS_BUCKET = "brand-assets";
const MAX_PORTFOLIO_IMAGE_BYTES = 340 * 1024;

type PortfolioAssetRow = {
  id: string;
  business_id: string;
  image_url: string | null;
};

function isStoragePath(path: string | null | undefined) {
  const cleanPath = path?.trim();
  return Boolean(cleanPath && !/^https?:\/\//i.test(cleanPath));
}

export async function POST(request: NextRequest) {
  const formData = await request.formData().catch(() => null);
  const portfolioItemId = String(formData?.get("portfolioItemId") ?? "").trim();
  const file = formData?.get("file") ?? null;

  if (!portfolioItemId) return NextResponse.json(apiError("VALIDATION_ERROR", "Item requerido."), { status: 400 });
  if (!(file instanceof File) || file.size <= 0) return NextResponse.json(apiError("VALIDATION_ERROR", "Imagen invalida."), { status: 400 });
  if (file.type !== "image/webp") return NextResponse.json(apiError("VALIDATION_ERROR", "La imagen debe estar optimizada en WebP."), { status: 400 });
  if (file.size > MAX_PORTFOLIO_IMAGE_BYTES) return NextResponse.json(apiError("VALIDATION_ERROR", "La imagen es demasiado pesada."), { status: 400 });

  const sessionSupabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await sessionSupabase.auth.getUser();
  if (userError || !userData.user) return NextResponse.json(apiError("UNAUTHORIZED", "Sesion requerida."), { status: 401 });

  const { data: adminUser, error: adminError } = await sessionSupabase
    .from("admin_users")
    .select("business_id")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();

  if (adminError || !adminUser?.business_id) return NextResponse.json(apiError("UNAUTHORIZED", "Admin no encontrado."), { status: 401 });

  const { data: enabled } = await sessionSupabase.rpc("has_feature", {
    p_business_id: adminUser.business_id,
    p_feature_key: "portfolio_enabled",
  });

  if (!enabled) return NextResponse.json(apiError("FEATURE_NOT_ENABLED", "Portfolio no esta activo para este negocio."), { status: 403 });

  const supabase = createSupabaseAdminClient();
  const { data: portfolioItem, error: portfolioError } = await supabase
    .from("portfolio_items")
    .select("id, business_id, image_url")
    .eq("id", portfolioItemId)
    .eq("business_id", adminUser.business_id)
    .maybeSingle();

  if (portfolioError || !portfolioItem) return NextResponse.json(apiError("NOT_FOUND", "Item de portfolio no encontrado."), { status: 404 });

  const row = portfolioItem as PortfolioAssetRow;
  const previousAssetPath = row.image_url?.trim() ?? "";
  const version = Date.now();
  const folder = `business/${row.business_id}/portfolio/${row.id}`;
  const fileName = `portfolio-image-${version}.webp`;
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
    console.error("[panel/portfolio-assets] upload error", uploadError);
    return NextResponse.json(apiError("INTERNAL_ERROR", "No se pudo subir la imagen."), { status: 500 });
  }

  const { error: updateError } = await supabase
    .from("portfolio_items")
    .update({ image_url: nextPath })
    .eq("id", row.id)
    .eq("business_id", row.business_id);

  if (updateError) {
    await supabase.storage.from(BRAND_ASSETS_BUCKET).remove([nextPath]);
    console.error("[panel/portfolio-assets] update error", updateError);
    return NextResponse.json(apiError("INTERNAL_ERROR", "No se pudo guardar la imagen."), { status: 500 });
  }

  if (isStoragePath(previousAssetPath) && previousAssetPath !== nextPath) {
    const { error: removePreviousError } = await supabase.storage.from(BRAND_ASSETS_BUCKET).remove([previousAssetPath]);
    if (removePreviousError) console.error("[panel/portfolio-assets] previous cleanup error", removePreviousError);
  }

  return NextResponse.json({ data: { path: nextPath, publicUrl: buildBrandAssetUrl(nextPath) } }, { headers: { "Cache-Control": "no-store" } });
}
