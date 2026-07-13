-- Renombra columnas monetarias de centavos a pesos.
-- Si encuentra columnas *_cents existentes, tambien convierte sus valores dividiendo por 100.
-- En bases nuevas que ya tengan *_pesos, no modifica importes.

begin;

do $$
declare
  renamed_service_price boolean := false;
  renamed_service_deposit boolean := false;
  renamed_payment_amount boolean := false;
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'services'
      and column_name = 'price_cents'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'services'
      and column_name = 'price_pesos'
  ) then
    alter table public.services rename column price_cents to price_pesos;
    renamed_service_price := true;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'services'
      and column_name = 'deposit_cents'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'services'
      and column_name = 'deposit_pesos'
  ) then
    alter table public.services rename column deposit_cents to deposit_pesos;
    renamed_service_deposit := true;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'payments'
      and column_name = 'amount_cents'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'payments'
      and column_name = 'amount_pesos'
  ) then
    alter table public.payments rename column amount_cents to amount_pesos;
    renamed_payment_amount := true;
  end if;

  if renamed_service_price then
    update public.services
    set price_pesos = round(price_pesos::numeric / 100)::integer;
  end if;

  if renamed_service_deposit then
    update public.services
    set deposit_pesos = round(deposit_pesos::numeric / 100)::integer;
  end if;

  if renamed_payment_amount then
    update public.payments
    set amount_pesos = round(amount_pesos::numeric / 100)::integer;
  end if;
end $$;

do $$
begin
  if exists (select 1 from pg_constraint where conname = 'services_price_cents_check')
    and not exists (select 1 from pg_constraint where conname = 'services_price_pesos_check') then
    alter table public.services rename constraint services_price_cents_check to services_price_pesos_check;
  end if;

  if exists (select 1 from pg_constraint where conname = 'services_deposit_cents_check')
    and not exists (select 1 from pg_constraint where conname = 'services_deposit_pesos_check') then
    alter table public.services rename constraint services_deposit_cents_check to services_deposit_pesos_check;
  end if;

  if exists (select 1 from pg_constraint where conname = 'payments_amount_cents_check')
    and not exists (select 1 from pg_constraint where conname = 'payments_amount_pesos_check') then
    alter table public.payments rename constraint payments_amount_cents_check to payments_amount_pesos_check;
  end if;
end $$;

comment on column public.services.price_pesos is 'Precio total del servicio expresado en pesos.';
comment on column public.services.deposit_pesos is 'Sena del servicio expresada en pesos.';
comment on column public.payments.amount_pesos is 'Importe del pago expresado en pesos.';

commit;
