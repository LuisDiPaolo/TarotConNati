# Fase 2.5 - Onboarding e identidad PWA del negocio

Fecha: 2026-07-13

## Diagnostico

La configuracion actual del panel permite editar datos basicos del negocio: nombre, slug, descripcion, WhatsApp, dominio publico, color principal, color secundario y radio visual.

Eso no alcanza para entregar una PWA comercial autonoma. El cliente necesita poder cargar y mantener la identidad de su negocio desde el panel, sin seed demo y sin intervencion de codigo.

Esta fase no corresponde al panel central de Estudio Equis. El panel central queda para aprovisionamiento multi-cliente, activacion remota de modulos y automatizacion operativa. La identidad del negocio pertenece al panel admin del cliente.

## Donde encaja

Encaja entre Fase 2 y Fase 3.

Motivo: antes de avanzar con presencia digital, portfolio, productos o campanas, la instancia debe poder existir como negocio propio: marca, iconos, manifiestos PWA, URL, textos publicos y estado inicial sin datos demo.

Tambien corrige una deuda de Fase 0/Fase 1: el roadmap ya pedia configuracion de negocio, logo, colores e icono propio, pero la implementacion actual solo cubre una parte basica.

## Objetivo

Que el cliente pueda entrar al panel admin y dejar lista su instancia desde cero:

1. Crear o completar el negocio si no existe una fila valida en `business`.
2. Cargar datos publicos del negocio.
3. Configurar identidad visual completa.
4. Configurar los manifiestos PWA publica y panel con marca propia.
5. Ver un checklist de puesta en marcha para cargar servicios, agenda, formularios, pagos y push.
6. Operar sobre una base limpia sin depender de `seed.sql`.

## Alcance funcional

### Negocio

- Alta/completado del negocio desde `/panel/configuracion` si no existe negocio asociado. Implementado con migracion `0011`.
- Edicion de nombre comercial, slug, descripcion publica, WhatsApp, dominio publico y dominio/prefijo de panel.
- Zona horaria, moneda y locale visibles/configurables cuando deje de ser solo Argentina/ARS.
- Estado de onboarding: incompleto, en revision, listo para publicar.

### Branding

- Upload de logo principal.
- Upload de variantes de logo para modo claro y modo oscuro, con fallback al logo principal.
- Upload o generacion asistida de icono PWA publico.
- Upload o generacion asistida de icono PWA panel.
- Icono maskable para Android.
- Apple touch icon para iOS.
- Picker de color de fondo al generar iconos desde logos sin fondo, recomendado para mejorar contraste y consistencia.
- Color principal, color secundario, color de fondo, radio y preset visual.
- Vista previa publica y vista previa panel antes de guardar. Implementado como preview PWA/navegador en configuracion.

### PWA publica y panel

- Manifest publico dinamico por negocio.
- Manifest panel dinamico por negocio.
- `name`, `short_name`, `description`, `theme_color`, `background_color` e `icons` tomados desde configuracion del negocio.
- Fallback generico solo si el negocio todavia no cargo identidad.
- Service workers separados por superficie, manteniendo el criterio de PWA publica y panel admin independientes.

### Assets

- Bucket de Supabase Storage para assets de marca.
- Politicas RLS/storage para que solo admins del negocio puedan subir/reemplazar assets.
- Validacion de tipo, peso, dimensiones minimas y relacion de aspecto.
- Normalizacion de URLs guardadas en base.

### Puesta en marcha

- Checklist dentro del panel:
  - Negocio y marca.
  - Servicios.
  - Agenda o modalidad sin horario.
  - Formularios de admision.
  - Mercado Pago.
  - Push notifications.
  - Prueba de reserva/solicitud.
- Empty states utiles despues de correr `limpiar-demo-conservar-negocio.sql`.
- Accesos directos con `+` para crear servicios, turnos y formularios donde corresponda.

## Cambios tecnicos esperados

### Base de datos

Agregar campos a `business` o crear una tabla `business_brand_assets` si se prefiere separar identidad de datos operativos:

- `logo_url`
- `logo_light_url`
- `logo_dark_url`
- `public_app_icon_url`
- `panel_app_icon_url`
- `maskable_icon_url`
- `apple_touch_icon_url`
- `public_app_name`
- `panel_app_name`
- `public_short_name`
- `panel_short_name`
- `theme_background`
- `theme_preset`
- `onboarding_status`

Agregar migracion idempotente y actualizar seed demo con assets fallback.

### API

- Endpoint de alta/completado de negocio desde panel.
- Endpoint de upload/reemplazo de assets.
- Endpoints de manifest leyendo negocio por host/slug.
- Validaciones Zod compartidas para identidad y assets.

### Frontend

- Ampliar `/panel/configuracion` de formulario plano a flujo de configuracion del negocio.
- Incorporar upload con preview.
- Mostrar estado de PWA publica y panel.
- Mostrar checklist de configuracion inicial.
- Mantener mobile/PWA como primera condicion de diseno.

## Fuera de alcance

- Panel central multi-cliente de Estudio Equis.
- Automatizacion de creacion de instancias Vercel/Supabase.
- Generacion automatica avanzada de marca.
- Edicion de codigo por cliente.

## Criterio de cierre

La fase se considera cerrada cuando una base limpia puede quedar lista desde el panel:

1. Se corre migracion sin seed demo.
2. Se crea o completa el negocio desde admin.
3. Se suben logo e iconos.
4. La PWA publica instala con nombre e icono propios.
5. La PWA panel instala con nombre e icono propios.
6. La web publica y el panel aplican colores e identidad.
7. El cliente puede cargar servicios propios sin depender de datos demo.
8. Build/typecheck pasan con variables reales.
