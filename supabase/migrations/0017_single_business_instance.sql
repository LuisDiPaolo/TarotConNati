-- Cada despliegue/Supabase representa un solo negocio canonico.
-- Las futuras sucursales deben modelarse en una tabla separada, no como mas filas de business.

do $$
begin
  if (select count(*) from public.business) > 1 then
    raise exception 'Esta instancia admite un solo negocio. Unificar filas en business antes de aplicar 0017_single_business_instance.';
  end if;
end $$;

create unique index if not exists business_singleton_instance_idx
  on public.business ((true));

comment on index public.business_singleton_instance_idx is
  'Garantiza una sola fila en business por instancia/Supabase. Usar sucursales para multiples ubicaciones.';
