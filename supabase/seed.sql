-- Demo seed descartable para probar la plataforma con un negocio de tarot evolutivo.
-- No usar como onboarding de clientes reales.
-- Para limpiar estos datos, ejecutar supabase/borrar-seed.sql.

begin;

do $$
begin
  if exists (
    select 1
    from public.business
    where id <> '00000000-0000-4000-8000-000000000001'
  ) then
    raise exception 'No ejecutar seed demo sobre una instancia con negocio real. Usar datos del panel o limpiar demo/controladamente antes de continuar.';
  end if;
end $$;

-- Rehacer el demo de forma idempotente.
delete from appointment_status_events where business_id = '00000000-0000-4000-8000-000000000001';
delete from appointment_intake_responses where business_id = '00000000-0000-4000-8000-000000000001';
delete from service_request_intake_responses where business_id = '00000000-0000-4000-8000-000000000001';
delete from payments where business_id = '00000000-0000-4000-8000-000000000001';
delete from payment_webhook_events where business_id = '00000000-0000-4000-8000-000000000001';
delete from push_delivery_events where business_id = '00000000-0000-4000-8000-000000000001';
delete from push_subscriptions where business_id = '00000000-0000-4000-8000-000000000001';
delete from service_requests where business_id = '00000000-0000-4000-8000-000000000001';
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

insert into business (
  id,
  name,
  slug,
  description,
  public_domain,
  panel_domain,
  whatsapp_phone,
  brand_primary,
  brand_accent,
  theme_background,
  brand_radius,
  default_theme_mode
)
values (
  '00000000-0000-4000-8000-000000000001',
  'Tarot Evolutivo Demo',
  'tarot-evolutivo-demo',
  'Lecturas virtuales de tarot evolutivo orientadas a reflexion personal, vinculos y decisiones laborales. No se ofrecen predicciones ni diagnosticos.',
  'localhost',
  'panel.localhost',
  '5493515550101',
  '#7c3aed',
  '#0f766e',
  '#4c1d95',
  '10px',
  'brand'
);

insert into features (business_id, feature_key, enabled, pack, requires_migration)
values
  ('00000000-0000-4000-8000-000000000001', 'full_payments_enabled', true, 'profesional', false),
  ('00000000-0000-4000-8000-000000000001', 'analytics_enabled', false, 'profesional', false),
  ('00000000-0000-4000-8000-000000000001', 'customer_history_enabled', true, 'profesional', false),
  ('00000000-0000-4000-8000-000000000001', 'reports_enabled', false, 'profesional', false),
  ('00000000-0000-4000-8000-000000000001', 'products_enabled', false, 'profesional', true),
  ('00000000-0000-4000-8000-000000000001', 'portfolio_enabled', false, 'profesional', true),
  ('00000000-0000-4000-8000-000000000001', 'promotions_enabled', false, 'profesional', true),
  ('00000000-0000-4000-8000-000000000001', 'inquiries_enabled', true, 'esencial', true),
  ('00000000-0000-4000-8000-000000000001', 'push_enabled', true, 'profesional', true),
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
  ('00000000-0000-4000-8000-000000000001', 'memberships_enabled', false, 'comercial', true);

insert into app_runtime_config (business_id, key, value, public_readable)
values
  ('00000000-0000-4000-8000-000000000001', 'reservations_enabled', 'true', true),
  ('00000000-0000-4000-8000-000000000001', 'public_pwa_enabled', 'true', true),
  ('00000000-0000-4000-8000-000000000001', 'panel_pwa_enabled', 'true', true),
  ('00000000-0000-4000-8000-000000000001', 'push_enabled', 'true', true),
  ('00000000-0000-4000-8000-000000000001', 'maintenance_mode', 'false', true),
  ('00000000-0000-4000-8000-000000000001', 'reservation_cutoff_minutes', '0', true),
  ('00000000-0000-4000-8000-000000000001', 'demo_mode', 'true', true);

