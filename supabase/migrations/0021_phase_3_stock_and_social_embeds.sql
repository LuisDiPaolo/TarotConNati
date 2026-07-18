alter table product_order_items
  add column if not exists stock_decremented_at timestamptz;

alter table product_orders
  drop constraint if exists product_orders_status_check,
  add constraint product_orders_status_check check (status in ('pending_payment', 'paid', 'stock_conflict', 'cancelled', 'fulfilled'));

create or replace function decrement_product_order_stock(p_business_id uuid, p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  order_record product_orders%rowtype;
  item_record record;
  updated_product_id uuid;
begin
  select * into order_record
  from product_orders
  where id = p_order_id
    and business_id = p_business_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'order_not_found');
  end if;

  for item_record in
    select id, product_id, quantity
    from product_order_items
    where business_id = p_business_id
      and order_id = p_order_id
      and stock_decremented_at is null
    order by created_at asc, id asc
    for update
  loop
    update products
    set stock_quantity = case
      when stock_quantity is null then null
      else stock_quantity - item_record.quantity
    end
    where id = item_record.product_id
      and business_id = p_business_id
      and active = true
      and (stock_quantity is null or stock_quantity >= item_record.quantity)
    returning id into updated_product_id;

    if updated_product_id is null then
      return jsonb_build_object(
        'ok', false,
        'code', 'insufficient_stock',
        'product_id', item_record.product_id
      );
    end if;

    update product_order_items
    set stock_decremented_at = now()
    where id = item_record.id
      and business_id = p_business_id;
  end loop;

  return jsonb_build_object('ok', true);
end;
$$;
