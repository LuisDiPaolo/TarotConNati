create extension if not exists pgcrypto;

create table business (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  public_domain text,
  panel_domain text,
  whatsapp_phone text,
  timezone text not null default 'America/Argentina/Buenos_Aires',
  currency text not null default 'ARS',
  locale text not null default 'es-AR',
  brand_primary text not null default '#2563eb',
  brand_accent text not null default '#14b8a6',
  brand_radius text not null default '8px',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table admin_users (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id),
  auth_user_id uuid not null unique,
  email text not null,
  role text not null default 'owner' check (role in ('owner', 'manager')),
  full_name text,
  two_factor_enabled boolean not null default false,
  strong_password_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table features (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id),
  feature_key text not null,
  enabled boolean not null default false,
  pack text not null check (pack in ('esencial', 'profesional', 'comercial')),
  requires_migration boolean not null default false,
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, feature_key),
  check (feature_key ~ '^[a-z0-9_]+_enabled$')
);

create table services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id),
  name text not null,
  description text,
  category text,
  duration_minutes integer not null check (duration_minutes > 0),
  price_cents integer not null default 0 check (price_cents >= 0),
  deposit_cents integer not null default 0 check (deposit_cents >= 0),
  payment_mode text not null default 'deposit' check (payment_mode in ('deposit', 'full', 'none')),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table schedules (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id),
  weekday integer not null check (weekday between 0 and 6),
  starts_at time not null,
  ends_at time not null,
  break_starts_at time,
  break_ends_at time,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (starts_at < ends_at)
);

create table schedule_overrides (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id),
  override_date date not null,
  starts_at time,
  ends_at time,
  closed boolean not null default false,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, override_date)
);

create table customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id),
  full_name text not null,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id),
  customer_id uuid not null references customers(id),
  service_id uuid not null references services(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (starts_at < ends_at)
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id),
  appointment_id uuid not null references appointments(id),
  provider text not null default 'mercado_pago',
  provider_payment_id text,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'ARS',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'refunded', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table app_runtime_config (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id),
  key text not null,
  value text not null,
  public_readable boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, key),
  check (key ~ '^[a-z0-9_]+$')
);

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id),
  surface text not null check (surface in ('public', 'panel')),
  endpoint text not null,
  endpoint_hash text not null unique,
  subscription jsonb not null,
  user_agent text,
  last_seen_at timestamptz not null default now(),
  disabled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table push_delivery_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id),
  event_key text unique,
  event_type text not null,
  source_table text,
  source_id uuid,
  status text not null default 'claimed' check (status in ('claimed', 'sent', 'partial', 'failed', 'skipped')),
  payload jsonb not null default '{}'::jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id),
  provider text not null,
  event_key text not null unique,
  external_id text not null,
  request_id text,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  processed boolean not null default false,
  processed_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table promotions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id),
  title text not null,
  description text,
  discount_type text not null check (discount_type in ('percent', 'fixed_amount')),
  discount_value integer not null check (discount_value > 0),
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or starts_at < ends_at)
);

create table coupons (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id),
  code text not null,
  description text,
  discount_type text not null check (discount_type in ('percent', 'fixed_amount')),
  discount_value integer not null check (discount_value > 0),
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  used_count integer not null default 0 check (used_count >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, code),
  check (code = upper(code)),
  check (ends_at is null or starts_at is null or starts_at < ends_at)
);

create or replace function has_feature(p_business_id uuid, p_feature_key text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select enabled from features where business_id = p_business_id and feature_key = p_feature_key),
    false
  );
$$;

create or replace function current_admin_business_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select business_id from admin_users where auth_user_id = auth.uid() limit 1;
$$;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger business_set_updated_at before update on business for each row execute function set_updated_at();
create trigger admin_users_set_updated_at before update on admin_users for each row execute function set_updated_at();
create trigger features_set_updated_at before update on features for each row execute function set_updated_at();
create trigger services_set_updated_at before update on services for each row execute function set_updated_at();
create trigger schedules_set_updated_at before update on schedules for each row execute function set_updated_at();
create trigger schedule_overrides_set_updated_at before update on schedule_overrides for each row execute function set_updated_at();
create trigger customers_set_updated_at before update on customers for each row execute function set_updated_at();
create trigger appointments_set_updated_at before update on appointments for each row execute function set_updated_at();
create trigger payments_set_updated_at before update on payments for each row execute function set_updated_at();
create trigger app_runtime_config_set_updated_at before update on app_runtime_config for each row execute function set_updated_at();
create trigger push_subscriptions_set_updated_at before update on push_subscriptions for each row execute function set_updated_at();
create trigger push_delivery_events_set_updated_at before update on push_delivery_events for each row execute function set_updated_at();
create trigger payment_webhook_events_set_updated_at before update on payment_webhook_events for each row execute function set_updated_at();
create trigger promotions_set_updated_at before update on promotions for each row execute function set_updated_at();
create trigger coupons_set_updated_at before update on coupons for each row execute function set_updated_at();

