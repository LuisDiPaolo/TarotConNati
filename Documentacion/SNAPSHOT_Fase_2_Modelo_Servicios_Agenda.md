# Snapshot - Fase 2 Modelo avanzado de servicios y agenda

Fecha: 2026-07-13

## Implementado

- Schema compartido extendido en `packages/shared/src/scheduling/configuration.ts`.
- Nuevos enums de servicio:
  - `serviceModality`: `in_person`, `virtual_scheduled`, `virtual_on_demand`, `contact_request`.
  - `schedulingPolicy`: `scheduled`, `day_request`, `manual_coordination`, `no_calendar_block`.
- Nueva migracion `0004_phase_2_service_scheduling_model.sql`.
- Columnas nuevas en `services`:
  - modalidad;
  - politica de agenda;
  - bloqueo de calendario;
  - buffer antes/despues;
  - instrucciones presenciales/virtuales;
  - confirmacion manual.
- Columnas nuevas en `appointments`:
  - `calendar_starts_at`;
  - `calendar_ends_at`.
- Panel de servicios ampliado para configurar modalidad, politica de agenda, buffers, bloqueo e instrucciones.
- API admin de servicios actualizada para persistir el modelo nuevo.
- Disponibilidad publica actualizada para calcular slots con rango real de calendario.
- API de reservas actualizada para guardar rango visible y rango bloqueado.
- Servicios no programables ya no intentan crear turnos automaticos.

## Decisiones

- Los servicios existentes quedan como `in_person + scheduled + blocks_calendar` por default.
- `starts_at` y `ends_at` siguen representando el horario visible del servicio.
- `calendar_starts_at` y `calendar_ends_at` representan el rango real que bloquea disponibilidad.
- Los servicios con `contact_request`, `manual_coordination`, `day_request` o `no_calendar_block` no crean turno automatico por el endpoint actual.

## Pendiente relacionado

- Crear bandeja admin de consultas/contactos.
- Crear endpoint publico para solicitudes no programables.
- Permitir convertir una solicitud/contacto en turno.
- Integrar ruteo a WhatsApp con registro interno.
- Agregar tests automatizados para buffers y no solapamiento.

## Validacion pendiente

No se ejecuto terminal en esta pasada por indicacion del usuario. Validar con:

```bash
pnpm lint
pnpm typecheck
pnpm build
```
