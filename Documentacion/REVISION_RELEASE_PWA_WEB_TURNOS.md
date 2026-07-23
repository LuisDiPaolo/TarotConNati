# Revision release PWA/web turnos

Fecha: 2026-07-21

Alcance: PWA/web de turnos de `TURNOS`, excluyendo Fase 5/panel interno de Estudio Equis. Revision estatica contra archivos implementados. No se ejecuto terminal, migraciones, CI, build ni navegador real.

## Fuente validada

- APIs reales: `apps/web/src/app/api/**/*.ts`.
- Logica server/shared: `apps/web/src/lib/**/*.ts`, `apps/web/src/shared/**/*.ts`.
- SQL: `supabase/migrations/0001` a `0030`, `cargar-negocio.sql`, `seed.sql`, `limpiar-demo.sql`, `borrar-seed.sql`, `borrar-negocio.sql`.
- CI/scripts: `.github/workflows/ci.yml`, `package.json`, `apps/web/package.json`, `apps/web/scripts/check-client-secrets.mjs`.
- Documentacion vigente: snapshots, roadmap, arquitectura y analisis de brechas.

## Hecho y validado contra archivos

### Instancia, dominio y aislamiento

- La app resuelve un unico negocio por instancia desde `resolveBusinessForRequest` y solo acepta host publico configurado, host panel derivado o localhost.
- `0017_single_business_instance.sql` impide mas de una fila en `business` mediante indice singleton.
- El panel se deriva como `panel.<dominio-publico>` y `src/proxy.ts` reescribe rutas de panel con headers basicos: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `X-Robots-Tag`.

### RLS y control de modulos

- Las 33 tablas creadas en migraciones tienen `enable row level security`.
- `has_feature(p_business_id, p_feature_key)` existe desde `0001_phase_0_core.sql`.
- Modulos implementados con doble defensa visible en SQL/API: productos, portfolio, promociones, consultas, cupones, gift cards, push y campanas push.
- APIs publicas y de panel validan feature antes de operar cuando el modulo es opcional.

### Endpoints publicos y abuso basico

- Reservas, solicitudes, consultas, productos y gift cards tienen rate limit por negocio + IP en memoria.
- Todos esos endpoints resuelven negocio por request, validan payload con schemas y revalidan entidad activa antes de escribir.
- Reservas revalidan disponibilidad/solapamiento server-side antes de crear turno.
- Solicitudes no bloquean agenda y solo aceptan servicios sin reserva automatica.

### Pagos, cupones, stock y webhooks

- Mercado Pago crea preferencias para turnos, productos y gift cards cuando corresponde.
- Webhook `api/webhooks/mercado-pago` exige `MP_WEBHOOK_SECRET` y `MP_ACCESS_TOKEN`, verifica firma, registra evento idempotente en `payment_webhook_events`, valida negocio, monto y moneda, y actualiza turno/producto/gift card.
- Stock de productos usa funciones SQL transaccionales con `for update`, reserva temporal, confirmacion y liberacion de expirados.
- Cupones tienen validacion de feature, reglas de vigencia/uso, reserva, confirmacion, liberacion e indices de unicidad para evitar doble uso activo.

### Push y costos backend

- Web Push usa VAPID nativo, sin proveedor pago adicional.
- Envio push filtra por negocio, superficie, customer, appointment o service request cuando aplica.
- Eventos push usan `push_delivery_events.event_key` unico para idempotencia.
- Campanas push programadas procesan hasta 20 por ejecucion y requieren secreto interno/cron.
- Suscripciones vencidas se desactivan con `disabled_at`, reduciendo reintentos futuros.

### Assets y Storage

- `brand-assets` es bucket publico con limite de peso y MIME permitidos desde migracion `0010`.
- Uploads de marca, productos, portfolio y servicios validan sesion/admin, MIME y peso antes de subir.
- Assets nuevos usan cache largo y las rutas de marca/servicio limpian versiones anteriores cuando se reemplazan.

### CI y secretos

