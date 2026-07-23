-- BORRAR NEGOCIO
-- Borra el negocio de esta instancia y todos los datos de app asociados.
-- Incluye admins, configuracion, servicios, clientes, turnos, pagos y demo.
-- No borra usuarios de Supabase Auth ni archivos de Storage.

begin;

do $$
declare
  v_table text;
  v_tables text[] := array[
    'appointment_status_events',
    'appointment_intake_responses',
    'service_request_intake_responses',
    'coupon_redemptions',
    'gift_cards',
    'payments',
    'payment_webhook_events',
    'product_order_items',
    'product_orders',
    'push_alert_campaigns',
    'push_notification_records',
    'admin_notification_preferences',
    'push_delivery_events',
    'push_subscriptions',
    'inquiries',
    'portfolio_items',
    'products',
    'service_requests',
    'appointments',
    'customers',
    'service_intake_forms',
    'intake_form_fields',
    'intake_forms',
    'schedule_overrides',
    'schedules',
    'services',
    'promotions',
    'coupons',
    'app_runtime_config',
    'features',
    'admin_users',
    'business'
  ];
begin
  foreach v_table in array v_tables loop
    if to_regclass(format('public.%I', v_table)) is not null then
      execute format('delete from public.%I', v_table);
    end if;
  end loop;
end $$;

commit;
