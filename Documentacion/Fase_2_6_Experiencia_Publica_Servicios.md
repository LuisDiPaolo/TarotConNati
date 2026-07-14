# Fase 2.6 - Experiencia publica de servicios

Fecha: 2026-07-14
Estado: cerrada en desarrollo / implementacion

## Objetivo

Mejorar la landing publica para que el cliente final elija desde un catalogo visual de servicios y complete la reserva dentro de un panel dedicado, sin que el formulario quede mezclado como una continuacion larga de la landing.

## Implementado

### Catalogo visual de servicios

El selector publico de servicios dejo de ser un dropdown como patron primario. En `Reservar turno / Elegi el servicio` ahora se muestran cards por servicio con:

- Imagen cuadrada superior, protagonista, recortada con `object-cover` y contenida por las esquinas superiores de la card.
- Nombre del servicio.
- Categoria.
- Precio visible en la franja inferior derecha de la card.
- Descripcion breve basada en `services.description`.
- Duracion.
- Indicador de pago: seña online, pago online o sin pago online.

En desktop las cards ya no quedan comprimidas en una columna derecha: el bloque de reserva ocupa el ancho de la landing y organiza las cards en grilla.

### Panel de detalle y reserva

Al tocar una card se abre un panel dedicado:

- En mobile/PWA: bottom sheet flotante desde abajo, pegado al borde inferior, casi pantalla completa.
- En desktop: bottom sheet flotante desde abajo, pegado al borde inferior, con ancho maximo controlado.
- El fondo de la pagina queda bloqueado mientras el panel esta abierto; solo scrollea el cuerpo interno del panel.
- El cierre queda disponible por boton `X`, toque en backdrop y tecla `Escape`.

El panel contiene:

- Imagen principal del servicio.
- Nombre, categoria, precio y duracion.
- Politica de pago o seña.
- Descripcion e instrucciones del servicio.
- Horarios disponibles si el servicio agenda automaticamente.
- Campos de solicitud si el servicio no tiene horario exacto.
- Datos del cliente.
- Formularios de admision asociados al servicio.
- Accion final de confirmar reserva o enviar solicitud.

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

## Verificacion y pendientes externos

- Desarrollo e implementacion de Fase 2.6 cerrados en codigo.
- Xcode no reporta errores de navegador para los archivos modificados.
- Queda pendiente externo correr `pnpm typecheck` y build en un entorno donde el comando este permitido.
- Queda recomendado smoke visual final en navegador real para mobile, PWA y desktop antes de release publico.

## Datos futuros a evaluar

- `services.short_description` para separar texto de card y descripcion completa.
- `services.image_alt` si se quiere accesibilidad editorial.
- `services.highlight_label` para etiquetas como `Mas elegido`, `Nuevo`, `Online`.
- Preview real de card publica dentro del panel de servicios.
- Alternativa visual documentada pero no implementada: usar thumbnail cuadrado chico junto al titulo/subtitulo y dejar la franja inferior para precio/duracion/pago, si en una iteracion futura se prioriza mostrar mas servicios por pantalla por encima del protagonismo de imagen.

## Criterio de cierre

La Fase 2.6 queda funcionalmente cerrada cuando:

1. El dropdown deja de ser el patron primario de seleccion publica. Hecho.
2. La landing muestra cards de servicios con precio y descripcion breve. Hecho.
3. El detalle/formulario abre como bottom sheet flotante desde abajo en mobile/PWA y desktop. Hecho.
4. El panel permite cargar imagen por servicio. Hecho.
5. Las imagenes se optimizan en calidad/peso. Hecho.
6. Existe fallback robusto para servicios sin imagen. Hecho.
7. La experiencia queda implementada para temas claro, personalizado y oscuro. Hecho en desarrollo; recomendado smoke visual final antes de release publico.
