-- Manual RLS checks for Phase 1.
-- Run inside a disposable Supabase SQL session after migrations + seed.
-- Expected result: direct anon writes fail, admin-scoped writes require authenticated admin context.

begin;

set local role anon;

-- Public users may read active services/schedules, but must not write operational records directly.
insert into appointments (business_id, customer_id, service_id, starts_at, ends_at, status)
values (
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  now() + interval '1 day',
  now() + interval '1 day 1 hour',
  'pending'
);

rollback;

-- The insert above should be rejected by RLS before rollback.
