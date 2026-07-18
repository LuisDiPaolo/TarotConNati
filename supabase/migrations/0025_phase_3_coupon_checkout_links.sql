alter table appointments
  add column if not exists coupon_id uuid references coupons(id) on delete set null,
  add column if not exists coupon_code text,
  add column if not exists subtotal_pesos integer check (subtotal_pesos is null or subtotal_pesos >= 0),
  add column if not exists discount_pesos integer not null default 0 check (discount_pesos >= 0);

alter table product_orders
  add column if not exists coupon_id uuid references coupons(id) on delete set null,
  add column if not exists coupon_code text,
  add column if not exists subtotal_pesos integer check (subtotal_pesos is null or subtotal_pesos >= 0),
  add column if not exists discount_pesos integer not null default 0 check (discount_pesos >= 0);

alter table product_orders
  drop constraint if exists product_orders_total_pesos_check,
  add constraint product_orders_total_pesos_check check (total_pesos >= 0);

alter table coupon_redemptions
  add column if not exists status text not null default 'confirmed' check (status in ('pending', 'confirmed', 'released')),
  add column if not exists expires_at timestamptz,
  add column if not exists confirmed_at timestamptz,
  add column if not exists released_at timestamptz;

create index if not exists appointments_coupon_id_idx on appointments(coupon_id) where coupon_id is not null;
create index if not exists product_orders_coupon_id_idx on product_orders(coupon_id) where coupon_id is not null;
create unique index if not exists coupon_redemptions_appointment_once_idx on coupon_redemptions(coupon_id, appointment_id) where appointment_id is not null and status <> 'released';
create unique index if not exists coupon_redemptions_product_order_once_idx on coupon_redemptions(coupon_id, product_order_id) where product_order_id is not null and status <> 'released';
create index if not exists coupon_redemptions_pending_expiry_idx on coupon_redemptions(business_id, status, expires_at) where status = 'pending';

create or replace function reserve_coupon_for_checkout(
  p_business_id uuid,
  p_coupon_id uuid,
  p_customer_id uuid,
  p_appointment_id uuid,
  p_product_order_id uuid,
  p_purchaser_name text,
  p_purchaser_phone text,
  p_purchaser_email text,
  p_recipient_name text,
  p_recipient_phone text,
  p_recipient_email text,
  p_discount_pesos integer,
  p_expires_at timestamptz,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'authenticated' and current_admin_business_id() is distinct from p_business_id then
    return jsonb_build_object('ok', false, 'code', 'unauthorized');
  end if;

  if exists (
    select 1
    from coupon_redemptions
    where business_id = p_business_id
      and coupon_id = p_coupon_id
      and status <> 'released'
      and (
        (p_appointment_id is not null and appointment_id = p_appointment_id)
        or (p_product_order_id is not null and product_order_id = p_product_order_id)
      )
  ) then
    return jsonb_build_object('ok', true, 'duplicate', true);
  end if;

  update coupons
  set used_count = used_count + 1
  where id = p_coupon_id
    and business_id = p_business_id
    and active = true
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
    and (usage_limit is null or used_count < usage_limit);

  if not found then
    return jsonb_build_object('ok', false, 'code', 'coupon_not_available');
  end if;

  insert into coupon_redemptions (
    business_id,
    coupon_id,
    customer_id,
    appointment_id,
    product_order_id,
    purchaser_name,
    purchaser_phone,
    purchaser_email,
    recipient_name,
    recipient_phone,
    recipient_email,
    discount_pesos,
    status,
    expires_at,
    metadata
  ) values (
    p_business_id,
    p_coupon_id,
    p_customer_id,
    p_appointment_id,
    p_product_order_id,
    p_purchaser_name,
    nullif(p_purchaser_phone, ''),
    nullif(p_purchaser_email, ''),
    nullif(p_recipient_name, ''),
    nullif(p_recipient_phone, ''),
    nullif(p_recipient_email, ''),
    p_discount_pesos,
    'pending',
    p_expires_at,
    coalesce(p_metadata, '{}'::jsonb)
  );

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function confirm_coupon_for_checkout(
  p_business_id uuid,
  p_coupon_id uuid,
  p_appointment_id uuid,
  p_product_order_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  update coupon_redemptions
  set status = 'confirmed', confirmed_at = coalesce(confirmed_at, now()), expires_at = null
  where business_id = p_business_id
    and coupon_id = p_coupon_id
    and status in ('pending', 'confirmed')
    and (
      (p_appointment_id is not null and appointment_id = p_appointment_id)
      or (p_product_order_id is not null and product_order_id = p_product_order_id)
    );

  if not found then
    return jsonb_build_object('ok', false, 'code', 'coupon_reservation_not_found');
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function release_coupon_for_checkout(
  p_business_id uuid,
  p_coupon_id uuid,
  p_appointment_id uuid,
  p_product_order_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  released_count integer;
begin
  update coupon_redemptions
  set status = 'released', released_at = coalesce(released_at, now())
  where business_id = p_business_id
    and coupon_id = p_coupon_id
    and status = 'pending'
    and (
      (p_appointment_id is not null and appointment_id = p_appointment_id)
      or (p_product_order_id is not null and product_order_id = p_product_order_id)
    );

  get diagnostics released_count = row_count;

  if released_count > 0 then
    update coupons
    set used_count = greatest(used_count - released_count, 0)
    where id = p_coupon_id
      and business_id = p_business_id;
  end if;

  return jsonb_build_object('ok', true, 'released', released_count);
end;
$$;

create or replace function release_expired_coupon_redemptions(p_business_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  released_row record;
  released_count integer := 0;
begin
  for released_row in
    update coupon_redemptions
    set status = 'released', released_at = coalesce(released_at, now())
    where business_id = p_business_id
      and status = 'pending'
      and expires_at is not null
      and expires_at <= now()
    returning coupon_id
  loop
    update coupons
    set used_count = greatest(used_count - 1, 0)
    where id = released_row.coupon_id
      and business_id = p_business_id;
    released_count := released_count + 1;
  end loop;

  return jsonb_build_object('ok', true, 'released', released_count);
end;
$$;

revoke all on function reserve_coupon_for_checkout(uuid, uuid, uuid, uuid, uuid, text, text, text, text, text, text, integer, timestamptz, jsonb) from public;
revoke all on function confirm_coupon_for_checkout(uuid, uuid, uuid, uuid) from public;
revoke all on function release_coupon_for_checkout(uuid, uuid, uuid, uuid) from public;
revoke all on function release_expired_coupon_redemptions(uuid) from public;
grant execute on function reserve_coupon_for_checkout(uuid, uuid, uuid, uuid, uuid, text, text, text, text, text, text, integer, timestamptz, jsonb) to authenticated, service_role;
grant execute on function confirm_coupon_for_checkout(uuid, uuid, uuid, uuid) to authenticated, service_role;
grant execute on function release_coupon_for_checkout(uuid, uuid, uuid, uuid) to authenticated, service_role;
grant execute on function release_expired_coupon_redemptions(uuid) to authenticated, service_role;