insert into services (
  id,
  business_id,
  name,
  description,
  category,
  service_modality,
  scheduling_policy,
  blocks_calendar,
  duration_minutes,
  buffer_before_minutes,
  buffer_after_minutes,
  arrival_instructions,
  virtual_instructions,
  requires_manual_confirmation,
  price_pesos,
  deposit_pesos,
  payment_mode,
  active,
  sort_order
)
values
  (
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'Tirada evolutiva general 24 hs',
    'Lectura asincronica para ordenar una situacion personal y recibir una devolucion en texto, foto o video por WhatsApp dentro de las 24 hs.',
    'Tarot evolutivo',
    'virtual_on_demand',
    'no_calendar_block',
    false,
    60,
    0,
    0,
    '',
    'No es en vivo. La devolucion se envia por WhatsApp en formato texto, foto o video, segun corresponda.',
    true,
    18000,
    0,
    'full',
    true,
    1
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000001',
    'Tirada vincular evolutiva',
    'Lectura no predictiva para observar dinamicas vinculares, limites, patrones y proximos pasos conscientes.',
    'Vinculos',
    'virtual_on_demand',
    'no_calendar_block',
    false,
    75,
    0,
    0,
    '',
    'Enviar por WhatsApp la consulta y el contexto minimo. La respuesta se entrega de forma asincronica.',
    true,
    24000,
    0,
    'full',
    true,
    2
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    '00000000-0000-4000-8000-000000000001',
    'Tirada laboral y proposito',
    'Lectura orientada a decisiones laborales, bloqueos creativos, energia disponible y criterios para avanzar.',
    'Trabajo y proposito',
    'virtual_on_demand',
    'no_calendar_block',
    false,
    75,
    0,
    0,
    '',
    'No reemplaza asesoramiento profesional. Se envia una devolucion reflexiva por WhatsApp.',
    true,
    26000,
    0,
    'full',
    true,
    3
  ),
  (
    '10000000-0000-4000-8000-000000000004',
    '00000000-0000-4000-8000-000000000001',
    'Consulta express una pregunta',
    'Lectura breve para una pregunta concreta, formulada en clave evolutiva y no predictiva.',
    'Express',
    'virtual_on_demand',
    'no_calendar_block',
    false,
    30,
    0,
    0,
    '',
    'La respuesta se envia por WhatsApp en texto o audio breve cuando queda lista.',
    true,
    9000,
    0,
    'full',
    true,
    4
  ),
  (
    '10000000-0000-4000-8000-000000000005',
    '00000000-0000-4000-8000-000000000001',
    'Solicitud de orientacion por WhatsApp',
    'Pedido inicial para elegir que tipo de tirada conviene segun la situacion. No confirma turno automaticamente.',
    'Contacto',
    'contact_request',
    'manual_coordination',
    false,
    15,
    0,
    0,
    '',
    'Se responde por WhatsApp para coordinar el tipo de lectura adecuado.',
    true,
    0,
    0,
    'none',
    true,
    5
  );

-- Agenda 24 hs todos los dias. Los servicios asincronicos no bloquean calendario,
-- pero esta franja permite probar la pantalla de agenda y futuras modalidades horarias.
insert into schedules (business_id, weekday, starts_at, ends_at, active)
values
  ('00000000-0000-4000-8000-000000000001', 0, '00:00', '23:59', true),
  ('00000000-0000-4000-8000-000000000001', 1, '00:00', '23:59', true),
  ('00000000-0000-4000-8000-000000000001', 2, '00:00', '23:59', true),
  ('00000000-0000-4000-8000-000000000001', 3, '00:00', '23:59', true),
  ('00000000-0000-4000-8000-000000000001', 4, '00:00', '23:59', true),
  ('00000000-0000-4000-8000-000000000001', 5, '00:00', '23:59', true),
  ('00000000-0000-4000-8000-000000000001', 6, '00:00', '23:59', true);

insert into schedule_overrides (business_id, override_date, starts_at, ends_at, closed, reason)
values
  ('00000000-0000-4000-8000-000000000001', current_date + 10, null, null, true, 'Dia demo cerrado por mantenimiento'),
  ('00000000-0000-4000-8000-000000000001', current_date + 14, '08:00', '20:00', false, 'Franja reducida demo');

insert into intake_forms (id, business_id, name, description, active)
values
  (
    '20000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'Contexto para lectura evolutiva',
    'Preguntas base para orientar la lectura sin convertirla en prediccion.',
    true
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000001',
    'Consentimiento y formato de entrega',
    'Preferencias de devolucion y consentimiento informado.',
    true
  );