alter table business enable row level security;
alter table admin_users enable row level security;
alter table features enable row level security;
alter table services enable row level security;
alter table schedules enable row level security;
alter table schedule_overrides enable row level security;
alter table customers enable row level security;
alter table appointments enable row level security;
alter table payments enable row level security;
alter table app_runtime_config enable row level security;
alter table push_subscriptions enable row level security;
alter table push_delivery_events enable row level security;
alter table payment_webhook_events enable row level security;
alter table promotions enable row level security;
alter table coupons enable row level security;

create policy business_admin_read on business for select using (id = current_admin_business_id());
create policy admin_users_self_read on admin_users for select using (auth_user_id = auth.uid());
create policy features_admin_read on features for select using (business_id = current_admin_business_id());

create policy services_public_read on services for select using (active = true);
create policy schedules_public_read on schedules for select using (active = true);
create policy schedule_overrides_public_read on schedule_overrides for select using (true);

create policy services_admin_all on services for all using (business_id = current_admin_business_id()) with check (business_id = current_admin_business_id());
create policy schedules_admin_all on schedules for all using (business_id = current_admin_business_id()) with check (business_id = current_admin_business_id());
create policy schedule_overrides_admin_all on schedule_overrides for all using (business_id = current_admin_business_id()) with check (business_id = current_admin_business_id());
create policy customers_admin_all on customers for all using (business_id = current_admin_business_id()) with check (business_id = current_admin_business_id());
create policy appointments_admin_all on appointments for all using (business_id = current_admin_business_id()) with check (business_id = current_admin_business_id());
create policy payments_admin_read on payments for select using (business_id = current_admin_business_id());
create policy app_runtime_config_public_read on app_runtime_config for select using (public_readable = true);
create policy app_runtime_config_admin_all on app_runtime_config for all using (business_id = current_admin_business_id()) with check (business_id = current_admin_business_id());
create policy push_subscriptions_admin_read on push_subscriptions for select using (business_id = current_admin_business_id());
create policy push_delivery_events_admin_read on push_delivery_events for select using (business_id = current_admin_business_id());
create policy payment_webhook_events_admin_read on payment_webhook_events for select using (business_id = current_admin_business_id());
create policy promotions_public_read on promotions for select using (
  active = true
  and has_feature(business_id, 'promotions_enabled')
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at >= now())
);
create policy promotions_admin_all on promotions for all using (business_id = current_admin_business_id()) with check (business_id = current_admin_business_id());
create policy coupons_public_read on coupons for select using (
  active = true
  and has_feature(business_id, 'coupons_enabled')
  and (usage_limit is null or used_count < usage_limit)
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at >= now())
);
create policy coupons_admin_all on coupons for all using (business_id = current_admin_business_id()) with check (business_id = current_admin_business_id());

create index features_business_id_idx on features(business_id);
create index services_business_id_idx on services(business_id);
create index schedules_business_id_idx on schedules(business_id);
create index appointments_business_starts_idx on appointments(business_id, starts_at);
create index customers_business_id_idx on customers(business_id);
create index payments_business_id_idx on payments(business_id);
create index payments_provider_payment_id_idx on payments(provider_payment_id);
create index app_runtime_config_business_key_idx on app_runtime_config(business_id, key);
create index push_subscriptions_business_surface_idx on push_subscriptions(business_id, surface) where disabled_at is null;
create index push_delivery_events_business_status_idx on push_delivery_events(business_id, status);
create index payment_webhook_events_business_provider_idx on payment_webhook_events(business_id, provider, external_id);
create index promotions_business_active_idx on promotions(business_id, active, starts_at, ends_at);
create index coupons_business_code_idx on coupons(business_id, code);
