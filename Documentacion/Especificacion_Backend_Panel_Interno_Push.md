# Especificación Técnica Extendida — Backend, Panel Interno y Ampliaciones al Panel del Cliente

*Complementa: "Análisis de Producto y Brechas". Este documento detalla el diseño de las piezas identificadas como bloqueantes/importantes: enforcement de flags en backend, panel interno de Estudio Equis, y 3 módulos nuevos para el panel del cliente (Consultas + WhatsApp, Gestión visual, Push dual).*

---

## 1. Enforcement de módulos a nivel backend (no solo frontend)

Hoy el flag solo oculta UI. Hay que moverlo a **dos capas de defensa**, cada una independiente de la otra:

### 1.1 Capa de base de datos — RLS con función de verificación

```sql
-- Función reutilizable: ¿el negocio tiene el feature activo?
create or replace function has_feature(p_business_id uuid, p_feature_key text)
returns boolean
language sql
security definer
stable
as $$
  select coalesce(
    (select enabled from features
     where business_id = p_business_id and feature_key = p_feature_key),
    false
  );
$$;
```

Cada tabla de módulo opcional lleva su propia policy de escritura condicionada al flag:

```sql
-- Ejemplo: products (products_enabled)
create policy "products_write_requires_flag"
on products for insert
with check ( has_feature(business_id, 'products_enabled') );

create policy "products_write_requires_flag_upd"
on products for update
using ( has_feature(business_id, 'products_enabled') );
```

Se replica el mismo patrón para: `products`, `portfolio_items`, `promotions`, `campaigns`, `coupons`, `gift_cards`, `packages`, `push_campaigns`, tablas de segmentación, etc. La lectura pública puede quedar más permisiva si corresponde (ej. mostrar el portfolio ya cargado aunque se desactive el módulo después), pero **la escritura siempre valida contra el flag en DB**, no solo en el cliente.

### 1.2 Capa de API / server actions

Aun con RLS, cada endpoint o server action que dispare lógica más allá de un simple insert (ej. generar un cupón, calcular un descuento, disparar una campaña push) debe repetir la validación explícitamente al inicio de la función — nunca confiar en que "si llegó hasta acá es porque el frontend lo permitió":

```ts
export async function createCoupon(input: CouponInput) {
  const enabled = await hasFeature(input.businessId, 'coupons_enabled');
  if (!enabled) throw new ForbiddenError('Módulo no contratado');
  // ... lógica de creación
}
```

### 1.3 Invalidación y consistencia

- Al activar/desactivar un módulo desde el panel interno (ver sección 2), se escribe en `features` **y** se invalida cualquier caché de flags que tenga el cliente en edge/CDN (revalidación por tag, no por tiempo fijo).
- Recomendado: test automatizado de "flag apagado ⇒ 403 en API" para cada módulo, como parte del pipeline de CI, no solo QA manual.

---

## 2. Panel interno de Estudio Equis (meta-admin)

Esta es la pieza que hoy falta (roadmap la ubica en Fase 5, pero conviene adelantar una versión mínima ni bien haya 5-10 clientes, porque es lo que evita que cada activación de módulo dependa de acceso manual ad-hoc).

**Es una aplicación separada**, no un módulo dentro del panel del cliente — la usa solo el equipo de Estudio Equis, con acceso a metadatos de todas las instancias (no a los datos operativos de cada negocio, salvo lo estrictamente necesario).

### 2.1 Estructura de datos propia (base de datos central de Estudio Equis, separada de las instancias de clientes)

