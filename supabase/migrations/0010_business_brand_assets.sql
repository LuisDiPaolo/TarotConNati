-- Agrega assets de marca y bucket publico para identidad PWA.

begin;

alter table public.business
  add column if not exists logo_url text,
  add column if not exists public_app_icon_url text,
  add column if not exists panel_app_icon_url text,
  add column if not exists maskable_icon_url text,
  add column if not exists apple_touch_icon_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'brand-assets',
  'brand-assets',
  true,
  2097152,
  array['image/png', 'image/webp']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

comment on column public.business.logo_url is 'Path en Supabase Storage del logo principal del negocio.';
comment on column public.business.public_app_icon_url is 'Path en Supabase Storage del icono PWA publico.';
comment on column public.business.panel_app_icon_url is 'Path en Supabase Storage del icono PWA panel.';
comment on column public.business.maskable_icon_url is 'Path en Supabase Storage del icono maskable Android.';
comment on column public.business.apple_touch_icon_url is 'Path en Supabase Storage del Apple touch icon.';

commit;
