# Snapshot fase 2 - estado actual

Fecha: 2026-07-14

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
- `0007_rename_money_columns_to_pesos.sql`: renombra columnas monetarias de centavos a pesos.
- `0008_business_default_theme_mode.sql`: tema inicial configurable por negocio.
- `0009_business_theme_background.sql`: color de fondo configurable para modo `Color`.
- `0010_business_brand_assets.sql`: columnas de logo/iconos y bucket publico `brand-assets`.
- `0011_business_onboarding_pwa_names.sql`: onboarding sin seed, `admin_users.business_id` nullable y nombres PWA configurables.
- `0012_business_logo_variants.sql`: variantes de logo para modo claro y modo oscuro.
- `0013_service_public_images.sql`: imagen publica por servicio (`services.image_url`).

Scripts demo:

- `supabase/seed.sql`: carga negocio demo de tarot evolutivo, servicios, horarios 24 hs, formularios, clientes, turnos y solicitudes mock. Los importes demo estan expresados en pesos.
- `supabase/limpiar-demo-conservar-negocio.sql`: borra servicios, horarios, formularios, clientes, turnos, solicitudes, pagos y push demo, pero conserva negocio, admin, features y runtime config para cargar datos propios desde panel.
- `supabase/borrar-seed.sql`: limpia todo el seed demo, incluyendo negocio, admin, features y runtime config.

Nota monetaria: la migracion `0007_rename_money_columns_to_pesos.sql` renombra las columnas monetarias a `price_pesos`, `deposit_pesos` y `amount_pesos`. Si encuentra columnas viejas `*_cents`, convierte sus valores dividiendo por 100. Los importes se cargan, visualizan y envian a Mercado Pago en pesos.

Orden recomendado para una base nueva:

1. Correr migraciones `0001` a `0013` en orden.
2. Correr `seed.sql` solo si se quiere demo.
3. Correr `borrar-seed.sql` para limpiar demo.

Si `0005` ya fue ejecutada, no repetirla sin `drop policy if exists`, porque Supabase devuelve `policy already exists`.

## Web publica

Implementado:

- Resolucion de negocio por dominio/slug, con fallback que prefiere negocios con assets cargados para no quedar atado al seed demo.
- Aplicacion de colores configurables desde `business.brand_primary`, `brand_accent` y `brand_radius`.
- Logo/identidad visual desde assets del negocio; si hay logo cargado, reemplaza visualmente al titulo grande y deja el `h1` accesible.
- Servicios con agenda: reserva con horario disponible.
- Servicios sin horario: solicitud asincronica sin bloquear agenda.
- Servicios con cobro configurable por el prestador: `Sena`, `Pago total adelantado` o `Sin cobro online`.
- Formularios de admision por servicio.
- Validacion server-side de respuestas de admision.
- Fase 2.6 cerrada en desarrollo: selector publico por cards de servicio con imagen, descripcion, precio, duracion y modo de pago.
- Fallback de imagen de servicio: imagen propia, icono publico del negocio y placeholder visual.
- Detalle/reserva de servicio en bottom sheet flotante desde abajo para mobile/PWA y desktop, con cierre por boton, backdrop y Escape.
- Bloqueo de scroll del documento mientras el panel esta abierto; solo scrollea el cuerpo interno del panel.

Flujo publico esperado actual:

1. Usuario elige servicio.
2. Si el servicio requiere horario, elige slot y crea turno.
3. Si el servicio es sin horario, envia solicitud con fecha/franja opcional.
4. El panel recibe la solicitud.

Fase 2.6 implementacion inicial:

- Reemplazado el dropdown como selector primario por cards de servicio con imagen, titulo, descripcion breve y precio.
- Agregada carga de imagen por servicio desde panel, con recorte cuadrado y optimizacion WebP.
- El detalle del servicio abre como bottom sheet flotante desde abajo en mobile/PWA y desktop, pegado al borde inferior, moviendo requisitos, horarios y formulario al panel del servicio seleccionado.
- El panel bloquea el scroll del documento, conserva el scroll solo dentro del cuerpo del sheet, respeta safe area en PWA y cierra por `X`, backdrop o `Escape`.

