alter table product_orders
  add column if not exists stock_reserved_at timestamptz,
  add column if not exists stock_reservation_expires_at timestamptz,
  add column if not exists stock_released_at timestamptz;

alter table product_order_items
  add column if not exists stock_reserved_at timestamptz,
  add column if not exists stock_released_at timestamptz,
  add column if not exists stock_affects_inventory boolean not null default false;

create or replace function reserve_product_order_stock(p_business_id uuid, p_order_id uuid, p_expires_at timestamptz)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  item_group record;
  current_stock integer;
begin
  if auth.role() = 'authenticated' and current_admin_business_id() is distinct from p_business_id then
    return jsonb_build_object('ok', false, 'code', 'unauthorized');
  end if;

  perform 1
  from product_orders
  where id = p_order_id
    and business_id = p_business_id
    and status in ('pending_payment', 'stock_conflict', 'cancelled')
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'order_not_found');
  end if;

  for item_group in
    select product_id, sum(quantity)::integer as quantity
    from product_order_items
    where business_id = p_business_id
      and order_id = p_order_id
      and (stock_reserved_at is null or stock_released_at is not null)
      and stock_decremented_at is null
    group by product_id
  loop
    select stock_quantity into current_stock
    from products
    where id = item_group.product_id
      and business_id = p_business_id
      and active = true
    for update;

    if not found then
      return jsonb_build_object('ok', false, 'code', 'product_not_available', 'product_id', item_group.product_id);
    end if;

    if current_stock is not null and current_stock < item_group.quantity then
      return jsonb_build_object('ok', false, 'code', 'insufficient_stock', 'product_id', item_group.product_id);
    end if;
  end loop;

  for item_group in
    select product_id, sum(quantity)::integer as quantity
    from product_order_items
    where business_id = p_business_id
      and order_id = p_order_id
      and (stock_reserved_at is null or stock_released_at is not null)
      and stock_decremented_at is null
    group by product_id
  loop
    update products
    set stock_quantity = stock_quantity - item_group.quantity
    where id = item_group.product_id
      and business_id = p_business_id
      and stock_quantity is not null;

    update product_order_items
    set stock_reserved_at = now(),
        stock_released_at = null,
        stock_affects_inventory = exists (
          select 1
          from products
          where products.id = product_order_items.product_id
            and products.business_id = p_business_id
            and products.stock_quantity is not null
        )
    where business_id = p_business_id
      and order_id = p_order_id
      and product_id = item_group.product_id
      and (stock_reserved_at is null or stock_released_at is not null)
      and stock_decremented_at is null;
  end loop;

  update product_orders
  set stock_reserved_at = now(),
      stock_reservation_expires_at = p_expires_at,
      stock_released_at = null
  where id = p_order_id
    and business_id = p_business_id;

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function confirm_product_order_stock(p_business_id uuid, p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  reservation_result jsonb;
begin
  if auth.role() = 'authenticated' and current_admin_business_id() is distinct from p_business_id then
    return jsonb_build_object('ok', false, 'code', 'unauthorized');
  end if;

  perform 1
  from product_orders
  where id = p_order_id
    and business_id = p_business_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'order_not_found');
  end if;

  if exists (
    select 1
    from product_order_items
    where business_id = p_business_id
      and order_id = p_order_id
      and (stock_reserved_at is null or stock_released_at is not null)
      and stock_decremented_at is null
  ) then
    reservation_result := reserve_product_order_stock(p_business_id, p_order_id, now() + interval '1 minute');
    if coalesce((reservation_result ->> 'ok')::boolean, false) is not true then
      return reservation_result;
    end if;
  end if;

  update product_order_items
  set stock_decremented_at = coalesce(stock_decremented_at, now())
  where business_id = p_business_id
    and order_id = p_order_id
    and stock_reserved_at is not null
    and stock_released_at is null;

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function release_product_order_stock(p_business_id uuid, p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  item_group record;
begin
  if auth.role() = 'authenticated' and current_admin_business_id() is distinct from p_business_id then
    return jsonb_build_object('ok', false, 'code', 'unauthorized');
  end if;

  perform 1
  from product_orders
  where id = p_order_id
    and business_id = p_business_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'order_not_found');
  end if;

  for item_group in
    select product_id, sum(quantity)::integer as quantity
    from product_order_items
    where business_id = p_business_id
      and order_id = p_order_id
      and stock_reserved_at is not null
      and stock_released_at is null
      and stock_decremented_at is null
      and stock_affects_inventory = true
    group by product_id
  loop
    update products
    set stock_quantity = stock_quantity + item_group.quantity
    where id = item_group.product_id
      and business_id = p_business_id
      and stock_quantity is not null;
  end loop;

  update product_order_items
  set stock_released_at = coalesce(stock_released_at, now())
  where business_id = p_business_id
    and order_id = p_order_id
    and stock_reserved_at is not null
    and stock_released_at is null
    and stock_decremented_at is null;

  update product_orders
  set stock_released_at = coalesce(stock_released_at, now())
  where id = p_order_id
    and business_id = p_business_id
    and exists (
      select 1
      from product_order_items
      where business_id = p_business_id
        and order_id = p_order_id
        and stock_released_at is not null
    );

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function release_expired_product_order_stock(p_business_id uuid, p_now timestamptz default now())
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  order_record record;
  released_count integer := 0;
begin
  if auth.role() = 'authenticated' and current_admin_business_id() is distinct from p_business_id then
    return jsonb_build_object('ok', false, 'code', 'unauthorized');
  end if;

  for order_record in
    select id
    from product_orders
    where business_id = p_business_id
      and status = 'pending_payment'
      and stock_reserved_at is not null
      and stock_released_at is null
      and stock_reservation_expires_at is not null
      and stock_reservation_expires_at <= p_now
    order by stock_reservation_expires_at asc
    limit 100
  loop
    perform release_product_order_stock(p_business_id, order_record.id);
    update product_orders
    set status = 'cancelled',
        cancelled_at = coalesce(cancelled_at, p_now)
    where id = order_record.id
      and business_id = p_business_id
      and status = 'pending_payment';
    released_count := released_count + 1;
  end loop;

  return jsonb_build_object('ok', true, 'released_count', released_count);
end;
$$;

create or replace function decrement_product_order_stock(p_business_id uuid, p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  return confirm_product_order_stock(p_business_id, p_order_id);
end;
$$;

revoke all on function reserve_product_order_stock(uuid, uuid, timestamptz) from public;
revoke all on function confirm_product_order_stock(uuid, uuid) from public;
revoke all on function release_product_order_stock(uuid, uuid) from public;
revoke all on function release_expired_product_order_stock(uuid, timestamptz) from public;
revoke all on function decrement_product_order_stock(uuid, uuid) from public;

grant execute on function reserve_product_order_stock(uuid, uuid, timestamptz) to authenticated, service_role;
grant execute on function confirm_product_order_stock(uuid, uuid) to authenticated, service_role;
grant execute on function release_product_order_stock(uuid, uuid) to authenticated, service_role;
grant execute on function release_expired_product_order_stock(uuid, timestamptz) to authenticated, service_role;
grant execute on function decrement_product_order_stock(uuid, uuid) to authenticated, service_role;
