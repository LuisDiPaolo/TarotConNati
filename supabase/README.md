# SQL de instancia

Esta instancia Supabase representa un solo negocio canonico. No se crean multiples filas en `business`.

## SQL validos

- `cargar-negocio.sql`: carga o actualiza el negocio real. No carga demo.
- `seed.sql`: carga demo operativo sobre el unico negocio existente. No crea negocio.
- `borrar-seed.sql`: borra demo operativo. No borra negocio.
- `borrar-negocio.sql`: borra negocio y todos los datos de app asociados.

## Flujo limpio desde cero

1. Ejecutar migraciones.
2. Ejecutar `borrar-negocio.sql` si queres limpiar todo lo anterior.
3. Editar CONFIG en `cargar-negocio.sql`.
4. Ejecutar `cargar-negocio.sql`.
5. Ejecutar `seed.sql` solo si queres datos demo.

## Reglas

- `seed.sql` requiere que ya exista exactamente un negocio.
- `borrar-seed.sql` requiere que ya exista exactamente un negocio.
- Si existe mas de una fila en `business`, primero hay que unificar. Panel y web publica deben usar siempre el mismo negocio.