insert into intake_form_fields (id, business_id, form_id, field_key, label, help_text, field_type, required, options, sort_order)
values
  ('21000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'tema_consulta', 'Tema principal de la consulta', 'Ejemplo: vinculos, trabajo, proceso personal, decision puntual.', 'single_select', true, '[{"value":"vinculos","label":"Vinculos"},{"value":"trabajo","label":"Trabajo / proposito"},{"value":"personal","label":"Proceso personal"},{"value":"decision","label":"Decision puntual"}]', 1),
  ('21000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'contexto_breve', 'Contexto breve', 'Contar la situacion en 5 a 10 lineas.', 'long_text', true, '[]', 2),
  ('21000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'pregunta_guia', 'Pregunta guia', 'Formular una pregunta abierta, no predictiva.', 'short_text', true, '[]', 3),
  ('21000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'fecha_nacimiento', 'Fecha de nacimiento opcional', 'Solo si queres sumar contexto simbolico.', 'date', false, '[]', 4),
  ('21000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'cantidad_involucrados', 'Cantidad de personas involucradas', '', 'number', false, '[]', 5),
  ('21000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', 'formato_preferido', 'Formato preferido de devolucion', '', 'multi_select', true, '[{"value":"texto","label":"Texto"},{"value":"foto","label":"Foto de tirada"},{"value":"video","label":"Video"},{"value":"audio","label":"Audio"}]', 1),
  ('21000000-0000-4000-8000-000000000007', '00000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', 'autoriza_whatsapp', 'Autorizo recibir la devolucion por WhatsApp', '', 'consent', true, '[]', 2),
  ('21000000-0000-4000-8000-000000000008', '00000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', 'entiende_no_predictivo', 'Entiendo que la lectura es evolutiva y no predictiva', '', 'consent', true, '[]', 3);

insert into service_intake_forms (business_id, service_id, form_id, active)
values
  ('00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', true),
  ('00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', true),
  ('00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', true),
  ('00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', true),
  ('00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001', true),
  ('00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000002', true),
  ('00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000001', true),
  ('00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000002', true);

insert into customers (id, business_id, full_name, phone, email, notes)
values
  ('30000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'Camila Rios', '+5493515551001', 'camila.demo@example.com', 'Prefiere devolucion en video.'),
  ('30000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', 'Julian Torres', '+5493515551002', 'julian.demo@example.com', 'Consulta laboral.'),
  ('30000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000001', 'Sofia Benitez', '+5493515551003', 'sofia.demo@example.com', 'Consulta vincular.'),
  ('30000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000001', 'Martina Luna', '+5493515551004', 'martina.demo@example.com', 'Pidio texto y foto.'),
  ('30000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000001', 'Nicolas Vera', '+5493515551005', 'nicolas.demo@example.com', 'Solicitud inicial sin pago.'),
  ('30000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000001', 'Valentina Paz', '+5493515551006', 'valentina.demo@example.com', 'Solicitud asincronica pendiente.'),
  ('30000000-0000-4000-8000-000000000007', '00000000-0000-4000-8000-000000000001', 'Bruno Castillo', '+5493515551007', 'bruno.demo@example.com', 'Quiere coordinar formato de entrega.');

insert into service_requests (
  id,
  business_id,
  customer_id,
  service_id,
  status,
  contact_channel,
  preferred_date,
  preferred_window,
  customer_notes,
  admin_notes
)
values
  (
    '50000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000006',
    '10000000-0000-4000-8000-000000000001',
    'pending_review',
    'whatsapp',
    current_date,
    'Entrega dentro de las 24 hs',
    'Necesito una lectura general para ordenar una decision personal. Prefiero video corto y foto de la tirada.',
    null
  ),
  (
    '50000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000007',
    '10000000-0000-4000-8000-000000000002',
    'pending_coordination',
    'whatsapp',
    current_date + 1,
    'Sin vivo, envio asincronico por WhatsApp',
    'Quiero trabajar un vinculo sin buscar predicciones. Puedo mandar contexto por audio si sirve.',
    'Confirmar si prefiere audio o texto antes de cobrar.'
  );

insert into service_request_intake_responses (business_id, service_request_id, form_id, form_snapshot, response)
values
  (
    '00000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '{"name":"Contexto para lectura evolutiva","fields":[{"fieldKey":"tema_consulta","label":"Tema principal de la consulta"},{"fieldKey":"contexto_breve","label":"Contexto breve"},{"fieldKey":"pregunta_guia","label":"Pregunta guia"}]}',
    '{"tema_consulta":"personal","contexto_breve":"Estoy en una etapa de cambios y quiero ordenar prioridades.","pregunta_guia":"Que necesito mirar para avanzar con mas conciencia?"}'
  ),
  (
    '00000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000002',
    '{"name":"Consentimiento y formato de entrega","fields":[{"fieldKey":"formato_preferido","label":"Formato preferido de devolucion"},{"fieldKey":"autoriza_whatsapp","label":"Autorizo recibir la devolucion por WhatsApp"}]}',
    '{"formato_preferido":["texto","audio"],"autoriza_whatsapp":true,"entiende_no_predictivo":true}'
  );

insert into appointments (
  id,
  business_id,
  customer_id,
  service_id,
  starts_at,
  ends_at,
  calendar_starts_at,
  calendar_ends_at,
  status,
  notes
)
values
  ('40000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', now() + interval '4 hours', now() + interval '5 hours', now() + interval '4 hours', now() + interval '5 hours', 'pending', 'Demo: pendiente de confirmacion manual.'),
  ('40000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000003', now() + interval '1 day', now() + interval '1 day 1 hour', now() + interval '1 day', now() + interval '1 day 1 hour', 'confirmed', 'Demo: lectura laboral confirmada.'),
  ('40000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', now() - interval '2 days', now() - interval '2 days' + interval '75 minutes', now() - interval '2 days', now() - interval '2 days' + interval '75 minutes', 'completed', 'Demo: lectura vincular entregada por WhatsApp.'),
  ('40000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000004', now() - interval '1 day', now() - interval '1 day' + interval '30 minutes', now() - interval '1 day', now() - interval '1 day' + interval '30 minutes', 'cancelled', 'Demo: cancelada por el cliente.'),
  ('40000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000005', now() + interval '2 days', now() + interval '2 days 15 minutes', now() + interval '2 days', now() + interval '2 days 15 minutes', 'pending', 'Demo: contacto inicial para orientar modalidad.');

insert into payments (
  business_id,
  appointment_id,
  provider,
  provider_payment_id,
  amount_pesos,
  currency,
  status,
  provider_preference_id,
  checkout_url,
  external_reference
)
values
  ('00000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 'mercado_pago', null, 18000, 'ARS', 'pending', 'demo-pref-001', null, '40000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000002', 'mercado_pago', 'demo-payment-002', 26000, 'ARS', 'approved', 'demo-pref-002', null, '40000000-0000-4000-8000-000000000002'),
  ('00000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000003', 'mercado_pago', 'demo-payment-003', 24000, 'ARS', 'approved', 'demo-pref-003', null, '40000000-0000-4000-8000-000000000003'),
  ('00000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000004', 'mercado_pago', null, 9000, 'ARS', 'cancelled', 'demo-pref-004', null, '40000000-0000-4000-8000-000000000004');

insert into appointment_intake_responses (business_id, appointment_id, form_id, form_snapshot, response)
values
  (
    '00000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '{"name":"Contexto para lectura evolutiva","fields":[{"fieldKey":"tema_consulta","label":"Tema principal de la consulta"},{"fieldKey":"contexto_breve","label":"Contexto breve"},{"fieldKey":"pregunta_guia","label":"Pregunta guia"}]}',
    '{"tema_consulta":"personal","contexto_breve":"Estoy cerrando una etapa y quiero ordenar prioridades.","pregunta_guia":"Que necesito mirar para avanzar con mas claridad?"}'
  ),
  (
    '00000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000002',
    '{"name":"Consentimiento y formato de entrega","fields":[{"fieldKey":"formato_preferido","label":"Formato preferido de devolucion"},{"fieldKey":"autoriza_whatsapp","label":"Autorizo recibir la devolucion por WhatsApp"}]}',
    '{"formato_preferido":["video","foto"],"autoriza_whatsapp":true,"entiende_no_predictivo":true}'
  ),
  (
    '00000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000001',
    '{"name":"Contexto para lectura evolutiva","fields":[{"fieldKey":"tema_consulta","label":"Tema principal de la consulta"},{"fieldKey":"contexto_breve","label":"Contexto breve"},{"fieldKey":"pregunta_guia","label":"Pregunta guia"}]}',
    '{"tema_consulta":"trabajo","contexto_breve":"Quiero revisar una decision laboral sin buscar prediccion concreta.","pregunta_guia":"Que recursos tengo disponibles para elegir mejor?"}'
  ),
  (
    '00000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000001',
    '{"name":"Contexto para lectura evolutiva","fields":[{"fieldKey":"tema_consulta","label":"Tema principal de la consulta"},{"fieldKey":"contexto_breve","label":"Contexto breve"},{"fieldKey":"pregunta_guia","label":"Pregunta guia"}]}',
    '{"tema_consulta":"vinculos","contexto_breve":"Necesito mirar patrones de comunicacion y limites.","pregunta_guia":"Que puedo hacer distinto desde mi lugar?"}'
  );

commit;
