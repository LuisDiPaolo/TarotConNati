-- Completa Fase 2.5: onboarding sin seed y nombres PWA configurables.

begin;

alter table public.admin_users
  alter column business_id drop not null;

alter table public.business
  add column if not exists public_app_name text,
  add column if not exists panel_app_name text,
  add column if not exists public_short_name text,
  add column if not exists panel_short_name text,
  add column if not exists onboarding_status text not null default 'incomplete';

alter table public.business
  drop constraint if exists business_onboarding_status_check;

alter table public.business
  add constraint business_onboarding_status_check
  check (onboarding_status in ('incomplete', 'review', 'ready'));

comment on column public.business.public_app_name is 'Nombre instalable de la PWA publica.';
comment on column public.business.panel_app_name is 'Nombre instalable de la PWA del panel.';
comment on column public.business.public_short_name is 'Nombre corto instalable de la PWA publica.';
comment on column public.business.panel_short_name is 'Nombre corto instalable de la PWA del panel.';
comment on column public.business.onboarding_status is 'Estado de puesta en marcha del negocio.';

commit;
