alter table public.business
  add column if not exists logo_light_url text,
  add column if not exists logo_dark_url text;

comment on column public.business.logo_light_url is 'Path en Supabase Storage de la variante del logo para modo claro.';
comment on column public.business.logo_dark_url is 'Path en Supabase Storage de la variante del logo para modo oscuro.';
