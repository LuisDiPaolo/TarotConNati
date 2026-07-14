-- Agrega el tema inicial configurable del negocio.

begin;

alter table public.business
  add column if not exists default_theme_mode text not null default 'light';

update public.business
set default_theme_mode = 'light'
where default_theme_mode is null
   or default_theme_mode not in ('light', 'brand', 'dark');

alter table public.business
  alter column default_theme_mode set default 'light';

alter table public.business
  alter column default_theme_mode set not null;

alter table public.business
  drop constraint if exists business_default_theme_mode_check;

alter table public.business
  add constraint business_default_theme_mode_check
  check (default_theme_mode in ('light', 'brand', 'dark'));

comment on column public.business.default_theme_mode is 'Tema inicial de la app cuando el usuario aun no eligio preferencia local.';

commit;
