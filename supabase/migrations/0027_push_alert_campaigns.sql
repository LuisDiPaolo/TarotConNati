create table if not exists push_alert_campaigns (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id) on delete cascade,
  title text not null,
  message text not null,
  target_url text not null default '/',
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'sending', 'sent', 'partial', 'skipped', 'failed', 'cancelled')),
  scheduled_at timestamptz,
  subscriptions_count integer not null default 0,
  delivered_count integer not null default 0,
  removed_count integer not null default 0,
  failed_count integer not null default 0,
  error_message text,
  created_by uuid references admin_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz,
  cancelled_at timestamptz,
  check (title = btrim(title)),
  check (message = btrim(message)),
  check (char_length(title) between 1 and 70),
  check (char_length(message) between 1 and 180),
  check (target_url like '/%' and target_url not like '/api/%' and target_url not like '/panel%'),
  check ((status = 'scheduled' and scheduled_at is not null) or (status <> 'scheduled'))
);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'push_alert_campaigns_set_updated_at') then
    create trigger push_alert_campaigns_set_updated_at before update on push_alert_campaigns for each row execute function set_updated_at();
  end if;
end $$;

alter table push_alert_campaigns enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'push_alert_campaigns' and policyname = 'push_alert_campaigns_admin_read') then
    create policy push_alert_campaigns_admin_read on push_alert_campaigns
      for select
      using (business_id = current_admin_business_id());
  end if;
end $$;

create index if not exists push_alert_campaigns_business_created_idx on push_alert_campaigns(business_id, created_at desc);
create index if not exists push_alert_campaigns_due_idx on push_alert_campaigns(status, scheduled_at) where status = 'scheduled';

insert into features (business_id, feature_key, enabled, pack, requires_migration)
select id, 'push_campaigns_enabled', true, 'comercial', true
from business
on conflict (business_id, feature_key) do update
set enabled = true,
    pack = excluded.pack,
    requires_migration = excluded.requires_migration,
    updated_at = now();
