create table inquiries (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id),
  name text not null,
  phone text,
  email text,
  message text not null,
  source text not null default 'contact_form' check (source in ('contact_form', 'booking_question', 'product_question')),
  status text not null default 'new' check (status in ('new', 'read', 'routed_whatsapp', 'archived')),
  admin_notes text,
  routed_whatsapp_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (phone is not null or email is not null)
);

create trigger inquiries_set_updated_at before update on inquiries for each row execute function set_updated_at();

alter table inquiries enable row level security;

create policy inquiries_admin_all on inquiries
  for all
  using (
    business_id = current_admin_business_id()
    and has_feature(business_id, 'inquiries_enabled')
  )
  with check (
    business_id = current_admin_business_id()
    and has_feature(business_id, 'inquiries_enabled')
  );

create index inquiries_business_status_created_idx on inquiries(business_id, status, created_at desc);
create index inquiries_business_source_idx on inquiries(business_id, source);
