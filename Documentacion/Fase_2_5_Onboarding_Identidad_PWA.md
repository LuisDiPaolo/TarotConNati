# Fase 2.5 - Onboarding e identidad PWA del negocio

Fecha: 2026-07-13
Estado: implementacion completa en codigo. Cierre operativo pendiente de aplicar migraciones en Supabase y hacer smoke test real.

## Objetivo

Que una instancia pueda quedar lista desde el panel admin sin tocar codigo y sin depender del seed demo:

1. Crear o completar el negocio asociado al admin.
2. Cargar identidad visual y assets de marca.
3. Configurar tema inicial, colores y fondo personalizado.
4. Configurar nombres instalables de PWA publica y panel.
5. Usar los assets cargados en web publica, favicon, manifest, PWA y notificaciones.
6. Guiar al admin con checklist de puesta en marcha.

## Implementado

### Negocio y onboarding

- `/panel/configuracion` permite crear o completar el negocio si el admin no tiene `business_id`.
- `admin_users.business_id` puede ser nullable para soportar onboarding inicial.
- El endpoint de negocio usa cliente de sesion para autenticar y service-role para crear/enlazar negocio donde RLS no permite insertar directamente.
- Estado de onboarding: `incomplete`, `review`, `ready`.
- Checklist de puesta en marcha dentro del panel: negocio/marca, servicios, agenda, formularios, pagos, push y prueba de reserva/solicitud.

### Theming

- El boton de tema alterna `Claro -> Color -> Oscuro`.
- El admin puede seleccionar el tema inicial que carga al abrir la app: `light`, `brand` o `dark`.
- El modo `Color` usa `theme_background`, separado de `brand_primary` y `brand_accent`.
- `buildBrandStyle` aplica tokens CSS por negocio.

### Assets de marca

- Bucket publico `brand-assets` en Supabase Storage.
- Endpoint `/api/panel/brand-assets` para subir/reemplazar assets.
- Los assets se guardan como paths en `business`, no como URLs absolutas, y se normalizan al leer.
- Al reemplazar un asset se elimina la version anterior si era path de Storage.
- Validacion actual server-side: tipo MIME y peso maximo.
- Recorte client-side con canvas, drag, pinch/zoom, preview y export optimizado.

Assets soportados:

- `logo_url`: logo principal fallback.
- `logo_light_url`: logo para modo claro/color.
- `logo_dark_url`: logo para modo oscuro.
- `public_app_icon_url`: icono de app publica y favicon publico.
- `panel_app_icon_url`: icono de app panel.
- `maskable_icon_url`: icono maskable Android.
- `apple_touch_icon_url`: Apple touch icon.

Presupuestos actuales:

- Logos: WebP 900x300, hasta 180 KB.
- Iconos PWA publico/panel/maskable: WebP 512x512, hasta 96 KB.
- Apple touch icon: PNG 180x180, hasta 160 KB.

### Iconos con fondo configurable

- Para iconos, el cropper permite elegir un color de fondo solido.
- El fondo se pinta en preview y tambien en el canvas final exportado.
- Recomendacion operativa para el prestador: subir logo PNG/WebP sin fondo y elegir el fondo desde admin.
- Esto evita transparencias problematicas en iOS/PWA y mejora contraste/peso.

### Web publica

- La home publica ya renderiza identidad visual real.
- Prioridad de logo en modo claro/color:
  1. `logo_light_url`
  2. `logo_url`
  3. `public_app_icon_url`
- Prioridad de logo en modo oscuro:
  1. `logo_dark_url`
  2. `logo_url`
  3. `public_app_icon_url`
- CSS cambia entre `brand-logo-light` y `brand-logo-dark` segun `data-theme="dark"`.
- Cuando hay logo o icono publico cargado, reemplaza visualmente al titulo grande de marca; el `h1` queda accesible para lectores de pantalla.
- Si no hay assets, la home conserva el nombre del negocio como titulo visible.

### Manifest, favicon y PWA

