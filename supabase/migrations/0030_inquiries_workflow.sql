alter table inquiries
  drop constraint if exists inquiries_status_check;

update inquiries
set status = 'answered_whatsapp'
where status = 'routed_whatsapp';

alter table inquiries
  add column if not exists read_at timestamptz,
  add column if not exists answered_at timestamptz,
  add column if not exists answered_channel text,
  add column if not exists converted_at timestamptz,
  add column if not exists appointment_id uuid references appointments(id) on delete set null,
  add column if not exists service_request_id uuid references service_requests(id) on delete set null;

alter table inquiries
  add constraint inquiries_status_check
  check (status in ('new', 'read', 'answered_panel', 'answered_whatsapp', 'converted', 'archived'));

alter table inquiries
  drop constraint if exists inquiries_answered_channel_check;

alter table inquiries
  add constraint inquiries_answered_channel_check
  check (answered_channel is null or answered_channel in ('panel', 'whatsapp'));

update inquiries
set read_at = coalesce(read_at, updated_at)
where status in ('read', 'answered_panel', 'answered_whatsapp', 'converted', 'archived')
  and read_at is null;

update inquiries
set answered_at = coalesce(answered_at, routed_whatsapp_at, updated_at),
    answered_channel = coalesce(answered_channel, 'whatsapp')
where status = 'answered_whatsapp';

update inquiries
set converted_at = coalesce(converted_at, updated_at)
where status = 'converted'
  and converted_at is null;

create index if not exists inquiries_business_search_idx on inquiries(business_id, created_at desc, name, phone, email);
create index if not exists inquiries_business_appointment_idx on inquiries(business_id, appointment_id) where appointment_id is not null;
create index if not exists inquiries_business_service_request_idx on inquiries(business_id, service_request_id) where service_request_id is not null;
