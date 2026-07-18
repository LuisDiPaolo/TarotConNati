create table portfolio_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id),
  title text not null,
  description text,
  category text,
  image_url text,
  instagram_url text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (title = btrim(title)),
  check (image_url is not null or instagram_url is not null)
);

create trigger portfolio_items_set_updated_at before update on portfolio_items for each row execute function set_updated_at();

insert into features (business_id, feature_key, enabled, pack, requires_migration)
select id, 'portfolio_enabled', false, 'profesional', true
from business
on conflict (business_id, feature_key) do update
set pack = excluded.pack,
    requires_migration = excluded.requires_migration,
    updated_at = now();

alter table portfolio_items enable row level security;

create policy portfolio_items_public_read on portfolio_items
  for select
  using (
    active = true
    and has_feature(business_id, 'portfolio_enabled')
  );

create policy portfolio_items_admin_all on portfolio_items
  for all
  using (
    business_id = current_admin_business_id()
    and has_feature(business_id, 'portfolio_enabled')
  )
  with check (
    business_id = current_admin_business_id()
    and has_feature(business_id, 'portfolio_enabled')
  );

create index portfolio_items_business_active_sort_idx on portfolio_items(business_id, active, sort_order, created_at desc);
create index portfolio_items_business_category_idx on portfolio_items(business_id, category);