- CI existe y corre `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm check:client-secrets` y `pnpm build` en Node 22.
- `check-client-secrets.mjs` falla si un archivo client contiene `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`, `MP_ACCESS_TOKEN`, `RESEND_API_KEY` o `VAPID_PRIVATE_KEY`.
- Busqueda estatica de `process.env` muestra secretos server-only en rutas/lib server y claves `NEXT_PUBLIC_*` donde corresponden.

### Operativa panel y UI cliente

- Servicios: el prestador puede crear, editar, activar/desactivar, quitar de la web publica, configurar modalidad, agenda, pago, precio, senia, buffers, instrucciones e imagen optimizada.
- Turnos: el prestador puede crear turnos manuales, confirmar, completar, marcar ausente, cancelar con motivo, borrar del panel conservando trazabilidad, ver detalle y enviar recordatorio por WhatsApp.
- Solicitudes sin horario: el prestador puede pasar a coordinacion, convertir en turno operativo, cerrar, cancelar y reabrir.
- Consultas publicas: el prestador puede filtrar/buscar, guardar nota interna, marcar leida/respondida, responder por WhatsApp, convertir a turno, archivar y reabrir.
- Productos: el prestador puede crear, editar, activar/desactivar, quitar del catalogo, cargar imagen, manejar stock y cambiar estado de compras a pagada/entregada/cancelada.
- Promociones, cupones, portfolio, gift cards y alertas push: tienen alta, edicion, activacion/publicacion, gestion de estado y baja/quitar visible desde panel cuando el modulo esta activo.
- Formularios, horarios y excepciones de agenda: tienen alta, edicion, activacion/desactivacion cuando aplica y baja visible con confirmacion.
- Clientes: tienen alta manual, edicion de datos/notas, ficha de historial y baja soft conservando trazabilidad operativa.
- Cliente publico: tiene reserva/solicitud, formularios dinamicos, cupones, compra de productos, gift cards, consultas, historial local, cuenta local, notificaciones y barra inferior opcional.

## Pendiente real antes de release

1. Validar pruebas sobre la base actual con migraciones `0001` a `0030` ya aplicadas, sin depender de volver a correrlas.
2. Scripts de limpieza SQL actualizados para cubrir tablas comerciales/push nuevas sin borrar negocio, admin, features ni runtime config.
3. Ejecutar `cargar-negocio.sql`, `seed.sql`, `limpiar-demo.sql`, `borrar-seed.sql` y `borrar-negocio.sql` solo en base de prueba real antes de usarlos sobre datos productivos.
4. Correr CI real con variables de entorno cargadas: lint, typecheck, tests, check de secretos y build.
5. Ejecutar pruebas funcionales de flujos con dinero y agenda: reserva con pago, webhook duplicado, solicitud sin horario, producto con stock, cupon, gift card publica y gift card manual de panel.
6. Smoke manual en navegador/dispositivo real: reserva, solicitud, producto, gift card, consulta, WhatsApp, push panel/public, campana push y CRUD de prestador.
7. QA visual mobile/PWA/desktop: cards de servicios, bottom sheet, barra inferior publica, teclado iOS, safe areas, assets, favicon, manifests, service workers y modales de baja.
8. Validar configuracion productiva minima: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`; y segun modulos `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `INTERNAL_API_SECRET`/`CRON_SECRET`.

## No bloqueante para este release

- Fase 5/panel interno de Estudio Equis.
- Self-service de modulos desde checkout propio de Estudio Equis.
- Multi-staff, multi-sucursal, waitlist, membresias, paquetes de sesiones y Google Calendar.
- WhatsApp API: lo implementado hoy es link `wa.me` manual/prearmado.
- Observabilidad centralizada, backups verificados y monitoreo agregado entre clientes: importantes para operacion, pero no forman parte directa de la PWA aislada ya implementada.

## Correcciones de documentacion detectadas

- Algunos documentos historicos mencionan `limpiar-demo-conservar-negocio.sql`, pero el archivo vigente es `supabase/limpiar-demo.sql`.
- El snapshot de Fase 2 lista migraciones hasta `0016`, pero el repo vigente llega a `0030` e incluye Fase 3/comercial parcial.
