-- Limpia exclusivamente los datos creados por supabase/seed.sql.
-- No usar si reutilizaste este business_id para datos reales.

begin;

delete from appointment_intake_responses where business_id = '00000000-0000-4000-8000-000000000001';
delete from payments where business_id = '00000000-0000-4000-8000-000000000001';
delete from payment_webhook_events where business_id = '00000000-0000-4000-8000-000000000001';
delete from push_delivery_events where business_id = '00000000-0000-4000-8000-000000000001';
delete from push_subscriptions where business_id = '00000000-0000-4000-8000-000000000001';
delete from appointments where business_id = '00000000-0000-4000-8000-000000000001';
delete from customers where business_id = '00000000-0000-4000-8000-000000000001';
delete from service_intake_forms where business_id = '00000000-0000-4000-8000-000000000001';
delete from intake_form_fields where business_id = '00000000-0000-4000-8000-000000000001';
delete from intake_forms where business_id = '00000000-0000-4000-8000-000000000001';
delete from schedule_overrides where business_id = '00000000-0000-4000-8000-000000000001';
delete from schedules where business_id = '00000000-0000-4000-8000-000000000001';
delete from services where business_id = '00000000-0000-4000-8000-000000000001';
delete from app_runtime_config where business_id = '00000000-0000-4000-8000-000000000001';
delete from features where business_id = '00000000-0000-4000-8000-000000000001';
delete from admin_users where business_id = '00000000-0000-4000-8000-000000000001';
delete from business where id = '00000000-0000-4000-8000-000000000001';

commit;