| Tabla | Contenido |
|---|---|
| `clients` | Negocio, contacto, pack contratado, estado (trial/activo/suspendido), fecha de alta |
| `client_instances` | Proyecto Vercel, ref de Supabase, `public_domain`, `admin_domain` (subdominio `admin.` separado — ver arquitectura dual de PWA), versión de plantilla desplegada |
| `client_features` | Espejo de qué módulos tiene activados cada cliente (para reporting, sin tocar la DB del cliente directamente salvo al activar) |
| `provisioning_tasks` | Checklist de aprovisionamiento por cliente (cuentas creadas, migración corrida, config cargada, deploy hecho, dominio asignado, acceso entregado) con estado y responsable |
| `access_grants` | Auditoría: cuándo se accedió temporalmente a Vercel/Supabase/Mercado Pago de un cliente, quién, motivo, cuándo se revocó |
| `support_notes` | Bitácora de soporte por cliente |
| `billing_records` | Registro de pagos recibidos (implementación, módulos, mantenimiento) — aunque el cobro en sí sea manual al inicio |
| `version_registry` | Versión de plantilla maestra vigente, changelog, qué clientes están desactualizados |

### 2.2 Funcionalidades mínimas

1. **Directorio de clientes**: buscar/filtrar por pack, estado, módulos activos, versión de plantilla.
2. **Activación remota de módulos**: un botón que, para un cliente puntual, escribe el flag en su tabla `features` (vía conexión con service role a esa instancia específica) y dispara el deploy si el módulo requiere una versión nueva. Este es el paso que hoy se hace "a mano"; acá se centraliza y se deja registro.
3. **Checklist de aprovisionamiento**: convierte los pasos 40-49 del roadmap en tareas con estado, para no depender de memoria/planillas sueltas.
4. **Panel de versiones**: qué clientes corren qué versión, para poder planificar migraciones en lote en vez de una por una.
5. **Auditoría de accesos temporales**: cada vez que se pide acceso a cuentas de un cliente queda registrado (fecha, motivo, quién, si fue revocado) — esto además **refuerza la narrativa de seguridad** que ya está en los documentos comerciales.
6. **Alertas agregadas**: errores/caídas reportados por instancia (una vez que exista la capa de observabilidad mencionada en el análisis anterior), visibles en un solo lugar.
7. **Bitácora de soporte y pagos**: para no perder trazabilidad de qué se cobró y qué se prometió a cada cliente.

> Este panel es, en sí mismo, un diferencial defendible frente a competidores: convierte el "esto se gestiona manualmente" en un proceso operativo real, que es justamente lo que sostiene la promesa de "escalable por módulos" del modelo de negocio.

### 2.3 Cómo llega el panel central a instancias que no son suyas

El panel vive en un dominio propio del operador (ej. `estudioequis.com.ar`) y **no comparte infraestructura con ninguna instancia de cliente** — cada cliente sigue teniendo su propio Vercel y Supabase, tal como está definido en la Arquitectura Modular. La conexión hacia afuera se resuelve con dos piezas:

**Bóveda de credenciales.** Por cada cliente se guarda, encriptado en reposo (con una clave de gestión separada, tipo KMS — nunca en texto plano en la propia base), el `service_role key` de su proyecto Supabase y un token de la API de Vercel de su proyecto. El `service_role` bypassea RLS, así que el panel puede escribir directo en la tabla `features` de esa instancia sin pedir acceso cada vez que se activa un módulo.

**Motor de acción.** Es la capa que efectivamente llama a las APIs externas: a Supabase (REST/Admin API) para prender o apagar un flag, y a Vercel (Deployments API) para disparar un redeploy cuando el módulo requiere una versión nueva de código — sin entrar manualmente a la consola de cada proveedor.

Con esto, el patrón "acceso temporal manual" descrito en el roadmap original (pedir acceso, ejecutar, revocar) queda reservado solo para intervenciones de soporte que sí requieren entrar a la consola visual de un proveedor. Las operaciones rutinarias (activar módulo, verificar estado, forzar redeploy) las hace el panel con su propia credencial persistente — pero **auditada**: cada acción queda registrada en `access_grants` (quién, cuándo, sobre qué cliente, qué se hizo), de forma que centralizar credenciales no signifique perder trazabilidad.

**Costo de esta centralización:** un panel comprometido pone en riesgo a todos los clientes a la vez, no a uno solo — es el trade-off de ganar velocidad operativa. Por eso el panel debería tratarse con el mismo nivel de exigencia que un sistema financiero: 2FA obligatorio para quien lo usa, rotación periódica de credenciales, y alcance mínimo necesario por rol si en el futuro hay más de una persona operándolo.

