create policy business_admin_update
on business
for update
using (id = current_admin_business_id())
with check (id = current_admin_business_id());
