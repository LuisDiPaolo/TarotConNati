alter table services
  add column service_modality text not null default 'in_person' check (service_modality in ('in_person', 'virtual_scheduled', 'virtual_on_demand', 'contact_request')),
  add column scheduling_policy text not null default 'scheduled' check (scheduling_policy in ('scheduled', 'day_request', 'manual_coordination', 'no_calendar_block')),
  add column blocks_calendar boolean not null default true,
  add column buffer_before_minutes integer not null default 0 check (buffer_before_minutes >= 0 and buffer_before_minutes <= 480),
  add column buffer_after_minutes integer not null default 0 check (buffer_after_minutes >= 0 and buffer_after_minutes <= 480),
  add column arrival_instructions text,
  add column virtual_instructions text,
  add column requires_manual_confirmation boolean not null default false,
  add constraint services_calendar_policy_check check (scheduling_policy = 'scheduled' or blocks_calendar = false),
  add constraint services_contact_policy_check check (service_modality <> 'contact_request' or scheduling_policy = 'manual_coordination');

alter table appointments
  add column calendar_starts_at timestamptz,
  add column calendar_ends_at timestamptz;

update appointments
set calendar_starts_at = starts_at,
    calendar_ends_at = ends_at
where calendar_starts_at is null
  or calendar_ends_at is null;

alter table appointments
  alter column calendar_starts_at set not null,
  alter column calendar_ends_at set not null,
  add constraint appointments_calendar_range_check check (calendar_starts_at < calendar_ends_at);

create index appointments_business_calendar_range_idx on appointments(business_id, calendar_starts_at, calendar_ends_at);
create index services_business_modality_idx on services(business_id, service_modality, scheduling_policy);
