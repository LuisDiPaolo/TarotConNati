# Snapshot fase 2 - estado actual

Fecha: 2026-07-13

## Estado general

La fase 2 esta avanzada a nivel funcional, con soporte para servicios calendarizados y servicios sin horario estipulado. El flujo principal ya permite probar una demo de tarot evolutivo con solicitudes asincronicas por WhatsApp, panel operativo, formularios de admision y reportes basicos.

No se considera cerrada hasta correr migraciones, seed, build/typecheck y una prueba completa en entorno con variables reales.

## Base de datos

Migraciones relevantes:

- `0001_phase_0_core.sql`: negocio, admins, servicios, horarios, clientes, turnos, pagos, runtime config, push, promociones/cupones.
- `0002_phase_1_operational_core.sql`: ajustes operativos de fase 1.
- `0003_phase_2_intake_forms.sql`: formularios de admision, campos, asociaciones con servicios y respuestas por turno.
- `0004_phase_2_service_scheduling_model.sql`: modalidades de servicio y politicas de agenda.
- `0005_business_admin_update_policy.sql`: permite actualizar configuracion del negocio desde panel.
- `0006_phase_2_service_requests.sql`: solicitudes sin horario, respuestas de solicitud y eventos de estado de turno.

Scripts demo:

- `supabase/seed.sql`: carga negocio demo de tarot evolutivo, servicios, horarios 24 hs, formularios, clientes, turnos y solicitudes mock.
- `supabase/borrar-seed.sql`: limpia exclusivamente datos del seed demo.

Orden recomendado para una base nueva:

1. Correr migraciones `0001` a `0006` en orden.
2. Correr `seed.sql` solo si se quiere demo.
3. Correr `borrar-seed.sql` para limpiar demo.

Si `0005` ya fue ejecutada, no repetirla sin `drop policy if exists`, porque Supabase devuelve `policy already exists`.

## Web publica

Implementado:

- Resolucion de negocio por dominio/slug.
- Aplicacion de colores configurables desde `business.brand_primary`, `brand_accent` y `brand_radius`.
- Servicios con agenda: reserva con horario disponible.
- Servicios sin horario: solicitud asincronica sin bloquear agenda.
- Servicios con cobro configurable por el prestador: `Sena`, `Pago total adelantado` o `Sin cobro online`.
- Formularios de admision por servicio.
- Validacion server-side de respuestas de admision.

Flujo publico esperado:

1. Usuario elige servicio.
2. Si el servicio requiere horario, elige slot y crea turno.
3. Si el servicio es sin horario, envia solicitud con fecha/franja opcional.
4. El panel recibe la solicitud.

## Panel

Secciones implementadas:

- `Turnos`: lista de turnos, alta manual con boton `+`, vista mobile/PWA desplegable, borrado con tachito y confirmacion, cambio de estado y detalle con respuestas extensas.
- `Solicitudes`: bandeja de solicitudes sin horario, cambio de estado, conversion a turno operativo, detalle con respuestas extensas.
- `Servicios`: alta con boton `+`, edicion, borrado/desactivacion con tachito y confirmacion, configuracion de modalidades/politicas de agenda y tipo de cobro al reservar (`Sena`, `Pago total adelantado`, `Sin cobro online`).
- `Agenda`: horarios semanales y excepciones existentes.
- `Clientes`: listado y ficha con historial de turnos/solicitudes.
- `Formularios`: formularios de admision y campos.
- `Reportes`: resumen operativo basico.
- `Configuracion`: negocio, URL/dominio, WhatsApp y colores.

Estados de solicitudes:

- `pending_review`: para revisar.
- `pending_coordination`: en coordinacion.
- `converted`: convertida a turno operativo.
- `closed`: cerrada sin convertir.
- `cancelled`: cancelada.

Conversion de solicitud:

- Crea un turno operativo confirmado.
- Copia respuestas de formularios desde la solicitud al turno.
- No bloquea agenda ni valida disponibilidad.
- Mantiene `converted_appointment_id` para trazabilidad.

## UI, PWA y theming

Implementado:

- Safe area superior aplicada a web publica y panel para evitar contenido debajo de Dynamic Island/notch.
- Overlay de bloqueo landscape en mobile actualizado a `public/orientation/landscape_overlay.webp`.
- Modo oscuro migrado de slate/azul a escala de grises oscuros en fondo, superficies, bordes y textos secundarios.
- `themeColor` PWA oscuro alineado a negro/gris (`#0a0a0a`).
- Turnos del panel adaptados a mobile/PWA con cards desplegables; la tabla larga queda solo para desktop.
- Acciones destructivas con modal de confirmacion, icono de alerta, boton rojo de borrar y boton de cancelar.

## Push subscriptions

Implementado:

- Infraestructura Web Push con `push_subscriptions`.
- Eventos transaccionales para nueva solicitud, cambio de estado y conversion.
- Eventos transaccionales de panel para reserva creada y estado de pago actualizado por Mercado Pago.
- No se usa email como canal transaccional.

Condiciones para funcionar:

- `push_enabled=true` en `features` del negocio.
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` y `VAPID_SUBJECT` configuradas.
- Navegador con permiso de notificaciones y subscription activa.
- En seed demo, `push_enabled` viene en `false`; hay que activarlo manualmente para probar.

SQL minimo demo para activar push:

```sql
update features
set enabled = true
where business_id = '00000000-0000-4000-8000-000000000001'
  and feature_key = 'push_enabled';

update app_runtime_config
set value = 'true'
where business_id = '00000000-0000-4000-8000-000000000001'
  and key = 'push_enabled';
```

Limitacion actual:

- Las suscripciones `panel` ya pueden recibir notificaciones operativas.
- Las suscripciones `public` existen, pero todavia no estan asociadas a `customer_id` o `appointment_id`; por eso falta una fase corta para push dirigido al cliente correcto sin notificar a todos los visitantes publicos suscriptos.

## Pendientes tecnicos

- Ejecutar build/typecheck con variables reales.
- Probar smoke test completo en navegador.
- Pulir UI visual final.
- Reemplazar prompts simples por modales para motivos de cancelacion/ausencia.
- Cobro desde solicitudes o turnos operativos.
- Asociar `push_subscriptions` publicas a cliente/turno para enviar push dirigido al cliente correcto.
- Onboarding real por cliente, separado del seed demo.
- Endurecer migraciones para re-ejecucion idempotente si se van a copiar manualmente en Supabase.

## Variables necesarias en Vercel

Minimas:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

Segun modulos activos:

- `MP_ACCESS_TOKEN`
- `MP_WEBHOOK_SECRET`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`
- `INTERNAL_API_SECRET`

## Criterio de cierre de fase 2

La fase 2 puede considerarse terminada cuando:

- Migraciones corren limpias en Supabase.
- Seed demo carga y se puede limpiar con `borrar-seed.sql`.
- Build pasa con Node 22 y variables cargadas.
- Se prueba el flujo publico de reserva y solicitud.
- Se prueba panel: servicios, turnos, solicitudes, clientes, reportes y configuracion.
- No hay errores de RLS al guardar desde panel.
