# Fase 4 - Push dual y comunicacion

Fecha: 2026-07-15

## Estado

Fase 4 cerrada en desarrollo/implementacion.

Queda pendiente validacion operativa en ambiente real: migraciones `0015` y `0016`, variables VAPID, permiso de navegador/PWA y smoke test con dispositivo real.

## Incluye

- Push dual separado por audiencia: `panel` y `public`.
- Suscripciones publicas vinculadas a `customer_id`, `appointment_id` y `service_request_id`.
- Vinculo seguro: el cliente manda `appointmentId` o `serviceRequestId`, pero el servidor valida negocio y obtiene el `customer_id` real.
- Eventos idempotentes separados por audiencia para evitar que el envio a panel bloquee el envio al cliente.
- Catalogo `notification_event_types` para documentar eventos soportados.
- Tabla `admin_notification_preferences` preparada para preferencias por admin.
- Tabla `push_notification_records` como auditoria de avisos enviados.
- Historial admin en `/panel/notificaciones` con superficie, fecha y entregados/fallidos.
- Push visible con app cerrada: el service worker ejecuta `showNotification()` dentro del evento `push` antes de intentar comunicar ventanas abiertas.
- Servicio de notificaciones activo por defecto, con toggle en Configuracion para desactivarlo por negocio.
- Historial publico local en PWA, alimentado por mensajes del service worker solo cuando hay una ventana abierta.
- Accion manual de recordatorio por WhatsApp desde cada reserva, con texto prearmado y telefono normalizado para Argentina (`549...`, `54...` o numero local).

## Eventos implementados

- `appointment.created`: panel.
- `appointment.status_changed`: panel y cliente.
- `payment.status_changed`: panel y cliente.
- `service_request.created`: panel.
- `service_request.status_changed`: panel y cliente.
- `service_request.converted`: panel y cliente.

## Flujo publico

1. Cliente reserva turno o envia solicitud.
2. La API crea cliente y turno/solicitud.
3. La PWA vincula la suscripcion push existente al turno o solicitud recien creado.
4. Cuando el negocio cambia estado, convierte solicitud o Mercado Pago actualiza pago, el cliente correcto recibe push dirigido.
5. El service worker muestra la notificacion aunque la PWA este cerrada.
6. Si la PWA esta abierta, el service worker tambien guarda el aviso como card horizontal en `Notificaciones`.

## Criterio de smoke test

- Confirmar que `Servicio de notificaciones` este activo en Configuracion y que existan variables VAPID.
- Instalar o abrir PWA publica, conceder permiso de notificaciones.
- Crear una reserva y una solicitud.
- Cambiar estado desde panel.
- Confirmar que el panel recibe su aviso y `/panel/notificaciones` registra el evento.
- Cerrar completamente la PWA publica y confirmar que el cliente recibe aviso separado como notificacion del sistema.
- Abrir la PWA publica y confirmar que el aviso queda guardado en la pestaña `Notificaciones`.
- Desde una reserva con telefono de cliente argentino, abrir el recordatorio por WhatsApp y confirmar que `5491132800536`, `541132800536` y `1132800536` generan un link usable con mensaje prearmado.

## Fuera de alcance

- Campanas push masivas.
- Segmentacion comercial.
- Cupones/gift cards/membresias.
- Centro de preferencias visual completo para cada admin.

Esos puntos quedan para una fase posterior de fidelizacion comercial, no para el cierre tecnico de push dual transaccional.
