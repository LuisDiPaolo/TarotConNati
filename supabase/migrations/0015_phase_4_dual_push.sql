alter table push_subscriptions
  add column if not exists customer_id uuid references customers(id) on delete set null,
  add column if not exists appointment_id uuid references appointments(id) on delete set null,
  add column if not exists service_request_id uuid references service_requests(id) on delete set null;

create table if not exists notification_event_types (
  event_key text primary key,
  audience text not null check (audience in ('panel', 'public', 'both')),
  title text not null,
  description text not null default '',
  default_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists admin_notification_preferences (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id) on delete cascade,
  admin_user_id uuid not null references admin_users(id) on delete cascade,
  event_key text not null references notification_event_types(event_key) on delete cascade,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, admin_user_id, event_key)
);

create table if not exists push_notification_records (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id) on delete cascade,
  surface text not null check (surface in ('public', 'panel')),
  customer_id uuid references customers(id) on delete set null,
  appointment_id uuid references appointments(id) on delete set null,
  service_request_id uuid references service_requests(id) on delete set null,
  event_key text not null,
  event_type text not null,
  title text not null,
  body text not null,
  url text,
  payload jsonb not null default '{}'::jsonb,
  delivered_count integer not null default 0,
  failed_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into notification_event_types (event_key, audience, title, description, default_enabled) values
  ('appointment.created', 'panel', 'Nueva reserva', 'Avisa al panel cuando entra una reserva nueva.', true),
  ('appointment.status_changed', 'both', 'Turno actualizado', 'Avisa al panel y al cliente cuando cambia el estado de un turno.', true),
  ('payment.status_changed', 'both', 'Pago actualizado', 'Avisa cuando Mercado Pago confirma o cambia un pago.', true),
  ('service_request.created', 'panel', 'Nueva solicitud', 'Avisa al panel cuando entra una solicitud sin horario.', true),
  ('service_request.status_changed', 'both', 'Solicitud actualizada', 'Avisa al panel y al cliente cuando cambia el estado de una solicitud.', true),
  ('service_request.converted', 'both', 'Solicitud convertida', 'Avisa cuando una solicitud se convierte en turno operativo.', true)
on conflict (event_key) do update set
  audience = excluded.audience,
  title = excluded.title,
  description = excluded.description,
  default_enabled = excluded.default_enabled,
  updated_at = now();

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'notification_event_types_set_updated_at') then
    create trigger notification_event_types_set_updated_at before update on notification_event_types for each row execute function set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'admin_notification_preferences_set_updated_at') then
    create trigger admin_notification_preferences_set_updated_at before update on admin_notification_preferences for each row execute function set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'push_notification_records_set_updated_at') then
    create trigger push_notification_records_set_updated_at before update on push_notification_records for each row execute function set_updated_at();
  end if;
end $$;

alter table notification_event_types enable row level security;
alter table admin_notification_preferences enable row level security;
alter table push_notification_records enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'notification_event_types' and policyname = 'notification_event_types_admin_read') then
    create policy notification_event_types_admin_read on notification_event_types for select using (current_admin_business_id() is not null);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'admin_notification_preferences' and policyname = 'admin_notification_preferences_admin_all') then
    create policy admin_notification_preferences_admin_all on admin_notification_preferences for all using (business_id = current_admin_business_id()) with check (business_id = current_admin_business_id());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'push_notification_records' and policyname = 'push_notification_records_admin_read') then
    create policy push_notification_records_admin_read on push_notification_records for select using (business_id = current_admin_business_id());
  end if;
end $$;

create index if not exists push_subscriptions_public_customer_idx on push_subscriptions(business_id, surface, customer_id) where disabled_at is null and customer_id is not null;
create index if not exists push_subscriptions_public_appointment_idx on push_subscriptions(business_id, surface, appointment_id) where disabled_at is null and appointment_id is not null;
create index if not exists push_subscriptions_public_service_request_idx on push_subscriptions(business_id, surface, service_request_id) where disabled_at is null and service_request_id is not null;
create index if not exists admin_notification_preferences_business_admin_idx on admin_notification_preferences(business_id, admin_user_id);
create index if not exists push_notification_records_business_surface_idx on push_notification_records(business_id, surface, created_at desc);
create index if not exists push_notification_records_customer_idx on push_notification_records(business_id, customer_id, created_at desc) where customer_id is not null;
