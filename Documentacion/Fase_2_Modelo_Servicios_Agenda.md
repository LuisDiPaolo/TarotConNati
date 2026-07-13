# Fase 2 - Modelo avanzado de servicios y agenda

Fecha: 2026-07-13

## Objetivo

Ampliar el modelo de servicios para que no todo sea tratado como un turno presencial con horario fijo. Un servicio puede reservar tiempo real en agenda, requerir coordinacion posterior, resolverse de forma virtual a demanda o funcionar solo como consulta/contacto inicial.

## Conceptos del dominio

### Modalidad del servicio

- `in_person`: servicio presencial.
- `virtual_scheduled`: servicio virtual con fecha y hora pactadas.
- `virtual_on_demand`: servicio virtual que se confirma y se atiende segun disponibilidad del dia o se pasa al dia siguiente.
- `contact_request`: consulta o pedido de alcance; no confirma turno automaticamente.

### Politica de agenda

- `scheduled`: requiere elegir un horario disponible.
- `day_request`: requiere elegir dia o ventana, pero no hora exacta.
- `manual_coordination`: entra como solicitud y el prestador coordina fuera o dentro del panel.
- `no_calendar_block`: no bloquea agenda al crearse.

### Bloqueo de disponibilidad

Cada servicio debe definir si bloquea agenda y por cuanto tiempo:

- `duration_minutes`: duracion operativa del servicio.
- `buffer_before_minutes`: tiempo previo requerido antes del inicio. Ejemplo: llegar 10 minutos antes.
- `buffer_after_minutes`: margen posterior para limpieza, preparacion o cierre.
- `blocks_calendar`: si el servicio ocupa disponibilidad.

La disponibilidad real a bloquear se calcula como:

`starts_at - buffer_before_minutes` hasta `starts_at + duration_minutes + buffer_after_minutes`.

El horario visible para el cliente sigue siendo `starts_at`; los buffers son reglas internas de agenda.

## Casos que debe soportar

### Presencial con horario

Ejemplo: consulta, clase, sesion, turno medico, estetica.

- El cliente elige servicio y horario.
- El sistema verifica horario de atencion, excepciones y solapamientos.
- Se crea turno con `starts_at`, `ends_at`, buffers y estado inicial.
- Si requiere llegada anticipada, la UI publica lo comunica antes de confirmar.

### Virtual con hora pactada

Ejemplo: asesoria por videollamada.

- El cliente elige fecha y hora.
- Bloquea agenda igual que un presencial, pero la modalidad es virtual.
- Puede incluir link de reunion luego de confirmar o quedar pendiente de carga manual por admin.

### Virtual a demanda

Ejemplo: revision rapida, servicio asincronico, entrega digital.

- No necesariamente se elige hora exacta.
- Puede elegir dia, prioridad o ventana.
- El pedido queda `pending_review` o `pending_coordination`.
- No bloquea agenda hasta que el admin lo programe o lo tome.

### Consulta o contacto por WhatsApp/formulario

Ejemplo: el cliente pide presupuesto, alcance o disponibilidad.

- No crea turno confirmado.
- Crea una solicitud en una bandeja de mensajes/consultas del admin.
- Puede abrir WhatsApp con mensaje prearmado, pero tambien debe quedar registro interno.
- El prestador puede convertir esa consulta en reserva/turno si corresponde.

## Datos nuevos esperados en servicios

Campos sugeridos para una migracion futura sobre `services`:

- `service_modality`: enum `in_person | virtual_scheduled | virtual_on_demand | contact_request`.
- `scheduling_policy`: enum `scheduled | day_request | manual_coordination | no_calendar_block`.
- `blocks_calendar`: boolean.
- `duration_minutes`: ya existe; mantener como duracion operativa.
- `buffer_before_minutes`: integer default `0`.
- `buffer_after_minutes`: integer default `0`.
- `arrival_instructions`: texto opcional visible antes de confirmar.
- `virtual_instructions`: texto opcional para servicios virtuales.
- `requires_manual_confirmation`: boolean.

## Estados operativos esperados

El estado de una reserva debe poder distinguir turnos confirmados de solicitudes:

- `pending`: reserva creada pero pendiente de pago o confirmacion.
- `confirmed`: turno confirmado.
- `pending_coordination`: requiere que el admin coordine horario/alcance.
- `pending_review`: solicitud recibida, pendiente de revision.
- `cancelled`: cancelada.
- `completed`: realizada.
- `no_show`: ausente.

## UI/UX esperada

### Panel admin

El editor de servicios debe permitir configurar:

- modalidad: presencial, virtual con hora, virtual a demanda, solicitud/contacto;
- si bloquea agenda;
- duracion;
- buffers antes/despues;
- instrucciones visibles;
- si requiere confirmacion manual;
- formularios asociados.

### Publico/PWA

La pantalla publica debe adaptarse al tipo de servicio:

- servicios con horario muestran selector de turnos;
- servicios por dia muestran selector de dia/ventana;
- solicitudes muestran formulario de contacto y mensaje claro de que no es reserva confirmada;
- WhatsApp abre en nueva conversacion, pero la consulta queda registrada en panel.

## Seguridad y consistencia

- La API decide si un servicio puede reservar horario, no el cliente.
- El calculo de solapamiento debe usar duracion + buffers.
- Un servicio `manual_coordination` no debe crear un turno confirmado automaticamente.
- Las consultas/contactos deben tener rate limit y RLS desde el inicio.
- Toda notificacion al prestador debe salir desde servidor, nunca desde el cliente con secretos.

## Criterio de cierre

- El panel permite configurar servicios con las modalidades anteriores.
- La reserva publica cambia el flujo segun modalidad/politica de agenda.
- Los turnos con buffer no se solapan incorrectamente.
- Las solicitudes de contacto aparecen en una bandeja del admin.
- El admin puede convertir una solicitud en turno cuando corresponda.
- Lint, typecheck, tests y build pasan sin excepciones.
