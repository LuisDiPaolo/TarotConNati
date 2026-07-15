-- Fase 4 - default operativo de notificaciones push
-- Push transaccional queda activo por defecto; solo se desactiva con toggle explicito en Configuracion.

insert into features (business_id, feature_key, enabled, pack, requires_migration)
select id, 'push_enabled', true, 'profesional', true
from business
on conflict (business_id, feature_key) do update
set enabled = true,
    pack = excluded.pack,
    requires_migration = excluded.requires_migration,
    updated_at = now();

insert into app_runtime_config (business_id, key, value, public_readable)
select id, 'push_enabled', 'true', true
from business
on conflict (business_id, key) do update
set value = 'true',
    public_readable = true,
    updated_at = now();
