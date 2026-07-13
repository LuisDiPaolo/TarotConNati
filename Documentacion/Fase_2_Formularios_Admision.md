# Fase 2 - Formularios de admision adjuntos a reservas

Fecha: 2026-07-13

## Objetivo

Permitir que el administrador cree y edite formularios configurables para pedir informacion adicional durante la reserva publica. El formulario puede usarse para datos de contexto como edad, fecha de nacimiento, antecedentes, preferencias, informacion clinica basica no diagnostica, observaciones previas o cualquier dato que el prestador necesite ver junto al turno.

## Alcance funcional

- El panel admin tendra una seccion `Formularios` para crear, editar, activar/desactivar y ordenar preguntas.
- Un formulario puede asociarse al negocio completo o a servicios especificos.
- Durante la reserva publica, al seleccionar un servicio con formulario asociado, el cliente completa esos campos antes de confirmar.
- El panel admin muestra las respuestas dentro del detalle del turno, junto con cliente, servicio, estado, pago y notas internas.
- Las respuestas forman parte del contexto operativo de la reserva; no reemplazan la ficha de cliente ni el historial.

## Tipos de campo iniciales

- Texto corto.
- Texto largo.
- Numero.
- Fecha.
- Selector simple.
- Selector multiple.
- Booleano/checkbox.
- Aceptacion/consentimiento.

Cada campo debe soportar: etiqueta, ayuda opcional, obligatorio/opcional, orden, opciones cuando aplique y validacion basica.

## Modelo de datos propuesto

- `intake_forms`: definicion del formulario por negocio, nombre, descripcion y estado activo.
- `intake_form_fields`: campos del formulario, tipo, orden, obligatoriedad, opciones y validacion.
- `service_intake_forms`: asociacion entre servicios y formularios, para no acoplar un solo formulario fijo al servicio.
- `appointment_intake_responses`: respuestas capturadas para un turno.

Regla importante: `appointment_intake_responses` debe guardar una copia versionada de la definicion usada al reservar (`form_snapshot`) y las respuestas (`response`). Si el admin edita el formulario despues, las reservas historicas siguen mostrando exactamente las preguntas que el cliente respondio en ese momento.

## Seguridad y privacidad

- Toda tabla nace con RLS activado en la misma migracion.
- El publico no escribe directo en Supabase desde el navegador; las respuestas entran por el endpoint server-side de creacion de reserva.
- El endpoint server-side valida las respuestas contra la definicion activa antes de crear el turno.
- El admin solo puede leer formularios y respuestas de su propio `business_id`.
- Las respuestas no se incluyen por defecto en emails, push o mensajes externos; solo se muestran en el panel, salvo que una fase futura defina una regla explicita.
- Campos sensibles deben tener retencion y exportacion pensadas antes de produccion, especialmente si el cliente usa datos de salud, menores de edad o informacion legalmente sensible.

## Criterio de cierre

- El admin puede crear un formulario, agregar campos, asociarlo a un servicio y activarlo.
- La reserva publica renderiza el formulario correspondiente al servicio seleccionado.
- La API rechaza respuestas incompletas o con tipos invalidos.
- El turno creado guarda respuestas y snapshot de formulario.
- El panel muestra esas respuestas en el detalle del turno.
- Lint, typecheck, tests y build pasan sin excepciones.