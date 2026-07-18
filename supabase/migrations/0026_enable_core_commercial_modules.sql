insert into features (business_id, feature_key, enabled, pack, requires_migration)
select business.id, feature_flags.feature_key, true, feature_flags.pack, true
from business
cross join (
  values
    ('products_enabled', 'profesional'),
    ('portfolio_enabled', 'profesional'),
    ('promotions_enabled', 'profesional')
) as feature_flags(feature_key, pack)
on conflict (business_id, feature_key) do update
set enabled = true,
    pack = excluded.pack,
    requires_migration = excluded.requires_migration,
    updated_at = now();
