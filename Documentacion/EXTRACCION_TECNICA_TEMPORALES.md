# Extraccion tecnica de TEMPORAL 1 y TEMPORAL 2

Fecha: 2026-07-12

Este documento registra que se revisaron `TEMPORAL 1` y `TEMPORAL 2` para extraer mecanismos tecnicos reutilizables antes de borrar esas carpetas. No se copiaron marcas, logos, paletas, copy, nombres comerciales ni modelos de negocio ajenos.

## Migrado a TURNOS

| Area | Migracion aplicada |
|---|---|
| PWA dual | Manifiestos separados, service workers separados, deteccion por hostname y subdominio `panel.*`. |
| Limpieza de cache legacy | `unregisterLegacyServiceWorkers()` elimina service workers viejos del mismo origen, especialmente en localhost. |
| Viewport mobile | `ViewportRuntime`, `100dvh`, safe-area, `visualViewport`, resync al cerrar teclado y variables CSS globales. |
| Teclado iOS Safari/PWA | Contrato `.app-bottom-nav` / `[data-app-bottom-nav="true"]` para ocultar barras inferiores al abrir teclado. |
| Orientacion | `OrientationGuard` con asset SVG neutro en `/orientation/rotate-device.svg`, mobile horizontal y `visualViewport`. |
| Instalacion PWA | `/install` y `/panel/install` con `beforeinstallprompt`, instrucciones iOS y accion de notificaciones. |
| Push cliente | Registro de suscripcion si el permiso ya existe o si el usuario lo activa desde install. |
| Push service worker | `push`, `notificationclick` y `pushsubscriptionchange` con renovacion de suscripcion. |
| Push backend | `/api/push/subscribe`, `/api/push/send`, dedupe por `event_key`, limpieza de endpoints vencidos y validacion `has_feature('push_enabled')`. |
| Push SQL | `push_subscriptions` y `push_delivery_events`, ambas con RLS y triggers `updated_at`. |
| Runtime config | `app_runtime_config` con endpoint publico `/api/runtime-config`, valores publicos controlados por DB y RLS. |
| Admin/server auth | Supabase Auth para panel y cliente service-role server-only. No se migro HMAC propio de temporales. |
| Mercado Pago | Firma HMAC `x-signature`, idempotencia en `payment_webhook_events`, contraste de negocio/monto/moneda/referencia y actualizacion de `payments`. |
| SQL transversal | `set_updated_at()` y triggers para tablas core y auxiliares. |
| Promos/cupones | Tablas `promotions` y `coupons`, endpoints publicos de lectura/validacion, helpers de descuentos y normalizacion. |
| Horarios/calendario | Helpers compartidos de business hours, ventanas de reserva, overlap y transiciones de turnos. |
| WhatsApp | Helper compartido y endpoint `/api/contact/whatsapp` para generar links `wa.me` por negocio. |
| Tests | Tests para catalogo de features, hostname, push subscription, firma Mercado Pago, pricing, promociones y horarios. |

## Migrado como patron, no como negocio

| Origen temporal | Que se extrajo | Que no se trajo |
|---|---|---|
| Admin HMAC | La idea de validar server-side y proteger APIs. | Credenciales propias, cookies HMAC, nombres `xhub`/admin anteriores. |
| Push pedidos | Dedupe, endpoint hash, cleanup de 404/410, subscription refresh. | Eventos de pedido, cocina, delivery, tracking de orden. |
| Webhook Mercado Pago | Firma, idempotencia, validacion de monto/moneda. | Tablas `orders`, estados de pizza/pedido, flujo de delivery. |
| Runtime config | Tabla key/value publica controlada por DB. | Config de delivery, horarios de pizzeria, flags de catalogo externo. |
| Viewport fixes | Safe-area, `visualViewport`, `100dvh`, teclado iOS. | Fondos animados, ids visuales, assets o estilos de marca. |
| Install/PWA | Prompt nativo y fallback iOS manual. | Imagenes, QR, textos comerciales o logos. |

## Tablas auxiliares agregadas

| Tabla | Uso | RLS |
|---|---|---|
| `app_runtime_config` | Configuracion runtime publica/controlada del negocio. | Activada; lectura publica solo si `public_readable = true`, admin por negocio. |
| `push_subscriptions` | Suscripciones Web Push por negocio y superficie (`public`/`panel`). | Activada; lectura admin por negocio, escrituras via service-role. |
| `push_delivery_events` | Dedupe, auditoria y estado de envios push. | Activada; lectura admin por negocio, escrituras via service-role. |
| `payment_webhook_events` | Idempotencia y auditoria de webhooks de pago. | Activada; lectura admin por negocio, escrituras via service-role. |
| `promotions` | Promociones activas por ventana de fechas y descuento. | Activada; lectura publica condicionada a `promotions_enabled`, admin por negocio. |
| `coupons` | Cupones por codigo, uso y ventana de fechas. | Activada; lectura publica condicionada a `coupons_enabled`, admin por negocio. |

## Variables nuevas

| Variable | Scope | Uso |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | server-only | Rutas internas que deben escribir tablas con RLS sin exponer secretos. |
| `INTERNAL_API_SECRET` | server-only | Permite llamados internos a `/api/push/send`. |
| `MP_ACCESS_TOKEN` | server-only | Consulta de pagos Mercado Pago desde webhook. |
| `MP_WEBHOOK_SECRET` | server-only | Validacion de firma Mercado Pago. |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | publica | Clave publica Web Push para cliente/service worker. |
| `VAPID_PRIVATE_KEY` | server-only | Envio Web Push desde backend. |
| `VAPID_SUBJECT` | server-only | Subject VAPID para Web Push. |

## Descartado deliberadamente

- Marca, logos, assets, fuentes, colores y copy de proyectos anteriores.
- Modelos de datos de pedidos, productos, cocina, delivery, impresion y tracking.
- Paneles especificos de esos negocios.
- Funciones SQL acopladas a `orders`, `products`, `kitchen`, `delivery` o `print_jobs`.
- Cualquier ruta que dependa de contenido comercial de TEMPORAL 1 o TEMPORAL 2.

## Estado para borrado

Las piezas tecnicas reutilizables ya estan migradas o documentadas en esta plantilla. Antes de borrar `TEMPORAL 1` y `TEMPORAL 2`, falta validar con:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Si esos comandos quedan verdes, las carpetas temporales pueden eliminarse del repo de trabajo.
