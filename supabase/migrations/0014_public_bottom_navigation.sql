alter table business
  add column if not exists public_bottom_nav_enabled boolean not null default false;
