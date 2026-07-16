-- Cada despliegue/Supabase representa un solo negocio canonico.
-- Las futuras sucursales deben modelarse en una tabla separada, no como mas filas de business.
-- Si existe el seed demo junto a un negocio real, se descarta el demo de forma segura antes de bloquear nuevas filas.

do $$
declare
  v_demo_business_id uuid := '00000000-0000-4000-8000-000000000001';
  v_business_count integer;
  v_non_demo_count integer;
begin
  select count(*) into v_business_count from public.business;
  select count(*) into v_non_demo_count from public.business where id <> v_demo_business_id;

  if v_business_count > 1 and exists (select 1 from public.business where id = v_demo_business_id) and v_non_demo_count = 1 then
    delete from public.appointment_status_events where business_id = v_demo_business_id;
    delete from public.appointment_intake_responses where business_id = v_demo_business_id;
    delete from public.service_request_intake_responses where business_id = v_demo_business_id;
    delete from public.payments where business_id = v_demo_business_id;
    delete from public.payment_webhook_events where business_id = v_demo_business_id;
    delete from public.push_notification_records where business_id = v_demo_business_id;
    delete from public.admin_notification_preferences where business_id = v_demo_business_id;
    delete from public.push_delivery_events where business_id = v_demo_business_id;
    delete from public.push_subscriptions where business_id = v_demo_business_id;
    delete from public.service_requests where business_id = v_demo_business_id;
    delete from public.appointments where business_id = v_demo_business_id;
    delete from public.customers where business_id = v_demo_business_id;
    delete from public.service_intake_forms where business_id = v_demo_business_id;
    delete from public.intake_form_fields where business_id = v_demo_business_id;
    delete from public.intake_forms where business_id = v_demo_business_id;
    delete from public.schedule_overrides where business_id = v_demo_business_id;
    delete from public.schedules where business_id = v_demo_business_id;
    delete from public.services where business_id = v_demo_business_id;
    delete from public.promotions where business_id = v_demo_business_id;
    delete from public.coupons where business_id = v_demo_business_id;
    delete from public.app_runtime_config where business_id = v_demo_business_id;
    delete from public.features where business_id = v_demo_business_id;
    delete from public.admin_users where business_id = v_demo_business_id;
    delete from public.business where id = v_demo_business_id;
  end if;

  if (select count(*) from public.business) > 1 then
    raise exception 'Esta instancia admite un solo negocio. Unificar filas reales en business antes de aplicar 0017_single_business_instance.';
  end if;
end $$;

create unique index if not exists business_singleton_instance_idx
  on public.business ((true));

comment on index public.business_singleton_instance_idx is
  'Garantiza una sola fila en business por instancia/Supabase. Usar sucursales para multiples ubicaciones.';
