alter table payments
  add column provider_preference_id text,
  add column checkout_url text,
  add column external_reference text;

create index payments_external_reference_idx on payments(external_reference);
create index payments_provider_preference_id_idx on payments(provider_preference_id);