```
estudioequis.com.ar (panel central)
 ├─ Bóveda de claves ── credenciales encriptadas, una por cliente
 └─ Motor de acción  ── llama a Supabase Admin API / Vercel API
       │                          │
       ▼                          ▼
  Cliente A                  Cliente B
  (su Vercel + Supabase,     (su Vercel + Supabase,
   aislado)                   aislado)
```

---

## 3. Ampliaciones al panel del cliente (cada instancia de negocio)

### 3.1 Bandeja de consultas + ruteo a WhatsApp (sin API)

**Objetivo**: que las consultas que llegan desde la web pública queden centralizadas en el panel, sin depender de que el visitante mande un mail.

**Modelo de datos**

```sql
create table inquiries (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id),
  name text not null,
  phone text,
  email text,
  message text not null,
  source text default 'contact_form', -- contact_form | booking_question | product_question
  status text default 'new', -- new | read | routed_whatsapp | archived
  created_at timestamptz default now()
);
```

**Frontend público**: formulario de contacto simple (nombre, teléfono/email, mensaje) en la PWA pública, independiente del flujo de reserva — no requiere autenticación del visitante. Feature flag propio: `inquiries_enabled` (podría venir en el núcleo, dado el bajo costo de desarrollo y el alto valor percibido).

**Panel admin**: nueva sección "Consultas", listado tipo bandeja de entrada:
- Filtro por estado (nuevas / leídas / archivadas).
- Al abrir una consulta: datos del contacto + mensaje.
- Botón **"Abrir en WhatsApp"**: genera un link `wa.me` con el teléfono del contacto y un mensaje precargado, sin usar WhatsApp Business API (cero costo, cero aprobación de Meta, funciona con cualquier número):

```ts
function buildWhatsAppLink(phone: string, contextMessage: string) {
  const clean = phone.replace(/\D/g, ''); // normalizar a solo dígitos, con código de país
  const text = encodeURIComponent(contextMessage);
  return `https://wa.me/${clean}?text=${text}`;
}
```

- El mensaje precargado puede armarse con contexto automático, ej.: *"Hola [Nombre], vi tu consulta sobre '[primeras palabras del mensaje]'..."* — el profesional edita antes de enviar, WhatsApp abre en pestaña nueva o en la app si es mobile.
- Al usar el botón, el sistema marca la consulta como `routed_whatsapp` automáticamente (queda registro de que se atendió, sin depender de que el profesional vuelva a marcarla).

**Reutilización**: el mismo `buildWhatsAppLink` sirve para otros puntos del panel donde ya existe un teléfono de cliente — por ejemplo, contactar a un cliente sobre un turno próximo, o sobre una cancelación — sin duplicar lógica.

### 3.2 Gestión visual completa

Ya existe la base (variables CSS: `--color-primary`, `--color-accent`, `--color-bg`, `--font-heading`, `--font-body`, `--border-radius`). Para que sea "gestión visual completa" y no solo colores/tipografía, conviene sumar:

| Elemento | Qué se gestiona desde el panel |
|---|---|
| **Media library** | Subida y organización de imágenes (logo, portada, galería, productos) con reemplazo/eliminación, sin tocar código. Ya existe Supabase Storage como base técnica. |
| **Presets de tema** | 3-5 combinaciones predefinidas de color/tipografía para elegir con un clic, además de la personalización manual — reduce fricción para clientes sin criterio de diseño. |
| **Orden de secciones** | Si la landing pública muestra servicios, portfolio, promociones, etc., permitir reordenar qué se ve primero (drag-and-drop simple), no un orden fijo en código. |
| **Vista previa en vivo** | Antes de publicar cambios visuales, ver cómo queda la web pública (mobile y desktop) sin salir del panel. |
| **Textos configurables** | Título, descripción del negocio, textos de secciones — ya contemplado en `identity`, conviene asegurarse de que cubra todos los textos visibles y no solo nombre/logo. |

Todo esto sigue el mismo principio ya definido en la arquitectura: cambios de configuración, no de código — cero intervención de Estudio Equis para estos ajustes.

### 3.3 Push notifications — sistema dual (público + admin), extensible

Hoy el roadmap ya prevé `push_subscriptions` y `push_enabled`/`push_campaigns_enabled`, pero pensado solo para clientes finales. Hace falta **separar dos audiencias con sus propias suscripciones**, porque tienen necesidades distintas y vencimientos/permisos independientes.

#### Modelo de datos

```sql
-- Suscripciones del público (clientes finales del negocio)
create table push_subscriptions_public (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id),
  customer_id uuid references customers(id),
  endpoint text not null,
  keys jsonb not null, -- p256dh, auth (Web Push API)
  created_at timestamptz default now()
);

