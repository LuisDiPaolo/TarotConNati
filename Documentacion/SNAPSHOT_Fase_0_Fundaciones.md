# Snapshot Fase 0 - Fundaciones

Fecha: 2026-07-12

## Decisiones fijadas

- Repositorio: un solo monorepo dentro de `TURNOS`.
- App cliente: una sola app Next.js en `apps/web`.
- Superficies:
  - Dominio publico: experiencia publica del negocio.
  - Subdominio `panel.dominio.com.ar`: panel operativo del cliente.
- El panel maestro de Estudio Equis queda fuera de esta implementacion inicial. Es una aplicacion separada para Fase 5.
- Las carpetas `TEMPORAL 1` y `TEMPORAL 2` se usaron solo como referencia tecnica. No se integraron marcas, assets, textos ni modelo de negocio.

## Estructura creada

```txt
TURNOS/
  apps/web/
    src/app/(public)/        Web/PWA publica
    src/app/panel/           Panel operativo
    src/app/auth/            Autenticacion
    src/app/api/             Endpoints server
    src/components/panel/    UI del panel
    src/components/pwa/      Instalabilidad, SW y push
    src/components/layout/   Viewport, safe-area y rotation guard
    src/lib/panel/           Sesion y reglas del panel
    src/lib/payments/        Pagos y webhooks
    src/lib/push/            Push server-side
    src/lib/pwa/             Helpers PWA cliente
    src/lib/supabase/        Clientes Supabase
    src/styles/              Estilos globales
    public/                  Assets neutros y service workers
    tests/e2e/               Validacion local en navegador
  packages/shared/
    src/api/
    src/commerce/
    src/contact/
    src/features/
    src/scheduling/
    src/utils/
  supabase/migrations/
  Documentacion/
```

Mapa detallado: `Documentacion/ESTRUCTURA_PROYECTO.md`.

## Stack fijado

- Node `>=22 <23`
- pnpm `10.32.1`
- Next.js `16.2.9`
- React `19.2.7`
- TypeScript `5.9.3`
- Tailwind CSS `3.4.17`
- Supabase JS `2.84.0`
- Supabase SSR `0.8.0`
- Zod `4.1.13`
- Vitest `4.0.15`
- Playwright `1.57.0`

## Implementado

### Monorepo

- `package.json` raiz con scripts `dev`, `build`, `lint`, `typecheck`, `test`, `test:e2e`, `ci`.
- `pnpm-workspace.yaml`.
- `tsconfig.base.json` con `strict: true`.
- `.gitignore` ignora `TEMPORAL 1/` y `TEMPORAL 2/`.
- CI en `.github/workflows/ci.yml`.

### Shared package

- `packages/shared/src/features/feature-catalog.ts` como fuente unica de feature flags.
- `packages/shared/src/api/errors.ts` con formato `{ error: { code, message } }`.
- `packages/shared/src/utils/format.ts` con `es-AR`, `ARS` y `America/Argentina/Buenos_Aires`.
- Test de catalogo de features.

### Web app

- Proxy por hostname en `apps/web/src/proxy.ts` con convencion Next.js 16.
- Convencion `panel.*` para detectar panel.
- Dominio publico bloquea acceso directo a `/panel`.
- Subdominio `panel.*` reescribe internamente hacia `/panel`.
- Headers de seguridad basicos para panel.
- Manifiesto publico en `/api/pwa/public-manifest`.
- Manifiesto panel en `/api/pwa/panel-manifest`.
- Service worker publico `public/sw-public.js`.
- Service worker panel `public/sw-panel.js`.
- Iconos SVG propios y neutros para ambas superficies.
- Shell publico y shell panel iniciales.
- Pagina `/install` para la PWA publica.
- Pagina `/panel/install` para la PWA panel.

### Auth panel

- Cliente Supabase SSR en `src/lib/supabase/server.ts`.
- Cliente Supabase browser en `src/lib/supabase/browser.ts`.
- Callback OAuth/passwordless en `src/app/auth/callback/route.ts` con `next` restringido a rutas internas.
- Guard server-side `requirePanelSession()` para paginas del panel.
- Login de panel contra Supabase Auth, sin credenciales HMAC heredadas de los temporales.

### Viewport / PWA fixes migrados

Se migraron mecanismos tecnicos observados en los temporales:

- `viewportFit: "cover"` en metadata de Next.
- Script temprano en `head` para setear `--app-height` antes del primer paint.
- `ViewportRuntime` con `visualViewport`, `resize`, `orientationchange`, `pageshow`, `focusin`, `focusout`.
- Resync escalonado al cerrar teclado en iOS PWA para corregir alturas que quedan congeladas.
- Variables CSS:
  - `--app-height`
  - `--app-width`
  - `--app-keyboard-inset`
  - `--app-viewport-offset-top`
  - `--safe-bottom`
  - `--safe-top`
  - `--safe-left`
  - `--safe-right`
  - `--bottom-nav-height`
  - `--app-shell-bottom-padding`