- Manifest publico dinamico: `/api/pwa/public-manifest`.
- Manifest panel dinamico: `/api/pwa/panel-manifest`.
- Ambos devuelven `Cache-Control: no-store` para que los cambios de assets se vean al configurar marca.
- `updatePwaHeadLinks` reemplaza en runtime:
  - `manifest`
  - `icon`
  - `shortcut icon`
  - `apple-touch-icon`
- El favicon de desktop usa el mismo icono configurado para la PWA correspondiente.
- Fallback de iconos blindado: si falta el icono especifico, se reutiliza otro asset cargado antes de caer a SVG generico.

Prioridad de icono publico:

1. `public_app_icon_url`
2. `panel_app_icon_url`
3. `maskable_icon_url`
4. SVG fallback

Prioridad de icono panel:

1. `panel_app_icon_url`
2. `public_app_icon_url`
3. `maskable_icon_url`
4. SVG fallback

Maskable:

1. `maskable_icon_url`
2. icono principal elegido
3. SVG fallback

Apple touch:

1. `apple_touch_icon_url`
2. icono principal elegido
3. fallback runtime

### Service workers y cache

- `sw-public.js` subio a cache `turnos-public-v2` y `turnos-public-static-v2`.
- El manifest publico ya no se precachea.
- `sw-panel.js` subio a cache `turnos-panel-v2`.
- Los managers PWA envian los assets elegidos al service worker con `SET_BRAND_ASSETS`.
- Las notificaciones usan `brandAssets.iconUrl` y `brandAssets.maskableIconUrl`, no SVG fijo.

### Seed y resolucion de negocio

Problema detectado: si `seed.sql` queda cargado y el host no matchea exactamente el dominio del negocio editado, la app podia caer al primer negocio creado, normalmente el demo.

Blindaje aplicado:

- `resolveBusinessForHostname` mantiene prioridad por match exacto de `public_domain` o `panel_domain`.
- Si no hay match exacto, busca hasta 10 negocios y prefiere uno con assets cargados.
- `buildBusinessManifest` aplica la misma regla para favicon/PWA.
- Esto evita que los assets cargados queden invisibles por fallback al seed demo.

## Migraciones

Fase 2.5 usa migraciones hasta `0012`:

- `0008_business_default_theme_mode.sql`: tema inicial configurable.
- `0009_business_theme_background.sql`: fondo configurable para modo `Color`.
- `0010_business_brand_assets.sql`: columnas de assets y bucket `brand-assets`.
- `0011_business_onboarding_pwa_names.sql`: onboarding sin seed, `admin_users.business_id` nullable y nombres PWA.
- `0012_business_logo_variants.sql`: variantes `logo_light_url` y `logo_dark_url`.

Orden recomendado en base nueva: `0001` a `0012`.

## Validacion realizada

- `tsc --noEmit` paso correctamente en `apps/web`.
- Xcode Issue Navigator sin errores.

## Pendientes para cierre operativo

La implementacion puede considerarse lista a nivel codigo, pero la fase no deberia marcarse cerrada en producto hasta completar estas pruebas en una base real:

1. Aplicar migraciones `0001` a `0012` en Supabase real.
2. Probar base limpia sin `seed.sql`.
3. Crear/completar negocio desde `/panel/configuracion` con admin real.
4. Subir logo principal, logo claro, logo oscuro, icono publico, icono panel, maskable y Apple touch.
5. Verificar web publica: logo correcto en claro/color/oscuro.
6. Verificar manifest publico y panel con iconos cargados.
7. Verificar favicon desktop con hard refresh o perfil limpio.
8. Instalar PWA publica y panel en mobile/desktop y comprobar nombre/icono.
9. Verificar que service worker actualizado (`v2`) no sirva manifest viejo.
10. Probar con seed cargado y dominio no exacto que el negocio con assets sea el fallback elegido.

## Decision de cierre

Estado recomendado: `Fase 2.5 code complete / pending operational smoke test`.

No marcar como cerrada total hasta ejecutar la prueba real anterior. Si esa prueba pasa, la fase 2.5 se puede cerrar.

Siguiente mejora documentada: `Documentacion/Fase_2_6_Experiencia_Publica_Servicios.md`, enfocada en reemplazar el dropdown publico de servicios por cards visuales, detalle responsive y carga de imagen por servicio.
