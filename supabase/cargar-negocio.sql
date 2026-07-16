-- CARGAR NEGOCIO
-- Crea o actualiza el unico negocio real de la instancia.
-- No carga demo, servicios, clientes ni turnos.
-- Antes de correrlo, cambiar los valores de la seccion CONFIG.

begin;

do $$
declare
  -- CONFIG: editar estos valores para el cliente real.
  v_admin_email text := 'admin@tu-negocio.com';
  v_business_id uuid := gen_random_uuid(); -- id interno del unico negocio canonico de esta Supabase
  v_business_name text := 'Mi Negocio';
  v_business_slug text := 'mi-negocio';
  v_description text := 'Reserva turnos online para servicios profesionales.';
  v_public_domain text := null; -- dominio publico aprovisionado en DNS/Vercel, ejemplo: 'mi-negocio.com.ar'
  v_panel_domain text := null; -- dominio de panel aprovisionado en DNS/Vercel, ejemplo: 'panel.mi-negocio.com.ar'
  v_whatsapp_phone text := null; -- ejemplo AR: '5493515550101'
  v_public_app_name text := 'Mi Negocio Turnos';
  v_panel_app_name text := 'Mi Negocio Panel';
  v_public_short_name text := 'Turnos';
  v_panel_short_name text := 'Panel';
  v_brand_primary text := '#2563eb';
  v_brand_accent text := '#14b8a6';
  v_theme_background text := '#2563eb';
  v_brand_radius text := '8px'; -- 4px, 8px, 12px o 16px
  v_default_theme_mode text := 'light'; -- light, brand o dark
  v_public_bottom_nav_enabled boolean := false;

  v_auth_user_id uuid;
  v_resolved_business_id uuid;
begin
  select id
    into v_auth_user_id
  from auth.users
  where lower(email) = lower(v_admin_email)
  limit 1;

  if v_auth_user_id is null then
    raise exception 'No existe usuario auth con email %. Crear primero el usuario desde Supabase Auth o desde el login.', v_admin_email;
  end if;

  select id
    into v_resolved_business_id
  from public.business
  order by created_at asc
  limit 1;

  if (select count(*) from public.business) > 1 then
    raise exception 'Esta instancia admite un solo negocio. Unificar filas en public.business antes de completar el alta.';
  end if;

  v_resolved_business_id := coalesce(v_resolved_business_id, v_business_id);

  insert into public.business (
    id,
    name,
    slug,
    description,
    public_domain,
    panel_domain,
    whatsapp_phone,
    timezone,
    currency,
    locale,
    brand_primary,
    brand_accent,
    theme_background,
    brand_radius,
    default_theme_mode,
    public_app_name,
    panel_app_name,
    public_short_name,
    panel_short_name,
    onboarding_status,
    public_bottom_nav_enabled
  )
  values (
    v_resolved_business_id,
    v_business_name,
    v_business_slug,
    v_description,
    nullif(v_public_domain, ''),
    nullif(v_panel_domain, ''),
    nullif(v_whatsapp_phone, ''),
    'America/Argentina/Buenos_Aires',
    'ARS',
    'es-AR',
    v_brand_primary,
    v_brand_accent,
    v_theme_background,
    v_brand_radius,
    v_default_theme_mode,
    v_public_app_name,
    v_panel_app_name,
    v_public_short_name,
    v_panel_short_name,
    'incomplete',
    v_public_bottom_nav_enabled
  )
  on conflict (id) do update
  set name = excluded.name,
      description = excluded.description,
      public_domain = excluded.public_domain,
      panel_domain = excluded.panel_domain,
      whatsapp_phone = excluded.whatsapp_phone,
      brand_primary = excluded.brand_primary,
      brand_accent = excluded.brand_accent,
      theme_background = excluded.theme_background,
      brand_radius = excluded.brand_radius,
      default_theme_mode = excluded.default_theme_mode,
      public_app_name = excluded.public_app_name,
      panel_app_name = excluded.panel_app_name,
      public_short_name = excluded.public_short_name,
      panel_short_name = excluded.panel_short_name,
      public_bottom_nav_enabled = excluded.public_bottom_nav_enabled,
      updated_at = now()
  returning id into v_resolved_business_id;

  insert into public.admin_users (
    business_id,
    auth_user_id,
    email,
    role,
    full_name
  )
  values (
    v_resolved_business_id,
    v_auth_user_id,
    v_admin_email,
    'owner',
    v_business_name
  )
  on conflict (auth_user_id) do update
  set business_id = excluded.business_id,
      email = excluded.email,
      role = excluded.role,
      updated_at = now();

  insert into public.features (business_id, feature_key, enabled, pack, requires_migration)
  values
    (v_resolved_business_id, 'full_payments_enabled', false, 'profesional', false),
    (v_resolved_business_id, 'analytics_enabled', false, 'profesional', false),
    (v_resolved_business_id, 'customer_history_enabled', true, 'profesional', false),
    (v_resolved_business_id, 'reports_enabled', true, 'profesional', false),
    (v_resolved_business_id, 'products_enabled', false, 'profesional', true),
    (v_resolved_business_id, 'portfolio_enabled', false, 'profesional', true),
    (v_resolved_business_id, 'promotions_enabled', false, 'profesional', true),
    (v_resolved_business_id, 'inquiries_enabled', true, 'esencial', true),
    (v_resolved_business_id, 'push_enabled', true, 'profesional', true),
    (v_resolved_business_id, 'push_campaigns_enabled', false, 'comercial', true),
    (v_resolved_business_id, 'campaigns_enabled', false, 'comercial', true),
    (v_resolved_business_id, 'coupons_enabled', false, 'comercial', true),
    (v_resolved_business_id, 'gift_cards_enabled', false, 'comercial', true),
    (v_resolved_business_id, 'packages_enabled', false, 'comercial', true),
    (v_resolved_business_id, 'segmentation_enabled', false, 'comercial', false),
    (v_resolved_business_id, 'advanced_reports_enabled', false, 'comercial', false),
    (v_resolved_business_id, 'multi_staff_enabled', false, 'comercial', true),
    (v_resolved_business_id, 'multi_location_enabled', false, 'comercial', true),
    (v_resolved_business_id, 'waitlist_enabled', false, 'comercial', true),
    (v_resolved_business_id, 'memberships_enabled', false, 'comercial', true)
  on conflict (business_id, feature_key) do update
  set enabled = excluded.enabled,
      pack = excluded.pack,
      requires_migration = excluded.requires_migration,
      updated_at = now();

  insert into public.app_runtime_config (business_id, key, value, public_readable)
  values
    (v_resolved_business_id, 'reservations_enabled', 'true', true),
    (v_resolved_business_id, 'public_pwa_enabled', 'true', true),
    (v_resolved_business_id, 'panel_pwa_enabled', 'true', true),
    (v_resolved_business_id, 'push_enabled', 'true', true),
    (v_resolved_business_id, 'maintenance_mode', 'false', true),
    (v_resolved_business_id, 'reservation_cutoff_minutes', '0', true),
    (v_resolved_business_id, 'demo_mode', 'false', true)
  on conflict (business_id, key) do update
  set value = excluded.value,
      public_readable = excluded.public_readable,
      updated_at = now();

  raise notice 'Negocio listo. business_id=% admin_email=%', v_resolved_business_id, v_admin_email;
end $$;

commit;