## Panel

Secciones implementadas:

- `Turnos`: lista de turnos, alta manual con boton `+`, vista mobile/PWA desplegable, borrado con tachito y confirmacion, cambio de estado y detalle con respuestas extensas.
- `Solicitudes`: bandeja de solicitudes sin horario, cambio de estado, conversion a turno operativo, detalle con respuestas extensas.
- `Servicios`: alta con boton `+`, edicion, borrado/desactivacion con tachito y confirmacion, configuracion de modalidades/politicas de agenda, tipo de cobro al reservar (`Sena`, `Pago total adelantado`, `Sin cobro online`) y carga de imagen publica por servicio.
- `Agenda`: horarios semanales y excepciones existentes.
- `Clientes`: listado y ficha con historial de turnos/solicitudes.
- `Formularios`: formularios de admision y campos.
- `Reportes`: resumen operativo basico.
- `Configuracion`: negocio, URL/dominio, WhatsApp y colores basicos.

Fase 2.5 implementada en codigo:

- Admin ya puede seleccionar tema inicial: `Claro`, `Color` u `Oscuro`.
- El boton de tema alterna `Claro -> Color -> Oscuro` y conserva la preferencia local del usuario.
- Admin ya puede configurar color de fondo de la app para el modo `Color`, separado del color principal y secundario.
- Manifiestos PWA publico/panel ya leen nombre, descripcion, colores e iconos WebP optimizados desde `business`, manteniendo fallback entre assets cargados antes de caer a SVG generico.
- Admin ya cuenta con carga de logo e iconos mediante picker con recorte reutilizado desde `Archive/TEMPORAL 2`, adaptado sin `framer-motion`, con presupuesto de peso por asset.
- Admin puede cargar variantes de logo para modo claro y modo oscuro, ademas del logo principal como fallback.
- El recorte de iconos permite elegir color de fondo solido; se recomienda subir logo sin fondo para generar favicon/PWA/Apple touch con mejor contraste y peso controlado.
- El favicon de desktop usa el mismo icono de app configurado para la PWA correspondiente.
- `/panel/configuracion` permite crear/completar el negocio cuando la sesion no tiene `business_id`, enlazando el admin autenticado.
- Admin puede configurar nombres instalables PWA publico/panel y nombres cortos.
- Configuracion incluye checklist de puesta en marcha y preview PWA/navegador.
- Bucket publico `brand-assets` y endpoint `/api/panel/brand-assets` para guardar PNG/WebP recortados y limpiar versiones anteriores.

Pendiente para cierre operativo de Fase 2.5:

- Aplicar migraciones `0001` a `0012` en Supabase real.
- Probar base limpia sin seed demo y tambien escenario con seed cargado.
- Verificar en navegador limpio que web publica, favicon, manifest, PWA y service worker usan los assets cargados.
- Validaciones server-side de dimensiones reales de assets quedan como hardening futuro; hoy el servidor valida MIME/peso y el cropper controla formato/tamano de salida.
- Policies/RLS de Storage mas estrictas solo si se habilita upload directo desde cliente en el futuro.

Referencia: `Documentacion/Fase_2_5_Onboarding_Identidad_PWA.md`.

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
- Smoke visual final pre-release en navegador real para Fase 2.6 (mobile, PWA y desktop).
- Reemplazar prompts simples por modales para motivos de cancelacion/ausencia.
- Cobro desde solicitudes o turnos operativos.
- Asociar `push_subscriptions` publicas a cliente/turno para enviar push dirigido al cliente correcto.
- Cerrar smoke test operativo de Fase 2.5 en ambiente real: migraciones, base limpia, assets, favicon, manifest, PWA y fallback con seed cargado.
- Endurecer migraciones para re-ejecucion idempotente si se van a copiar manualmente en Supabase.
- Fase 2.6 cerrada en desarrollo/implementacion: selector por cards, imagen por servicio y detalle/formulario como bottom sheet flotante desde abajo en mobile/PWA y desktop ya quedaron implementados. Referencia: `Documentacion/Fase_2_6_Experiencia_Publica_Servicios.md`.

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
