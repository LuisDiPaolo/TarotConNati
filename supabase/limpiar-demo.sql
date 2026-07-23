-- LIMPIAR DEMO OPERATIVA
-- Deja el negocio existente listo para correr supabase/seed.sql sobre una base limpia.
-- Borra contenido operativo/demo del unico negocio: servicios, agenda, formularios,
-- clientes, solicitudes, turnos, pagos y trazas operativas/notificaciones.
-- No borra negocio. No borra admin. No borra features. No borra runtime config.
-- Requiere exactamente una fila en public.business.

begin;

do $$
begin
  if (select count(*) from public.business) = 0 then
    raise exception 'Limpiar demo abortado: no hay negocio cargado.';
  end if;

  if (select count(*) from public.business) > 1 then
    raise exception 'Limpiar demo abortado: hay mas de un negocio. Unificar filas en business antes de limpiar demo.';
  end if;
end $$;

-- Desvincular suscripciones instaladas antes de borrar entidades operativas.
-- Se preserva la suscripcion porque pertenece al navegador/dispositivo, no al seed.
update public.push_subscriptions
set
  customer_id = null,
  appointment_id = null,
  service_request_id = null,
  updated_at = now()
where business_id = (select id from public.business limit 1)
  and (
    customer_id is not null
    or appointment_id is not null
    or service_request_id is not null
  );

-- Trazas operativas generadas por pruebas/demo.
delete from public.inquiries
where business_id = (select id from public.business limit 1);

delete from public.push_alert_campaigns
where business_id = (select id from public.business limit 1);

delete from public.push_notification_records
where business_id = (select id from public.business limit 1);

delete from public.push_delivery_events
where business_id = (select id from public.business limit 1);

delete from public.payment_webhook_events
where business_id = (select id from public.business limit 1);

-- Respuestas y eventos dependientes.
delete from public.service_request_intake_responses
where business_id = (select id from public.business limit 1);

delete from public.appointment_status_events
where business_id = (select id from public.business limit 1);

delete from public.appointment_intake_responses
where business_id = (select id from public.business limit 1);

-- Pagos, solicitudes y turnos.
delete from public.coupon_redemptions
where business_id = (select id from public.business limit 1);

delete from public.gift_cards
where business_id = (select id from public.business limit 1);

delete from public.payments
where business_id = (select id from public.business limit 1);

delete from public.product_order_items
where business_id = (select id from public.business limit 1);

delete from public.product_orders
where business_id = (select id from public.business limit 1);

delete from public.service_requests
where business_id = (select id from public.business limit 1);

delete from public.appointments
where business_id = (select id from public.business limit 1);

-- Formularios y relaciones con servicios.
delete from public.service_intake_forms
where business_id = (select id from public.business limit 1);

delete from public.intake_form_fields
where business_id = (select id from public.business limit 1);

delete from public.intake_forms
where business_id = (select id from public.business limit 1);

-- Agenda y excepciones.
delete from public.schedule_overrides
where business_id = (select id from public.business limit 1);

delete from public.schedules
where business_id = (select id from public.business limit 1);

-- Contenido comercial/operativo demo que no forma parte de identidad del negocio.
delete from public.coupons
where business_id = (select id from public.business limit 1);

delete from public.promotions
where business_id = (select id from public.business limit 1);

delete from public.portfolio_items
where business_id = (select id from public.business limit 1);

delete from public.products
where business_id = (select id from public.business limit 1);

-- Clientes y servicios van al final porque son referenciados por lo anterior.
delete from public.customers
where business_id = (select id from public.business limit 1);

delete from public.services
where business_id = (select id from public.business limit 1);

commit;