- Shells usando `100dvh` + `max(var(--app-height), 100dvh)`.
- Padding inferior con safe-area para panel y futuras barras inferiores.
- Contrato CSS `.app-bottom-nav` / `[data-app-bottom-nav="true"]` para ocultar barras inferiores cuando el teclado esta abierto.
- `OrientationGuard` neutro para mobile horizontal de baja altura.
- Service workers separados por superficie.
- Limpieza automatica de service workers legacy en localhost/origen compartido para evitar que caches de `TEMPORAL 1` o `TEMPORAL 2` sirvan contenido viejo.
- Handlers `push`, `notificationclick` y `pushsubscriptionchange` en ambos service workers.
- Registro de suscripciones Web Push cuando el usuario ya concedio permiso o lo activa desde `/install` / `/panel/install`.

### Supabase

- Migracion `supabase/migrations/0001_phase_0_core.sql`.
- Tablas core:
  - `business`
  - `admin_users`
  - `features`
  - `services`
  - `schedules`
  - `schedule_overrides`
  - `customers`
  - `appointments`
  - `payments`
- RLS activada en todas las tablas desde la migracion que las crea.
- Funcion `has_feature(p_business_id, p_feature_key)`.
- Funcion `current_admin_business_id()`.
- Funcion `set_updated_at()` y triggers `updated_at` para tablas core y auxiliares.
- Tablas auxiliares migradas desde patrones temporales:
  - `app_runtime_config`
  - `push_subscriptions`
  - `push_delivery_events`
  - `payment_webhook_events`
  - `promotions`
  - `coupons`
- Policies iniciales conservadoras y RLS en tablas auxiliares.
- `supabase/seed.sql` con negocio demo, features, runtime config y servicio/horarios base.

## Auditoria TEMPORAL 1 / TEMPORAL 2

| Area revisada | Decision | Motivo |
|---|---|---|
| Dual PWA por hostname | Adoptado | Aplica directo a Fase 0: dominio publico y `panel.*`. |
| Manifest por superficie | Adoptado | Necesario para instalabilidad separada. |
| Service workers separados | Adoptado | Evita mezclar cache publico/panel. |
| Limpieza de SW legacy | Adoptado | Corrige cache vieja de localhost y evita ver contenido de temporales. |
| `100dvh`, safe-area y `visualViewport` | Adoptado | Corrige bugs iOS Safari/PWA, teclado y home indicator. |
| Guard de orientacion mobile | Adoptado con UI neutra | Mecanismo tecnico valido, sin assets ni branding. |
| Prompt/install PWA | Adoptado con UI neutra | Requisito de shell PWA verificable en Fase 0. |
| Push handlers de SW | Adoptado | `push`, `notificationclick`, renovacion de suscripcion y backend generico. |
| Tablas `push_subscriptions` y eventos push | Adoptado | Infraestructura generica con RLS, sin negocio heredado. |
| HMAC admin login de TEMPORAL 2 | Rechazado | Este producto usa Supabase Auth y RLS por `auth.uid()`. |
| SQL de pedidos/pizzas/contactos | Rechazado | Modelo de negocio ajeno al esquema `business/services/appointments`. |
| Idempotencia MP | Adoptado | Migrada como `payment_webhook_events` contra `payments`/`appointments`. |
| Runtime config generico | Adoptado | Migrado como `app_runtime_config` public-readable controlado por DB. |
| Assets, logos, copy, paletas, tipografias | Rechazado | Prohibido por regla de producto en blanco. |

## Validacion pendiente por restriccion de no-terminal

Necesito que corras desde `TURNOS/`:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Si aparece un error, pasame la salida completa y lo corrijo sin avanzar a Fase 1.

## Checklist Fase 0

- [x] Estructura monorepo base.
- [x] Stack versionado.
- [x] Catalogo unico de features.
- [x] Formato estandar de errores.
- [x] Shell dual PWA por hostname.
- [x] Fixes de viewport/safe-area migrados.
- [x] Install flow PWA publico/panel.
- [x] Auth panel base con Supabase Auth.
- [x] Push Web API extraido de temporales y adaptado al esquema propio.
- [x] Runtime config generico extraido de temporales.
- [x] Webhook Mercado Pago con firma e idempotencia adaptado a turnos.
- [x] Esquema core inicial.
- [x] RLS activada en tablas core.
- [x] `updated_at` automatico en tablas core.
- [x] Seed demo.
- [x] CI configurado.
- [ ] Lint/typecheck/test/build verdes.
- [ ] E2E minimo verde.
- [ ] Verificacion manual PWA publico/panel en Android/desktop/iOS.

## Nota sobre borrado de TEMPORAL 1 y TEMPORAL 2

Ya se extrajeron los patrones tecnicos reutilizables de `TEMPORAL 1` y `TEMPORAL 2`. El detalle completo quedo en `Documentacion/EXTRACCION_TECNICA_TEMPORALES.md`. Cuando `pnpm install`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` y `pnpm test:e2e` esten verdes, las carpetas `TEMPORAL 1` y `TEMPORAL 2` se pueden borrar del repo de trabajo antes de cerrar la plantilla final.
