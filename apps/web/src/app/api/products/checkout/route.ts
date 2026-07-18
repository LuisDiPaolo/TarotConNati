import { NextResponse, type NextRequest } from "next/server";
import { apiError, publicProductOrderSchema } from "@/shared";
import { resolveBusinessForRequest } from "@/lib/business/resolve";
import { getRequestBaseUrl } from "@/lib/http/base-url";
import { confirmCheckoutCoupon, getBusinessDateKey, releaseCheckoutCoupon, reserveCheckoutCoupon, resolveCheckoutCoupon } from "@/lib/commerce/coupons";
import { createMercadoPagoPreference } from "@/lib/payments/mercado-pago";
import { sendTransactionalPush } from "@/lib/push/transactional";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const RATE_LIMIT_WINDOW_MS = 10 * 60_000;
const RATE_LIMIT_MAX = 8;
const productOrderAttempts = new Map<string, { count: number; resetAt: number }>();

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  price_pesos: number;
  stock_quantity: number | null;
};

type OperationResult = {
  ok?: boolean;
  code?: string;
};

function getClientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

function enforceRateLimit(key: string) {
  const now = Date.now();
  const current = productOrderAttempts.get(key);
  if (!current || current.resetAt <= now) {
    productOrderAttempts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (current.count >= RATE_LIMIT_MAX) return false;
  current.count += 1;
  return true;
}

export async function POST(request: NextRequest) {
  const business = await resolveBusinessForRequest(request);
  if (!business) return NextResponse.json(apiError("NOT_FOUND", "No se encontro el negocio para esta solicitud."), { status: 404 });

  const rateLimitKey = `${business.id}:products:${getClientIp(request)}`;
  if (!enforceRateLimit(rateLimitKey)) {
    return NextResponse.json(apiError("RATE_LIMITED", "Demasiados intentos de compra. Proba de nuevo en unos minutos."), { status: 429 });
  }

  const parsed = publicProductOrderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json(apiError("VALIDATION_ERROR", "Revisa los datos de la compra."), { status: 400 });

  const supabase = createSupabaseAdminClient();
  const { data: enabled } = await supabase.rpc("has_feature", {
    p_business_id: business.id,
    p_feature_key: "products_enabled",
  });
  if (!enabled) return NextResponse.json(apiError("FEATURE_NOT_ENABLED", "Productos no esta activo para este negocio."), { status: 403 });

  const input = parsed.data;
  await supabase.rpc("release_expired_product_order_stock", { p_business_id: business.id });
  await supabase.rpc("release_expired_coupon_redemptions", { p_business_id: business.id });

  const { data: productData, error: productError } = await supabase
    .from("products")
    .select("id, name, description, price_pesos, stock_quantity")
    .eq("business_id", business.id)
    .eq("id", input.productId)
    .eq("active", true)
    .maybeSingle();

  if (productError || !productData) return NextResponse.json(apiError("NOT_FOUND", "El producto elegido no esta disponible."), { status: 404 });
  const product = productData as ProductRow;
  if (product.stock_quantity !== null && product.stock_quantity < input.quantity) {
    return NextResponse.json(apiError("VALIDATION_ERROR", "No hay stock suficiente para esa cantidad."), { status: 409 });
  }

  const subtotalPesos = product.price_pesos * input.quantity;
  const couponResult = input.couponCode ? await resolveCheckoutCoupon({
    supabase,
    businessId: business.id,
    code: input.couponCode,
    scope: "products",
    subtotalPesos,
    quantity: input.quantity,
    targetDate: getBusinessDateKey(new Date(), business.timezone),
  }) : null;

  if (couponResult && !couponResult.ok) {
    const status = couponResult.code === "feature_disabled" ? 403 : couponResult.code === "internal_error" ? 500 : 404;
    return NextResponse.json(apiError(couponResult.code.toUpperCase(), couponResult.message), { status });
  }

  const coupon = couponResult?.ok ? couponResult.data.coupon : null;
  const discountPesos = couponResult?.ok ? couponResult.data.discountPesos : 0;
  const totalPesos = Math.max(0, subtotalPesos - discountPesos);

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .insert({
      business_id: business.id,
      full_name: input.customer.fullName,
      phone: input.customer.phone,
      email: input.customer.email || null,
      notes: input.customer.notes || null,
    })
    .select("id")
    .single();

  if (customerError || !customer) return NextResponse.json(apiError("INTERNAL_ERROR", "No se pudo crear el cliente."), { status: 500 });

  const { data: order, error: orderError } = await supabase
    .from("product_orders")
    .insert({
      business_id: business.id,
      customer_id: customer.id,
      customer_name: input.customer.fullName,
      customer_phone: input.customer.phone,
      customer_email: input.customer.email || null,
      notes: input.customer.notes || null,
      status: totalPesos > 0 ? "pending_payment" : "paid",
      subtotal_pesos: subtotalPesos,
      discount_pesos: discountPesos,
      coupon_id: coupon?.id ?? null,
      coupon_code: coupon?.code ?? null,
      total_pesos: totalPesos,
      currency: business.currency,
    })
    .select("id")
    .single();

  if (orderError || !order) return NextResponse.json(apiError("INTERNAL_ERROR", "No se pudo crear la orden."), { status: 500 });

  const { error: itemError } = await supabase.from("product_order_items").insert({
    business_id: business.id,
    order_id: order.id,
    product_id: product.id,
    product_snapshot: {
      id: product.id,
      name: product.name,
      description: product.description ?? "",
      pricePesos: product.price_pesos,
    },
    quantity: input.quantity,
    unit_price_pesos: product.price_pesos,
    total_pesos: subtotalPesos,
  });

  if (itemError) {
    await supabase.from("product_orders").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("id", order.id).eq("business_id", business.id);
    return NextResponse.json(apiError("INTERNAL_ERROR", "No se pudo guardar la orden."), { status: 500 });
  }

  const reservationExpiresAt = new Date(Date.now() + 30 * 60_000).toISOString();
  const { data: reservationResult, error: reservationError } = await supabase.rpc("reserve_product_order_stock", {
    p_business_id: business.id,
    p_order_id: order.id,
    p_expires_at: reservationExpiresAt,
  });
  const typedReservationResult = reservationResult as OperationResult | null;
  if (reservationError || !typedReservationResult?.ok) {
    await supabase.from("product_orders").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("id", order.id).eq("business_id", business.id);
    return NextResponse.json(apiError("VALIDATION_ERROR", typedReservationResult?.code === "insufficient_stock" ? "No hay stock suficiente para esa cantidad." : "No se pudo reservar el stock del producto."), { status: 409 });
  }

  let couponReserved = false;
  if (coupon && discountPesos > 0) {
    const { data: couponReservation, error: couponReservationError } = await reserveCheckoutCoupon({
      supabase,
      businessId: business.id,
      couponId: coupon.id,
      customerId: customer.id,
      productOrderId: order.id,
      purchaserName: input.customer.fullName,
      purchaserPhone: input.customer.phone,
      purchaserEmail: input.customer.email || null,
      discountPesos,
      expiresAt: reservationExpiresAt,
      metadata: { scope: "products", subtotalPesos, quantity: input.quantity },
    });
    const typedCouponReservation = couponReservation as OperationResult | null;
    if (couponReservationError || !typedCouponReservation?.ok) {
      await supabase.rpc("release_product_order_stock", { p_business_id: business.id, p_order_id: order.id });
      await supabase.from("product_orders").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("id", order.id).eq("business_id", business.id);
      return NextResponse.json(apiError("VALIDATION_ERROR", "El cupon ya no esta disponible."), { status: 409 });
    }
    couponReserved = true;
  }

  if (totalPesos === 0) {
    const { data: stockResult, error: stockError } = await supabase.rpc("confirm_product_order_stock", {
      p_business_id: business.id,
      p_order_id: order.id,
    });
    const typedStockResult = stockResult as OperationResult | null;
    if (stockError || !typedStockResult?.ok) {
      if (couponReserved && coupon) await releaseCheckoutCoupon({ supabase, businessId: business.id, couponId: coupon.id, productOrderId: order.id });
      await supabase.from("product_orders").update({ status: "stock_conflict" }).eq("id", order.id).eq("business_id", business.id);
      return NextResponse.json(apiError("VALIDATION_ERROR", "No se pudo confirmar el stock del producto."), { status: 409 });
    }

    if (couponReserved && coupon) {
      await confirmCheckoutCoupon({ supabase, businessId: business.id, couponId: coupon.id, productOrderId: order.id });
    }

    await sendTransactionalPush({
      businessId: business.id,
      eventKey: `product_order.paid.${order.id}`,
      eventType: "product_order.paid",
      sourceTable: "product_orders",
      sourceId: order.id,
      surface: "panel",
      payload: {
        title: "Nueva compra confirmada",
        body: `${product.name} - ${input.customer.fullName}`,
        url: "/productos",
        tag: "product-order-paid",
      },
    });

    return NextResponse.json({ data: { orderId: order.id, checkoutUrl: null, status: "paid" } }, { headers: { "Cache-Control": "no-store" } });
  }

  const accessToken = process.env.MP_ACCESS_TOKEN;
  const externalReference = `product_order:${order.id}`;
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert({
      business_id: business.id,
      product_order_id: order.id,
      amount_pesos: totalPesos,
      currency: business.currency,
      status: "pending",
      external_reference: externalReference,
    })
    .select("id")
    .single();

  if (paymentError || !payment) {
    if (couponReserved && coupon) await releaseCheckoutCoupon({ supabase, businessId: business.id, couponId: coupon.id, productOrderId: order.id });
    await supabase.rpc("release_product_order_stock", { p_business_id: business.id, p_order_id: order.id });
    await supabase.from("product_orders").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("id", order.id).eq("business_id", business.id);
    return NextResponse.json(apiError("INTERNAL_ERROR", "No se pudo registrar el pago."), { status: 500 });
  }

  let checkoutUrl: string | null = null;
  if (accessToken) {
    try {
      const origin = getRequestBaseUrl(request);
      const preference = await createMercadoPagoPreference({
        accessToken,
        title: `Compra - ${product.name}`,
        quantity: 1,
        unitPrice: totalPesos,
        externalReference,
        notificationUrl: `${origin}/api/webhooks/mercado-pago`,
        backUrls: {
          success: `${origin}/?purchase=success`,
          failure: `${origin}/?purchase=failure`,
          pending: `${origin}/?purchase=pending`,
        },
      });

      checkoutUrl = preference.init_point ?? preference.sandbox_init_point ?? null;
      await supabase
        .from("payments")
        .update({ provider_preference_id: preference.id, checkout_url: checkoutUrl })
        .eq("id", payment.id);
    } catch {
      if (couponReserved && coupon) await releaseCheckoutCoupon({ supabase, businessId: business.id, couponId: coupon.id, productOrderId: order.id });
      await supabase.rpc("release_product_order_stock", { p_business_id: business.id, p_order_id: order.id });
      await supabase.from("payments").update({ status: "cancelled" }).eq("id", payment.id).eq("business_id", business.id);
      await supabase.from("product_orders").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("id", order.id).eq("business_id", business.id);
      return NextResponse.json(apiError("PAYMENT_PROVIDER_ERROR", "No se pudo iniciar el pago."), { status: 502 });
    }
  }

  await sendTransactionalPush({
    businessId: business.id,
    eventKey: `product_order.created.${order.id}`,
    eventType: "product_order.created",
    sourceTable: "product_orders",
    sourceId: order.id,
    surface: "panel",
    payload: {
      title: "Nueva compra pendiente",
      body: `${product.name} - ${input.customer.fullName}`,
      url: "/productos",
      tag: "product-order-created",
    },
  });

  return NextResponse.json({ data: { orderId: order.id, checkoutUrl, status: "pending_payment" } }, { headers: { "Cache-Control": "no-store" } });
}
