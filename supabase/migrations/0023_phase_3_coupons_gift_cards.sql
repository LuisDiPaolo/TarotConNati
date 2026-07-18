create table if not exists coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id),
  coupon_id uuid not null references coupons(id),
  customer_id uuid references customers(id),
  appointment_id uuid references appointments(id) on delete set null,
  product_order_id uuid references product_orders(id) on delete set null,
  purchaser_name text not null,
  purchaser_phone text,
  purchaser_email text,
  recipient_name text,
  recipient_phone text,
  recipient_email text,
  discount_pesos integer check (discount_pesos is null or discount_pesos >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (
    (case when appointment_id is null then 0 else 1 end) +
    (case when product_order_id is null then 0 else 1 end) <= 1
  )
);

create table if not exists gift_cards (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id),
  service_id uuid not null references services(id),
  purchaser_customer_id uuid references customers(id),
  purchaser_name text not null,
  purchaser_phone text not null,
  purchaser_email text,
  recipient_name text not null,
  recipient_phone text,
  recipient_email text,
  message text,
  code text not null,
  amount_pesos integer not null check (amount_pesos > 0),
  currency text not null default 'ARS',
  status text not null default 'pending_payment' check (status in ('pending_payment', 'active', 'redeemed', 'cancelled', 'expired')),
  payment_id uuid references payments(id) on delete set null,
  activated_at timestamptz,
  redeemed_at timestamptz,
  cancelled_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, code),
  check (code = upper(code))
);

alter table payments
  add column if not exists gift_card_id uuid references gift_cards(id) on delete set null;

alter table payments
  drop constraint if exists payments_single_source_check,
  add constraint payments_single_source_check check (
    (case when appointment_id is null then 0 else 1 end) +
    (case when product_order_id is null then 0 else 1 end) +
    (case when gift_card_id is null then 0 else 1 end) = 1
  );

create trigger gift_cards_set_updated_at before update on gift_cards for each row execute function set_updated_at();

alter table coupon_redemptions enable row level security;
alter table gift_cards enable row level security;

create policy coupon_redemptions_admin_read on coupon_redemptions
  for select
  using (business_id = current_admin_business_id());

create policy gift_cards_admin_all on gift_cards
  for all
  using (business_id = current_admin_business_id())
  with check (business_id = current_admin_business_id());

create index coupon_redemptions_business_coupon_idx on coupon_redemptions(business_id, coupon_id, created_at desc);
create index coupon_redemptions_appointment_idx on coupon_redemptions(appointment_id) where appointment_id is not null;
create index coupon_redemptions_product_order_idx on coupon_redemptions(product_order_id) where product_order_id is not null;
create index gift_cards_business_status_idx on gift_cards(business_id, status, created_at desc);
create index gift_cards_business_code_idx on gift_cards(business_id, code);
create index gift_cards_service_idx on gift_cards(business_id, service_id);
create index payments_gift_card_id_idx on payments(gift_card_id);

insert into features (business_id, feature_key, enabled, pack, requires_migration)
select id, 'gift_cards_enabled', false, 'comercial', true
from business
on conflict (business_id, feature_key) do update
set pack = excluded.pack,
    requires_migration = excluded.requires_migration,
    updated_at = now();
