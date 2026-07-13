# Snapshot Fase 1 - Nucleo operativo

Fecha: 2026-07-13

## Alcance de este bloque

Este bloque avanza Fase 1 sin incorporar modulos de fases futuras. Quedan fuera: analitica, formularios de admision adjuntos a reservas, portfolio, productos, promociones, push transaccional/campanas, consultas, WhatsApp API, multi-staff, multi-sucursal, waitlist y membresias.

## Implementado

### Reserva publica

- La home publica dejo de ser shell estatico y ahora lee negocio, servicios y disponibilidad desde Supabase.
- `apps/web/src/lib/operations/booking.ts` concentra lectura de negocio, servicios activos, horarios y turnos ocupados.
- `apps/web/src/lib/operations/booking.types.ts` separa tipos compartibles con componentes cliente sin importar archivos `server-only`.
- `apps/web/src/components/public/ReservationForm.tsx` permite elegir servicio, horario y cargar datos del cliente.
- `apps/web/src/app/api/appointments/route.ts` crea reserva desde servidor con validacion Zod, rate limit basico, revalidacion de servicio activo, revalidacion de solapamiento e insercion server-side.

### Pagos / senas

- `apps/web/src/lib/payments/mercado-pago.ts` puede crear preferencias de Checkout Pro.
- Si `MP_ACCESS_TOKEN` existe, la reserva con seña genera preferencia de Mercado Pago y devuelve `checkoutUrl`.
- Si `MP_ACCESS_TOKEN` no existe, el flujo queda como reserva/pago pendiente para desarrollo local sin exponer secretos al cliente.
- El webhook de Mercado Pago actualiza el pago y confirma el turno cuando el estado recibido es `approved`.
- `supabase/migrations/0002_phase_1_operational_core.sql` agrega a `payments`: `provider_preference_id`, `checkout_url` y `external_reference`.

### Panel operativo

- `apps/web/src/components/panel/PanelShell.tsx` unifica la navegacion del panel.
- `apps/web/src/lib/operations/panel-settings.types.ts` separa tipos consumibles por componentes cliente sin importar archivos `server-only`.
- `apps/web/src/app/panel/page.tsx` muestra metricas operativas y tabla real de turnos.
- `apps/web/src/lib/operations/panel-appointments.ts` lee turnos visibles para el admin autenticado mediante RLS.
- `apps/web/src/components/panel/AppointmentsTable.tsx` muestra turnos, cliente, servicio, pago y estado.
- `apps/web/src/app/api/appointments/[appointmentId]/route.ts` permite cambiar estado con sesion requerida y validacion de transiciones.

### Configuracion de negocio

- `apps/web/src/app/panel/configuracion/page.tsx` agrega pantalla propia de negocio y marca.
- `apps/web/src/components/panel/BusinessSettingsForm.tsx` edita nombre, slug, descripcion publica, WhatsApp, dominio publico y tokens visuales basicos.
- `apps/web/src/components/panel/BusinessQrCard.tsx` muestra QR y URL publica de reservas para imprimir o compartir. Por ahora usa generacion externa de QR para evitar dependencia nueva; se puede reemplazar por generacion local antes de produccion si se requiere autosuficiencia total.
- `apps/web/src/app/api/panel/business/route.ts` actualiza la configuracion desde servidor con sesion Supabase y negocio asociado al admin.

### Servicios

- `apps/web/src/app/panel/servicios/page.tsx` agrega pantalla propia para catalogo de servicios.
- `apps/web/src/components/panel/ServicesManager.tsx` permite crear y editar nombre, categoria, duracion, precio, seña, modalidad de pago, orden y estado activo.
- `apps/web/src/app/api/panel/services/route.ts` crea servicios con negocio asociado al admin.
- `apps/web/src/app/api/panel/services/[serviceId]/route.ts` actualiza servicios existentes protegido por sesion y RLS.

### Agenda semanal

- `apps/web/src/app/panel/agenda/page.tsx` agrega pantalla propia para horarios y excepciones.
- `apps/web/src/components/panel/ScheduleManager.tsx` permite crear y editar franjas por dia, apertura, cierre, pausa y estado activo.
- `apps/web/src/components/panel/ScheduleOverridesManager.tsx` permite cerrar fechas puntuales o definir horario excepcional.
- `apps/web/src/app/api/panel/schedules/route.ts` crea horarios asociados al negocio del admin.
- `apps/web/src/app/api/panel/schedules/[scheduleId]/route.ts` actualiza horarios existentes protegido por sesion y RLS.
- `apps/web/src/app/api/panel/schedule-overrides/route.ts` crea o reemplaza excepciones por fecha.
- `apps/web/src/app/api/panel/schedule-overrides/[overrideId]/route.ts` actualiza excepciones existentes.
- `apps/web/src/lib/operations/booking.ts` aplica cierres y horarios excepcionales al generar slots publicos.
- `packages/shared/src/scheduling/slot-availability.ts` concentra la regla pura de horario efectivo por fecha para reducir riesgo en cambios futuros.

### Validacion compartida

- `packages/shared/src/scheduling/reservations.ts` agrega schemas de reserva publica y cambio de estado.
- `packages/shared/src/scheduling/configuration.ts` agrega schemas de negocio, servicios y agenda semanal.
- `packages/shared/src/scheduling/reservations.test.ts` valida payloads de reserva y estados permitidos.
- `packages/shared/src/scheduling/configuration.test.ts` valida slug, dominio publico, precio/seña, pausas de agenda y excepciones por fecha.
- `packages/shared/src/scheduling/slot-availability.test.ts` valida agenda semanal, cierre puntual y horario excepcional.
- `apps/web/tests/base-url.test.ts` valida normalizacion de `APP_BASE_URL` para callbacks y webhooks.

### UI base

- `apps/web/src/styles/globals.css` agrega controles reutilizables del panel: `.input-control`, `.icon-action` y `.panel-nav-link`.

## Seguridad

- La escritura publica de `customers`, `appointments` y `payments` no se hace desde Supabase anon en el navegador.
- El endpoint publico usa service role solo en servidor.
- `MP_ACCESS_TOKEN` se lee exclusivamente en route handler server-side.
- `APP_BASE_URL` permite fijar una URL publica estable para callbacks de Mercado Pago y webhooks detras de proxy.
- Las APIs del panel exigen sesion Supabase y quedan protegidas por RLS.
- Las transiciones de estado se validan con helper compartido, no solo en UI.
- Los schemas compartidos validan formato de slug, colores, horarios, seña/precio y estados antes de escribir.

## Cierre de Fase 1

- La cobertura automatizada incluye schemas, disponibilidad por fecha, firma de Mercado Pago, push, normalizacion de URL base y smoke E2E de superficies publica/panel.
- `supabase/tests/rls_phase_1_manual.sql` deja una verificacion manual de RLS para confirmar que anon no puede escribir turnos directo.
- La validacion final con credenciales reales de Mercado Pago queda como paso operativo de entorno, no como cambio de codigo.

## Validacion requerida

Ejecutar:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Si esos pasan, probar manualmente:

1. Abrir dominio publico local.
2. Crear una reserva con un servicio activo.
3. Entrar al panel autenticado.
4. Ver el turno creado.
5. Cambiar estado pendiente -> confirmado -> realizado, o cancelar desde pendiente/confirmado.
6. Entrar a `/panel/configuracion`, guardar cambios y verificar que la web publica los lea.
7. Entrar a `/panel/servicios`, crear/editar un servicio y verificar disponibilidad publica.
8. Entrar a `/panel/agenda`, crear/editar una franja y verificar que impacte en slots publicos.
