-- BORRAR SEED DEMO
-- Borra solamente datos demo/operativos cargados por supabase/seed.sql.
-- No borra negocio. No borra admin. No borra features ni runtime config.
-- Requiere exactamente una fila en public.business.

begin;

do $$
begin
  if (select count(*) from public.business) = 0 then
    raise exception 'Borrar seed abortado: no hay negocio cargado.';
  end if;

  if (select count(*) from public.business) > 1 then
    raise exception 'Borrar seed abortado: hay mas de un negocio. Unificar business antes de limpiar demo.';
  end if;
end $$;

delete from appointment_status_events where business_id = (select id from public.business limit 1);
delete from appointment_intake_responses where business_id = (select id from public.business limit 1);
delete from service_request_intake_responses where business_id = (select id from public.business limit 1);
delete from payments where business_id = (select id from public.business limit 1);
delete from payment_webhook_events where business_id = (select id from public.business limit 1);
delete from push_notification_records where business_id = (select id from public.business limit 1);
delete from admin_notification_preferences where business_id = (select id from public.business limit 1);
delete from push_delivery_events where business_id = (select id from public.business limit 1);
delete from push_subscriptions where business_id = (select id from public.business limit 1);
delete from service_requests where business_id = (select id from public.business limit 1);
delete from appointments where business_id = (select id from public.business limit 1);
delete from customers where business_id = (select id from public.business limit 1);
delete from service_intake_forms where business_id = (select id from public.business limit 1);
delete from intake_form_fields where business_id = (select id from public.business limit 1);
delete from intake_forms where business_id = (select id from public.business limit 1);
delete from schedule_overrides where business_id = (select id from public.business limit 1);
delete from schedules where business_id = (select id from public.business limit 1);
delete from services where business_id = (select id from public.business limit 1);

commit;
