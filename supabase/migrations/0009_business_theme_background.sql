-- Agrega color de fondo configurable para el modo de tema personalizado.

begin;

alter table public.business
  add column if not exists theme_background text not null default '#2563eb';

update public.business
set theme_background = brand_primary
where theme_background is null
   or theme_background = '';

alter table public.business
  alter column theme_background set default '#2563eb';

alter table public.business
  alter column theme_background set not null;

alter table public.business
  drop constraint if exists business_theme_background_check;

alter table public.business
  add constraint business_theme_background_check
  check (theme_background ~ '^#[0-9A-Fa-f]{6}$');

comment on column public.business.theme_background is 'Color de fondo usado por el modo Color personalizado de la app.';

commit;
