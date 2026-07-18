alter table coupons
  add column if not exists applies_to_services boolean not null default true,
  add column if not exists applies_to_products boolean not null default false,
  add column if not exists validity_type text not null default 'range',
  add column if not exists valid_on_date date,
  add column if not exists valid_weekdays integer[] not null default '{}'::integer[],
  add column if not exists starts_on date,
  add column if not exists ends_on date;

alter table coupons
  drop constraint if exists coupons_discount_type_check,
  drop constraint if exists coupons_discount_value_check,
  drop constraint if exists coupons_scope_check,
  drop constraint if exists coupons_validity_type_check,
  drop constraint if exists coupons_valid_weekdays_check,
  drop constraint if exists coupons_validity_window_check,
  add constraint coupons_discount_type_check check (discount_type in ('percent', 'fixed_amount', 'two_for_one')),
  add constraint coupons_discount_value_check check (
    (discount_type = 'two_for_one' and discount_value = 0)
    or (discount_type <> 'two_for_one' and discount_value > 0)
  ),
  add constraint coupons_scope_check check (applies_to_services = true or applies_to_products = true),
  add constraint coupons_validity_type_check check (validity_type in ('always', 'single_date', 'weekly', 'range')),
  add constraint coupons_valid_weekdays_check check (valid_weekdays <@ array[1, 2, 3, 4, 5, 6, 7]),
  add constraint coupons_validity_window_check check (
    (validity_type = 'always')
    or (validity_type = 'single_date' and valid_on_date is not null)
    or (validity_type = 'weekly' and cardinality(valid_weekdays) between 1 and 7)
    or (validity_type = 'range' and starts_on is not null and ends_on is not null and starts_on <= ends_on)
  );

create or replace function coupon_is_valid_for_date(
  p_validity_type text,
  p_valid_on_date date,
  p_valid_weekdays integer[],
  p_starts_on date,
  p_ends_on date,
  p_target_date date
)
returns boolean
language sql
immutable
as $$
  select case
    when p_validity_type = 'always' then true
    when p_validity_type = 'single_date' then p_valid_on_date = p_target_date
    when p_validity_type = 'weekly' then extract(isodow from p_target_date)::integer = any(coalesce(p_valid_weekdays, '{}'::integer[]))
    when p_validity_type = 'range' then p_target_date between p_starts_on and p_ends_on
    else false
  end;
$$;

create index if not exists coupons_business_scope_idx on coupons(business_id, applies_to_services, applies_to_products, active);
