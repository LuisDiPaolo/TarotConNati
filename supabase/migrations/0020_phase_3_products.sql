create table products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id),
  name text not null,
  description text,
  category text,
  image_url text,
  price_pesos integer not null check (price_pesos > 0),
  stock_quantity integer check (stock_quantity is null or stock_quantity >= 0),
  active boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (name = btrim(name))
);

create table product_orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id),
  customer_id uuid references customers(id),
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  notes text,
  status text not null default 'pending_payment' check (status in ('pending_payment', 'paid', 'cancelled', 'fulfilled')),
  total_pesos integer not null check (total_pesos > 0),
  currency text not null default 'ARS',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  fulfilled_at timestamptz,
  cancelled_at timestamptz
);

create table product_order_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id),
  order_id uuid not null references product_orders(id) on delete cascade,
  product_id uuid not null references products(id),
  product_snapshot jsonb not null,
  quantity integer not null check (quantity > 0),
  unit_price_pesos integer not null check (unit_price_pesos > 0),
  total_pesos integer not null check (total_pesos > 0),
  created_at timestamptz not null default now()
);

alter table payments
  alter column appointment_id drop not null,
  add column product_order_id uuid references product_orders(id),
  add constraint payments_single_source_check check (
    (case when appointment_id is null then 0 else 1 end) +
    (case when product_order_id is null then 0 else 1 end) = 1
  );

create trigger products_set_updated_at before update on products for each row execute function set_updated_at();
create trigger product_orders_set_updated_at before update on product_orders for each row execute function set_updated_at();

insert into features (business_id, feature_key, enabled, pack, requires_migration)
select id, 'products_enabled', false, 'profesional', true
from business
on conflict (business_id, feature_key) do update
set pack = excluded.pack,
    requires_migration = excluded.requires_migration,
    updated_at = now();

alter table products enable row level security;
alter table product_orders enable row level security;
alter table product_order_items enable row level security;

create policy products_public_read on products
  for select
  using (
    active = true
    and has_feature(business_id, 'products_enabled')
  );

create policy products_admin_all on products
  for all
  using (
    business_id = current_admin_business_id()
    and has_feature(business_id, 'products_enabled')
  )
  with check (
    business_id = current_admin_business_id()
    and has_feature(business_id, 'products_enabled')
  );

create policy product_orders_admin_read on product_orders
  for select
  using (
    business_id = current_admin_business_id()
    and has_feature(business_id, 'products_enabled')
  );

create policy product_orders_admin_update on product_orders
  for update
  using (
    business_id = current_admin_business_id()
    and has_feature(business_id, 'products_enabled')
  )
  with check (
    business_id = current_admin_business_id()
    and has_feature(business_id, 'products_enabled')
  );

create policy product_order_items_admin_read on product_order_items
  for select
  using (
    business_id = current_admin_business_id()
    and has_feature(business_id, 'products_enabled')
  );

create index products_business_active_sort_idx on products(business_id, active, sort_order, created_at desc);
create index products_business_category_idx on products(business_id, category);
create index product_orders_business_status_created_idx on product_orders(business_id, status, created_at desc);
create index product_order_items_order_idx on product_order_items(order_id);
create index payments_product_order_id_idx on payments(product_order_id);

insert into notification_event_types (event_key, audience, title, description, default_enabled)
values ('product_order.created', 'panel', 'Nueva compra', 'Avisa al panel cuando entra una compra de producto.', true)
on conflict (event_key) do update set
  audience = excluded.audience,
  title = excluded.title,
  description = excluded.description,
  default_enabled = excluded.default_enabled,
  updated_at = now();
