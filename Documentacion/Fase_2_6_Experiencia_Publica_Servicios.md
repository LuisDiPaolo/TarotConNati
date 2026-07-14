# Fase 2.6 - Experiencia publica de servicios

Fecha: 2026-07-14
Estado: implementacion inicial aplicada / mejora modal pendiente

## Objetivo

Mejorar la landing publica para que el cliente final no empiece desde un dropdown, sino desde un catalogo visual de servicios. La experiencia debe sentirse mas profesional, clara e intuitiva en mobile/PWA y desktop.

## Implementado

### Catalogo visual de servicios

El selector publico de servicios dejo de ser un dropdown como patron primario. En `Reservar turno / Elegi el servicio` ahora se muestran cards por servicio con:

- Imagen cuadrada superior.
- Nombre del servicio.
- Categoria.
- Precio visible.
- Descripcion breve basada en `services.description`.
- Duracion.
- Indicador de pago: seña online, pago online o sin pago online.

La seleccion sigue alimentando el mismo `serviceId` interno del formulario para no romper las APIs actuales de reserva y solicitud.

### Imagen por servicio

Se agrego soporte para imagen publica por servicio:

- Migracion `0013_service_public_images.sql` con `services.image_url`.
- Lectura publica de `image_url` en `getPublicBookingData`.
- Lectura de panel en `getPanelServices`.
- Upload dedicado en `/api/panel/service-assets`.
- Recorte cuadrado 900x900 desde panel.
- Salida WebP con limite de 260 KB.
- Guardado en Storage dentro de `brand-assets`, bajo `business/{businessId}/services/{serviceId}`.

### Fallback de imagen

El orden de fallback publico queda blindado asi:

1. `services.image_url`, si el prestador cargo imagen propia del servicio.
2. Icono publico del negocio (`public_app_icon_url`).
3. Placeholder visual con icono de imagen.

Esto evita que un servicio quede roto visualmente aunque no tenga imagen propia.

## Pendiente recomendado

### Detalle como modal responsive

La seleccion por cards ya esta implementada, pero el formulario todavia vive debajo del selector dentro del mismo bloque. La siguiente mejora de UX recomendada es que al tocar una card se abra una vista de detalle:

- En mobile/PWA: bottom sheet que entra desde abajo y cubre casi toda la pantalla.
- En desktop: modal centrado, mas acotado, con ancho maximo controlado.

El detalle deberia contener:

- Imagen principal del servicio.
- Nombre, categoria, precio y duracion.
- Descripcion completa.
- Requisitos o instrucciones de llegada/virtuales.
- Politica de pago o seña.
- Horarios disponibles si el servicio agenda automaticamente.
- Campos de formulario del turno/solicitud solo para ese servicio.

## Datos futuros a evaluar

- `services.short_description` para separar texto de card y descripcion completa.
- `services.image_alt` si se quiere accesibilidad editorial.
- `services.highlight_label` para etiquetas como `Mas elegido`, `Nuevo`, `Online`.
- Preview real de card publica dentro del panel de servicios.

## Criterios de calidad

- Mobile first: la seleccion de servicio debe ser comoda con el pulgar.
- Las imagenes deben estar optimizadas para calidad/peso.
- Si no hay imagen del servicio, debe existir fallback visual consistente.
- El layout debe mantener buen contraste en tema claro, personalizado y oscuro.
- No debe bloquear servicios sin horario; esos continúan como solicitud asincronica.
- Editar texto, precio o configuracion de un servicio no debe borrar su imagen cargada.

## Criterio de cierre

La implementacion inicial de Fase 2.6 queda cerrable cuando:

1. El dropdown deja de ser el patron primario de seleccion publica. Hecho.
2. La landing muestra cards de servicios con precio y descripcion breve. Hecho.
3. El panel permite cargar imagen por servicio. Hecho.
4. Las imagenes se optimizan en calidad/peso. Hecho.
5. Existe fallback robusto para servicios sin imagen. Hecho.
6. La experiencia funciona correctamente en temas claro, personalizado y oscuro. Pendiente de verificacion visual final.

La variante completa con bottom sheet/modal queda documentada como mejora posterior.
