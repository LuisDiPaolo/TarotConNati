insert into business (id, name, slug, description, public_domain, panel_domain)
values (
  '00000000-0000-4000-8000-000000000001',
  'Negocio Demo',
  'negocio-demo',
  'Instancia demo para validar Fase 0.',
  'localhost',
  'panel.localhost'
)
on conflict (slug) do nothing;

insert into features (business_id, feature_key, enabled, pack, requires_migration)
values
  ('00000000-0000-4000-8000-000000000001', 'full_payments_enabled', false, 'profesional', false),
  ('00000000-0000-4000-8000-000000000001', 'analytics_enabled', false, 'profesional', false),
  ('00000000-0000-4000-8000-000000000001', 'customer_history_enabled', false, 'profesional', false),
  ('00000000-0000-4000-8000-000000000001', 'reports_enabled', false, 'profesional', false),
  ('00000000-0000-4000-8000-000000000001', 'products_enabled', false, 'profesional', true),
  ('00000000-0000-4000-8000-000000000001', 'portfolio_enabled', false, 'profesional', true),
  ('00000000-0000-4000-8000-000000000001', 'promotions_enabled', false, 'profesional', true),
  ('00000000-0000-4000-8000-000000000001', 'inquiries_enabled', true, 'esencial', true),
  ('00000000-0000-4000-8000-000000000001', 'push_enabled', false, 'profesional', true),
  ('00000000-0000-4000-8000-000000000001', 'push_campaigns_enabled', false, 'comercial', true),
  ('00000000-0000-4000-8000-000000000001', 'campaigns_enabled', false, 'comercial', true),
  ('00000000-0000-4000-8000-000000000001', 'coupons_enabled', false, 'comercial', true),
  ('00000000-0000-4000-8000-000000000001', 'gift_cards_enabled', false, 'comercial', true),
  ('00000000-0000-4000-8000-000000000001', 'packages_enabled', false, 'comercial', true),
  ('00000000-0000-4000-8000-000000000001', 'segmentation_enabled', false, 'comercial', false),
  ('00000000-0000-4000-8000-000000000001', 'advanced_reports_enabled', false, 'comercial', false),
  ('00000000-0000-4000-8000-000000000001', 'multi_staff_enabled', false, 'comercial', true),
  ('00000000-0000-4000-8000-000000000001', 'multi_location_enabled', false, 'comercial', true),
  ('00000000-0000-4000-8000-000000000001', 'waitlist_enabled', false, 'comercial', true),
  ('00000000-0000-4000-8000-000000000001', 'memberships_enabled', false, 'comercial', true)
on conflict (business_id, feature_key) do nothing;

insert into app_runtime_config (business_id, key, value, public_readable)
values
  ('00000000-0000-4000-8000-000000000001', 'reservations_enabled', 'true', true),
  ('00000000-0000-4000-8000-000000000001', 'public_pwa_enabled', 'true', true),
  ('00000000-0000-4000-8000-000000000001', 'panel_pwa_enabled', 'true', true),
  ('00000000-0000-4000-8000-000000000001', 'push_enabled', 'false', true),
  ('00000000-0000-4000-8000-000000000001', 'maintenance_mode', 'false', true),
  ('00000000-0000-4000-8000-000000000001', 'business_hours', '{"days":{"monday":true,"tuesday":true,"wednesday":true,"thursday":true,"friday":true,"saturday":false,"sunday":false},"shifts":[{"label":"Horario","from":"09:00","to":"18:00","enabled":true}],"dayShiftOverrides":{}}', true),
  ('00000000-0000-4000-8000-000000000001', 'reservation_cutoff_minutes', '15', true)
on conflict (business_id, key) do nothing;

insert into services (business_id, name, description, category, duration_minutes, price_cents, deposit_cents, sort_order)
values
  ('00000000-0000-4000-8000-000000000001', 'Servicio demo', 'Servicio inicial para validar el shell.', 'General', 60, 100000, 30000, 1)
on conflict do nothing;

insert into schedules (business_id, weekday, starts_at, ends_at, active)
values
  ('00000000-0000-4000-8000-000000000001', 1, '09:00', '18:00', true),
  ('00000000-0000-4000-8000-000000000001', 2, '09:00', '18:00', true),
  ('00000000-0000-4000-8000-000000000001', 3, '09:00', '18:00', true),
  ('00000000-0000-4000-8000-000000000001', 4, '09:00', '18:00', true),
  ('00000000-0000-4000-8000-000000000001', 5, '09:00', '18:00', true)
on conflict do nothing;