-- Suscripciones del/los administrador(es)
create table push_subscriptions_admin (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id),
  admin_user_id uuid not null references admin_users(id),
  endpoint text not null,
  keys jsonb not null,
  created_at timestamptz default now()
);

-- Catálogo extensible de tipos de evento (para no tocar schema cada vez que se agrega un caso)
create table notification_event_types (
  key text primary key,          -- 'appointment_created', 'appointment_cancelled', 'inquiry_received', ...
  audience text not null,        -- 'public' | 'admin'
  default_enabled boolean default true
);

-- Preferencias del admin: qué tipos de notificación quiere recibir
create table admin_notification_preferences (
  admin_user_id uuid references admin_users(id),
  event_key text references notification_event_types(key),
  enabled boolean default true,
  primary key (admin_user_id, event_key)
);
```

#### Por qué separarlas

- **Distinto ciclo de vida**: un cliente final se suscribe una vez y puede no volver a interactuar por meses; el admin usa el panel a diario y necesita notificaciones más inmediatas y accionables.
- **Distintos permisos de navegador**: son dos "apps" PWA diferentes (la pública y el panel admin), cada una con su propio manifest/service worker, por lo tanto piden permiso de notificación por separado — es la forma nativa de resolverlo con Web Push API, sin necesidad de infraestructura adicional.
- **Distinto contenido/tono**: al público le interesa "tu turno es mañana a las 15hs"; al admin le interesa "nueva consulta de Juan", "turno cancelado por María", "cambiaste el horario del jueves — revisá turnos afectados".

#### Eventos previstos para el público (`audience = 'public'`)

- Confirmación de turno reservado.
- Recordatorio (ej. 24hs y/o 2hs antes).
- Cancelación o reprogramación por parte del negocio.
- (Ya contemplado en el roadmap original como `push_enabled`.)

#### Eventos previstos para el admin (`audience = 'admin'`) — ampliando lo solicitado

- Nueva consulta recibida (vínculo directo con la bandeja de la sección 3.1).
- Nuevo turno reservado.
- Turno cancelado o modificado por el cliente final.
- Recordatorio de turnos del día / próxima hora (agenda del día).
- Cambios en agenda/horarios que generan conflicto con turnos ya confirmados (alerta preventiva).
- Pago de seña confirmado por Mercado Pago (webhook recibido).
- **Extensible a futuro sin tocar arquitectura**: al ser un catálogo (`notification_event_types`) y no un enum fijo en código, agregar un nuevo tipo de aviso (ej. "stock bajo" cuando se sume un módulo de inventario más adelante) es una fila nueva en la tabla, no una migración de schema ni un release.

#### Flujo de disparo

1. Ocurre un evento en el sistema (insert en `appointments`, `inquiries`, webhook de Mercado Pago, etc.).
2. Un trigger de base de datos (o función serverless/Edge Function escuchando el evento) resuelve: ¿qué `event_key` corresponde? ¿audiencia pública o admin?
3. Si es admin: consulta `admin_notification_preferences` para saber quién quiere recibir ese tipo de evento, arma el payload, y envía vía Web Push (protocolo estándar, con las claves VAPID del proyecto) a cada `push_subscriptions_admin` correspondiente.
4. Si es público: arma el payload personalizado (nombre del cliente, horario del turno) y envía a la suscripción específica en `push_subscriptions_public`.
5. Falla de envío (suscripción expirada/revocada) → se marca la fila como inválida y se limpia, para no seguir intentando indefinidamente.

#### Panel del admin — UI

- Sección "Notificaciones" con:
  - Toggle general de activación (pedir permiso del navegador).
  - Lista de tipos de evento con switch individual (usando `admin_notification_preferences`) — así cada profesional/empleado decide qué le interesa recibir, sin saturarse.
  - Si hay `multi_staff_enabled` en el futuro, cada usuario admin tiene sus propias preferencias y suscripción, no una compartida — importante para cuando el roadmap llegue a Fase 5 (varios profesionales).

---

## 4. Sistema de diseño del panel del cliente

Define cómo conviven una identidad propia del producto (consistente entre todas las instancias) con la marca de cada cliente, y cómo se resuelve el modo claro/oscuro.

### 4.1 Dos capas de tokens

**Chassis (fijo, no lo toca el cliente):** estructura, tipografía base (par de fuentes definido por el producto), sistema de superficies claro/oscuro, y el isotipo genérico por defecto. Es lo que hace que cualquier instancia se sienta parte de la misma familia de producto, sin importar qué cliente la use.

**Tokens de marca (configurables desde el panel, ya definidos en la Arquitectura Modular):**

| Variable CSS | Qué controla |
|---|---|
| `--color-primary` | Color principal — navegación activa, botones primarios |
| `--color-accent` | Color secundario — llamadas a la acción, indicadores |
| `--color-bg` | Usado como acento tenue, no como superficie completa (ver 4.3) |
| `--font-heading` / `--font-body` | Tipografía, opcional por cliente |
| `--border-radius` | Redondez global de toda la interfaz — de angular a muy suave |

### 4.2 Modo claro/oscuro — ambos casos contemplados

- Por defecto, la interfaz respeta la preferencia del sistema operativo del dispositivo (`prefers-color-scheme`).
- Un toggle manual en el panel permite al usuario pisar esa preferencia durante la sesión (se guarda la elección).
- Los tokens de marca del cliente (`--color-primary`, `--color-accent`) se mantienen iguales en ambos modos; lo que cambia son las superficies del chassis (fondos, bordes, texto), calculadas para mantener contraste legible en los dos casos.

### 4.3 Por qué el fondo del cliente no reemplaza toda la superficie

Dejar que `--color-bg` controle el 100% del fondo de la app es lo que suele romper el contraste en modo oscuro (un fondo pensado en claro no necesariamente funciona invertido). Por eso el fondo base lo resuelve el chassis según el modo activo, y el color del cliente se aplica como acento — por ejemplo, una veta translúcida del color primario detrás del ítem de menú activo (`color-mix()`), no un bloque sólido de fondo. Así la marca del cliente se nota sin comprometer la legibilidad en ningún modo.

---

## 5. Resumen de lo que se suma al mapa de módulos existente

| Nuevo elemento | Tipo | Dónde vive | Depende de |
|---|---|---|---|
| Enforcement de flags server-side | Infraestructura transversal | Backend de cada instancia (RLS + API) | — (no es un módulo, es una corrección estructural) |
| Panel interno de Estudio Equis | Aplicación separada | Infraestructura propia de Estudio Equis (no en instancias de clientes) | Acceso de lectura/escritura controlado a metadatos + flags de cada cliente |
| `inquiries_enabled` (Bandeja de consultas + WhatsApp) | Módulo de panel del cliente | Núcleo o Pack Esencial (bajo costo, alto valor percibido) | Requiere teléfono del negocio configurado en `business` |
| Gestión visual ampliada | Extensión de `identity` existente | Núcleo | Supabase Storage |
| `push_subscriptions_public` (ya previsto) | Módulo existente, sin cambios | Pack Profesional (`push_enabled`) | Web Push API / VAPID |
| `push_subscriptions_admin` (nuevo) | Módulo nuevo | Recomendado en Núcleo (es operativo, no comercial) | Web Push API / VAPID, `notification_event_types` |

