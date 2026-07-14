alter table public.services
  add column if not exists image_url text;

comment on column public.services.image_url is 'Path en Supabase Storage de la imagen publica del servicio.';
