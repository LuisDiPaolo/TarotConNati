# Snapshot Fase 2 parcial - Formularios de admision

Fecha: 2026-07-13

## Alcance de este bloque

Este bloque implementa la base reutilizable de formularios de admision adjuntos a reservas. No incluye todavia analitica, reportes, recordatorios por email, ficha completa de cliente ni pantalla de detalle avanzada de turno.

## Implementado

### Modelo y RLS

- `supabase/migrations/0003_phase_2_intake_forms.sql` agrega:
  - `intake_forms`
  - `intake_form_fields`
  - `service_intake_forms`
  - `appointment_intake_responses`
- Todas las tablas nacen con RLS activado.
- El admin solo opera filas de su `business_id`.
- La lectura publica solo expone definiciones activas; nunca respuestas historicas.
- Las respuestas se guardan con `form_snapshot` para preservar la version del formulario usada al reservar.

### Validacion compartida

- `packages/shared/src/forms/intake-forms.ts` define tipos de campos, opciones, schema admin y schema de respuestas publicas.
- `packages/shared/src/scheduling/reservations.ts` acepta `intakeResponses` de forma opcional en la reserva publica.

### Panel admin

- Nueva ruta `/panel/formularios`.
- `apps/web/src/components/panel/IntakeFormsManager.tsx` permite crear/editar formularios, campos y asociaciones a servicios.
- `apps/web/src/app/api/panel/intake-forms/route.ts` crea formularios.
- `apps/web/src/app/api/panel/intake-forms/[formId]/route.ts` actualiza formularios.
- `apps/web/src/lib/operations/panel-intake-forms.ts` centraliza persistencia para crear/editar.
- `apps/web/src/components/panel/PanelShell.tsx` agrega navegacion a Formularios.

### Reserva publica

- `apps/web/src/lib/operations/booking.ts` entrega formularios activos por servicio junto con servicios y slots.
- `apps/web/src/components/public/ReservationForm.tsx` renderiza campos dinamicos segun el servicio elegido.
- `apps/web/src/app/api/appointments/route.ts` valida respuestas contra la definicion activa antes de crear el turno.
- Las respuestas se guardan en `appointment_intake_responses` con snapshot de formulario.

### Panel de turnos

- `apps/web/src/lib/operations/panel-appointments.ts` lee respuestas adjuntas a turnos.
- `apps/web/src/components/panel/AppointmentsTable.tsx` muestra una columna compacta `Info` con las respuestas relevantes.

## Validacion requerida

Ejecutar cuando el entorno lo permita:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Prueba manual sugerida:

1. Entrar a `/panel/formularios`.
2. Crear un formulario con un campo obligatorio y asociarlo a un servicio activo.
3. Ir a la web publica y elegir ese servicio.
4. Confirmar que aparecen las preguntas adicionales.
5. Intentar reservar sin completar un obligatorio y confirmar que se bloquea.
6. Completar la reserva.
7. Verificar que el turno aparece en panel con la columna `Info` completa.

## Pendiente dentro de Fase 2

- Ficha completa de cliente.
- Reportes y analitica basica.
- Registro estructurado de ausencias/cancelaciones con motivo.
- Recordatorios automaticos por email.
- Pantalla de detalle de turno con layout dedicado para respuestas extensas.
