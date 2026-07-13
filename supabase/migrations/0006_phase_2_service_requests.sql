create table service_requests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id),
  customer_id uuid not null references customers(id),
  service_id uuid not null references services(id),
  status text not null default 'pending_review' check (status in ('pending_review', 'pending_coordination', 'converted', 'closed', 'cancelled')),
  contact_channel text not null default 'whatsapp' check (contact_channel in ('whatsapp', 'phone', 'email')),
  preferred_date date,
  preferred_window text,
  customer_notes text,
  admin_notes text,
  converted_appointment_id uuid references appointments(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check ((status = 'converted' and converted_appointment_id is not null) or (status <> 'converted' and converted_appointment_id is null))
);

create table service_request_intake_responses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id),
  service_request_id uuid not null references service_requests(id) on delete cascade,
  form_id uuid references intake_forms(id),
  form_snapshot jsonb not null default '{}'::jsonb,
  response jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table appointment_status_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id),
  appointment_id uuid not null references appointments(id) on delete cascade,
  from_status text,
  to_status text not null check (to_status in ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  reason text,
  created_by uuid,
  created_at timestamptz not null default now()
);

create trigger service_requests_set_updated_at before update on service_requests for each row execute function set_updated_at();

alter table service_requests enable row level security;
alter table service_request_intake_responses enable row level security;
alter table appointment_status_events enable row level security;

create policy service_requests_admin_all on service_requests for all using (business_id = current_admin_business_id()) with check (business_id = current_admin_business_id());
create policy service_request_intake_responses_admin_read on service_request_intake_responses for select using (business_id = current_admin_business_id());
create policy appointment_intake_responses_admin_insert on appointment_intake_responses for insert with check (business_id = current_admin_business_id());
create policy appointment_status_events_admin_all on appointment_status_events for all using (business_id = current_admin_business_id()) with check (business_id = current_admin_business_id());

create index service_requests_business_status_idx on service_requests(business_id, status, created_at desc) where deleted_at is null;
create index service_requests_business_service_idx on service_requests(business_id, service_id, created_at desc) where deleted_at is null;
create index service_request_intake_responses_request_idx on service_request_intake_responses(service_request_id);
create index appointment_status_events_appointment_idx on appointment_status_events(appointment_id, created_at desc);
