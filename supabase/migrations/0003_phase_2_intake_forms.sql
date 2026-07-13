create table intake_forms (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id),
  name text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table intake_form_fields (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id),
  form_id uuid not null references intake_forms(id) on delete cascade,
  field_key text not null,
  label text not null,
  help_text text,
  field_type text not null check (field_type in ('short_text', 'long_text', 'number', 'date', 'single_select', 'multi_select', 'boolean', 'consent')),
  required boolean not null default false,
  options jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (form_id, field_key),
  check (field_key ~ '^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$'),
  check (jsonb_typeof(options) = 'array')
);

create table service_intake_forms (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id),
  service_id uuid not null references services(id) on delete cascade,
  form_id uuid not null references intake_forms(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (service_id, form_id)
);

create table appointment_intake_responses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id),
  appointment_id uuid not null references appointments(id) on delete cascade,
  form_id uuid not null references intake_forms(id),
  form_snapshot jsonb not null,
  response jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (appointment_id, form_id),
  check (jsonb_typeof(form_snapshot) = 'object'),
  check (jsonb_typeof(response) = 'object')
);

create trigger intake_forms_set_updated_at before update on intake_forms for each row execute function set_updated_at();
create trigger intake_form_fields_set_updated_at before update on intake_form_fields for each row execute function set_updated_at();
create trigger service_intake_forms_set_updated_at before update on service_intake_forms for each row execute function set_updated_at();
create trigger appointment_intake_responses_set_updated_at before update on appointment_intake_responses for each row execute function set_updated_at();

alter table intake_forms enable row level security;
alter table intake_form_fields enable row level security;
alter table service_intake_forms enable row level security;
alter table appointment_intake_responses enable row level security;

create policy intake_forms_public_read on intake_forms for select using (active = true and deleted_at is null);
create policy intake_form_fields_public_read on intake_form_fields for select using (
  exists (
    select 1
    from intake_forms
    where intake_forms.id = intake_form_fields.form_id
      and intake_forms.business_id = intake_form_fields.business_id
      and intake_forms.active = true
      and intake_forms.deleted_at is null
  )
);
create policy service_intake_forms_public_read on service_intake_forms for select using (
  active = true
  and exists (
    select 1
    from intake_forms
    where intake_forms.id = service_intake_forms.form_id
      and intake_forms.business_id = service_intake_forms.business_id
      and intake_forms.active = true
      and intake_forms.deleted_at is null
  )
);

create policy intake_forms_admin_all on intake_forms for all using (business_id = current_admin_business_id()) with check (business_id = current_admin_business_id());
create policy intake_form_fields_admin_all on intake_form_fields for all using (business_id = current_admin_business_id()) with check (business_id = current_admin_business_id());
create policy service_intake_forms_admin_all on service_intake_forms for all using (business_id = current_admin_business_id()) with check (business_id = current_admin_business_id());
create policy appointment_intake_responses_admin_read on appointment_intake_responses for select using (business_id = current_admin_business_id());

create index intake_forms_business_active_idx on intake_forms(business_id, active) where deleted_at is null;
create index intake_form_fields_form_order_idx on intake_form_fields(form_id, sort_order);
create index service_intake_forms_service_active_idx on service_intake_forms(service_id, active);
create index appointment_intake_responses_appointment_idx on appointment_intake_responses(appointment_id);
