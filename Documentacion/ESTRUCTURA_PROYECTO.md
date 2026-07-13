# Estructura del proyecto

Este proyecto vive como un monorepo dentro de `TURNOS`. La separacion busca que se identifique rapido que parte pertenece a la web publica, que parte pertenece al panel administrativo, que parte es backend/API, y que parte es infraestructura reutilizable.

## Raiz

```txt
TURNOS/
  apps/web/              Aplicacion Next.js principal
  packages/shared/       Logica reutilizable compartida
  supabase/              Migraciones SQL, RLS, funciones y seed
  Documentacion/         Especificaciones, decisiones y snapshots
```

## App web

```txt
apps/web/
  src/app/(public)/      Web/PWA publica del negocio en dominio principal
  src/app/panel/         Panel operativo en panel.dominio.com.ar
  src/app/panel/configuracion/ Configuracion de negocio y marca
  src/app/panel/servicios/     Catalogo editable de servicios
  src/app/panel/agenda/        Horarios semanales y excepciones por fecha
  src/app/panel/formularios/   Formularios de admision para adjuntar a reservas (Fase 2)
  src/app/auth/          Callback y rutas de autenticacion
  src/app/install/       Instalacion de la PWA publica
  src/app/api/           Endpoints server de la plataforma
  src/components/panel/  Componentes exclusivos del panel
  src/components/pwa/    Instalabilidad, prompts, service workers y push
  src/components/layout/ Viewport, safe-area, rotation guard y shell helpers
  src/lib/operations/    Operaciones server-side del dominio
  src/lib/panel/         Sesion y reglas server-side del panel
  src/lib/http/          URL base publica, helpers HTTP y callbacks externos
  src/lib/payments/      Mercado Pago, firmas y pagos
  src/lib/push/          Suscripciones y envio server-side de push
  src/lib/pwa/           Helpers PWA del cliente
  src/lib/supabase/      Clientes Supabase server/browser/admin
  src/styles/            Estilos globales y fixes de viewport
  public/                Assets neutros, manifests y service workers
  tests/                 Tests locales automatizados
```

## Tests

```txt
apps/web/tests/
  *.test.ts              Tests unitarios o de integracion con Vitest
  e2e/*.spec.ts          Tests de navegador con Playwright para localhost
```

Los tests `e2e` no son parte funcional del producto. Se mantienen como herramienta local para validar que la web publica y el panel cargan correctamente en navegador. Cuando la plantilla este validada para produccion y si no se van a mantener, pueden eliminarse junto con `playwright.config.ts`, el script `test:e2e` y la dependencia `@playwright/test`.

## Shared

```txt
packages/shared/src/
  api/                   Formato comun de errores
  commerce/              Precios, promociones y cupones
  contact/               Utilidades de contacto externo como WhatsApp
  features/              Catalogo unico de feature flags
  forms/                 Schemas reutilizables de formularios dinamicos (Fase 2)
  scheduling/            Horarios, ventanas y validaciones de turnos
  utils/                 Formato local: es-AR, ARS y zona horaria
```

## Supabase

```txt
supabase/
  migrations/            Esquema, RLS, funciones y politicas
  tests/                 Verificaciones SQL manuales de seguridad/RLS
  seed.sql               Datos minimos de desarrollo
```

Regla fija: toda tabla nueva nace con RLS activado y con politicas en el mismo cambio.

## Temporales

`TEMPORAL 1` y `TEMPORAL 2` son solo fuentes de referencia tecnica. No forman parte del producto final. Todo mecanismo reutilizable extraido queda documentado en `Documentacion/EXTRACCION_TECNICA_TEMPORALES.md`.
