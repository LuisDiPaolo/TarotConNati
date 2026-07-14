# Fase 2.6 - Experiencia publica de servicios

Fecha: 2026-07-14
Estado: propuesta documentada / pendiente de implementacion

## Objetivo

Mejorar la landing publica para que el cliente final no empiece desde un dropdown, sino desde un catalogo visual de servicios. La experiencia debe sentirse mas profesional, clara e intuitiva en mobile/PWA y desktop.

## Problema actual

El formulario publico funciona, pero el selector principal de servicios es un dropdown. Esto resuelve la operacion minima, pero limita la presentacion comercial del prestador:

- No permite mostrar servicios como catalogo.
- No permite destacar precio, duracion, imagen o descripcion breve antes de elegir.
- Obliga a leer detalles dentro del formulario.
- En mobile/PWA se siente mas utilitario que una experiencia de reserva profesional.

## Propuesta de UX

### Catalogo de servicios

Reemplazar el dropdown inicial por cards de servicio visibles en la landing.

Cada card deberia mostrar:

- Imagen del servicio, si el prestador la cargo.
- Titulo del servicio.
- Descripcion breve o bajada comercial.
- Precio visible.
- Duracion o modalidad, cuando aplique.
- Indicador de pago: seña, pago total o sin cobro online.

La card no deberia contener todo el formulario. Su funcion es ayudar a elegir.

### Detalle como modal responsive

Al tocar una card, abrir una vista de detalle del servicio:

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

## Datos necesarios

Agregar soporte para imagen por servicio.

Opcion inicial recomendada:

- Columna `services.image_url` como path de Supabase Storage.
- Bucket o carpeta dentro de `brand-assets`/`service-assets`, segun decision de organizacion.
- Endpoint de upload desde panel con recorte/optimizacion similar al de marca.
- Presupuesto sugerido: WebP, 1200x800 o 900x600, peso maximo 220-320 KB.

Campos opcionales a evaluar:

- `services.short_description` para la card.
- `services.image_alt` si se quiere accesibilidad editorial.
- `services.highlight_label` para etiquetas como `Mas elegido`, `Nuevo`, `Online`.

## Impacto en panel admin

En `Servicios`, el prestador deberia poder:

- Cargar o reemplazar imagen del servicio.
- Ver preview de card publica.
- Editar descripcion breve para catalogo.
- Mantener descripcion completa para el detalle/modal.

## Criterios de calidad

- Mobile first: la seleccion de servicio debe ser comoda con el pulgar.
- Bottom sheet con cierre claro, scroll interno y foco accesible.
- Desktop con modal centrado y sin ocupar toda la pantalla.
- El formulario no debe duplicar estado entre servicios.
- Si no hay imagen del servicio, usar fallback visual sobrio: color de marca, icono o patron neutro.
- El layout debe mantener buen contraste en tema claro, personalizado y oscuro.
- No debe bloquear servicios sin horario; esos abren el mismo detalle pero con solicitud asincronica.

## Criterio de cierre

La fase se puede considerar lista cuando:

1. El dropdown deja de ser el patron primario de seleccion publica.
2. La landing muestra cards de servicios con precio y descripcion breve.
3. El detalle abre como bottom sheet en mobile/PWA y como modal centrado en desktop.
4. El formulario se completa dentro del detalle del servicio elegido.
5. El panel permite cargar imagen por servicio.
6. Las imagenes se optimizan en calidad/peso.
7. La experiencia funciona correctamente en temas claro, personalizado y oscuro.
