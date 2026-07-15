# Especificación de Arranque — Plan de Fases Blindado para Desarrollo con Agente de Código

*Documento de hand-off. Objetivo: que Codex (u otro agente) pueda construir el proyecto fase por fase sin tomar decisiones de arquitectura por su cuenta. Todo lo que no está fijado acá es una fuente probable de inconsistencia entre fases.*

---

## 0. Cómo usar este documento

Antes de pasarle esto al agente, conviene pegarlo (o partes de él) como contexto persistente del proyecto — no como un mensaje suelto. Cada fase de desarrollo debe empezar citando: la sección 2 (convenciones fijas), la sección 4 (checklist de seguridad transversal) y el bloque específico de esa fase en la sección 3. La sección 5 (reglas para el agente) debería ir en el instructions/system prompt del propio Codex si el IDE lo permite, para que aplique en cada sesión sin que haya que repetirlo.

---

## 1. Lo que faltaba especificar (y se resuelve en este documento)

Esto es lo que un agente de código necesita y **no estaba fijado todavía** en los documentos anteriores — cada punto sin resolver es una decisión que el agente tomaría por su cuenta, de forma distinta en cada fase o cada sesión:

| Punto sin fijar | Riesgo si no se especifica |
|---|---|
| Estructura de repos/carpetas | El agente organiza cada fase distinto; código duplicado entre el panel del cliente y el panel central |
| Versiones exactas de stack | "La última versión estable" cambia entre sesiones del agente; rompe compatibilidad entre fases |
| Convención de nombres (tablas, columnas, env vars, feature keys) | Cada fase inventa su propio estilo; migraciones inconsistentes |
| Formato estándar de errores y validación | Cada endpoint responde distinto; imposible manejar errores de forma genérica en el frontend |
| Patrón de migraciones multi-instancia | El agente no tiene forma de saber cómo una migración de schema llega a N bases de datos distintas |
| Separación credenciales de datos vs. credenciales de esquema | Confusión entre `service_role key` (datos) y conexión Postgres directa (DDL/migraciones) — son cosas distintas y ambas necesarias |
| Catálogo único de feature flags | Sin una fuente de verdad, cada fase agrega flags con nombres o convenciones distintas |
| Zona horaria / moneda / locale por defecto | Ambigüedad en cálculo de horarios de agenda y montos |
| Idempotencia de webhooks de pago | Sin definir, un reintento de Mercado Pago puede duplicar una confirmación de turno |
| Qué queda explícitamente fuera de cada fase | El agente puede "adelantarse" y construir cosas de fases posteriores a medias, generando deuda técnica |
| Criterio de cierre medible por fase | Sin esto, "fase terminada" es subjetivo y no bloquea nada |

Las secciones siguientes cierran cada uno de estos puntos.

---

## 2. Convenciones fijas (no se renegocian entre fases)

### 2.1 Estructura de repos

Dos repositorios separados, ambos TypeScript + Next.js + Supabase, organizados como monorepo cada uno (o un único monorepo con dos apps si se prefiere un solo repositorio — cualquiera de las dos opciones es válida, pero **debe elegirse una y quedar fija antes de la Fase 0**):

```
plataforma-turnos/          ← plantilla maestra, se despliega en el Vercel de cada cliente
  apps/web/                 ← Next.js App Router (panel admin + PWA pública + API)
  packages/shared/          ← tipos, catálogo de features, esquemas Zod, utilidades
  supabase/migrations/      ← migraciones SQL versionadas (una por cambio de schema)

panel-central/               ← aplicación de Estudio Equis, en estudioequis.com.ar
  apps/web/                 ← directorio de clientes, activación de módulos, auditoría
  packages/shared/          ← puede reusar tipos de plataforma-turnos vía paquete publicado o git submodule
```

**Regla:** el catálogo de feature flags y los tipos de eventos de notificación viven en un solo lugar (`packages/shared`) y se referencian desde ambos repos — nunca se redefinen a mano en el otro repo.

### 2.2 Stack fijado (pinnear versiones exactas al iniciar Fase 0, no "la última")

| Capa | Elección | Nota |
|---|---|---|
| Framework | Next.js (App Router), versión estable LTS vigente al iniciar Fase 0 | Fijar el número exacto en `package.json` y no actualizar durante el proyecto sin decisión explícita |
| Lenguaje | TypeScript, `strict: true` | Sin excepciones, sin `any` implícito |
| Estilos | Tailwind CSS | — |
| Validación | Zod | Todo input de formulario y de API pasa por un schema Zod compartido |
| Base de datos | PostgreSQL vía Supabase | — |
| Gestor de paquetes | pnpm | Por consistencia en todo el monorepo |
| Testing unitario | Vitest | — |
| Testing E2E | Playwright | Mínimo: flujo de reserva + pago, en cada fase que lo toque |
| CI | GitHub Actions | Bloquea merge si falla typecheck, lint, test o build |
| Linter/formato | ESLint + Prettier | Config compartida en `packages/shared` |

### 2.3 Convención de nombres

- **Tablas:** `snake_case`, plural (`appointments`, `push_subscriptions_admin`).
- **Columnas:** `snake_case`; toda tabla de negocio lleva `business_id uuid not null references business(id)`; toda tabla lleva `id uuid primary key default gen_random_uuid()`, `created_at timestamptz default now()`; las que necesiten historial en vez de borrado físico llevan `deleted_at timestamptz null` (soft delete — ver 2.6).
- **Feature flags:** `snake_case` terminado en `_enabled` (ya establecido en la Arquitectura Modular: `products_enabled`, `push_enabled`, etc.). Se agrega ahora `inquiries_enabled` y no se crea ningún flag nuevo sin agregarlo primero al catálogo único (ver 2.7).
- **Variables de entorno:**

| Variable | Dónde vive | Expuesta al cliente (browser) |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel del cliente | Sí |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel del cliente | Sí (es de solo lectura limitada por RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel del cliente (server-only) y bóveda del panel central | **Nunca** |
| `SUPABASE_DB_URL` (conexión Postgres directa, para migraciones) | Bóveda del panel central únicamente | **Nunca** |
| `MP_ACCESS_TOKEN` | Vercel del cliente (server-only) | **Nunca** |
| `RESEND_API_KEY` | Vercel del cliente (server-only) | **Nunca** |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Vercel del cliente | Solo la pública, con prefijo `NEXT_PUBLIC_` |

Regla dura: cualquier variable sin prefijo `NEXT_PUBLIC_` que aparezca en código de cliente (componente `"use client"`) es un bug de seguridad, no una decisión de diseño — el CI debería tener un chequeo que lo detecte (grep de nombres de secretos en el bundle de cliente).

### 2.4 Formato estándar de errores y respuestas de API

Toda función de servidor (`server action` o `route handler`) que falle devuelve la misma forma:

```ts
type ApiError = { error: { code: string; message: string } };
// ej: { error: { code: 'FEATURE_NOT_ENABLED', message: 'Módulo no contratado' } }
```

Códigos reservados desde el inicio: `FEATURE_NOT_ENABLED`, `VALIDATION_ERROR`, `UNAUTHORIZED`, `NOT_FOUND`, `PAYMENT_WEBHOOK_INVALID_SIGNATURE`, `RATE_LIMITED`. Se amplía la lista por fase, nunca se reinventa el formato.

### 2.5 Zona horaria, moneda y locale por defecto

- Zona horaria por defecto de cada instancia nueva: `America/Argentina/Buenos_Aires` (configurable luego desde `business`, pero éste es el valor semilla).
- Moneda por defecto: `ARS`, formateada con `Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })`.
- Locale de fechas: `es-AR`.
- Toda fecha se guarda en UTC en la base y se formatea a la zona horaria del negocio solo en la capa de presentación — nunca se guardan horarios locales sin convertir.

### 2.6 Soft delete vs. borrado físico

- `customers`, `appointments`, `payments`: soft delete (`deleted_at`) — se necesita el historial para analítica y para la ficha de cliente.
- Borrado físico real solo ocurre en el proceso explícito de "eliminación de datos" que ya está contemplado en la Propuesta Comercial (solicitud del cliente, validación de identidad) — es un proceso aparte, no el `DELETE` normal de la aplicación.

### 2.7 Catálogo único de feature flags (fuente de verdad)

Vive en `packages/shared/feature-catalog.ts` como un array tipado (clave, pack mínimo, si requiere migración, tabla(s) que gobierna). Tanto el seed de la tabla `features` en cada instancia nueva como las políticas RLS y el panel central para activar módulos **leen de este archivo** — no se escribe el mismo dato a mano en tres lugares distintos.

```ts
export const FEATURE_CATALOG = [
  { key: 'full_payments_enabled', pack: 'profesional', requiresMigration: false },
  { key: 'analytics_enabled', pack: 'profesional', requiresMigration: false },
  { key: 'products_enabled', pack: 'profesional', requiresMigration: true },
  { key: 'inquiries_enabled', pack: 'esencial', requiresMigration: true },
  // ... resto del mapa de módulos ya definido en la Arquitectura Modular
] as const;
```

### 2.8 Migraciones — separar credenciales de datos y credenciales de esquema

Esto **no estaba distinguido antes** y es importante: el `service_role key` permite operaciones CRUD saltando RLS (activar un flag, leer/escribir filas), pero **no alcanza para correr una migración** (crear una tabla, agregar una columna) — eso requiere conexión directa a Postgres o la Management API de Supabase.

- La bóveda del panel central guarda, por cliente, **dos secretos separados**: `service_role_key` (operaciones de datos) y `db_connection_string` o token de Management API (operaciones de esquema/DDL).
- Toda migración nueva se escribe una sola vez en `supabase/migrations/` del repo de la plantilla maestra, versionada con un número secuencial, y se aplica a cada instancia de cliente mediante un script del panel central que recorre el listado de clientes y ejecuta la migración pendiente contra cada uno — nunca a mano, cliente por cliente, vía consola.
- Cada instancia lleva un registro de qué migración tiene aplicada (`schema_migrations` — lo gestiona el propio Supabase CLI) para que el panel central sepa quién está desactualizado.

### 2.9 Webhooks de Mercado Pago — idempotencia y verificación de firma obligatorias desde la Fase 1

- Toda notificación de Mercado Pago se valida contra su firma (`x-signature`) antes de procesarse — un webhook sin firma válida se descarta y se loguea, nunca se ejecuta.
- Se guarda el `id` del evento de Mercado Pago en una tabla `payment_events` con restricción `unique` — si el mismo evento llega dos veces (Mercado Pago reintenta), la segunda vez se ignora sin volver a modificar el estado del turno.
- Ningún estado de pago se marca como confirmado por una respuesta del frontend — únicamente por el webhook server-to-server.

### 2.10 Arquitectura dual de PWA — pública y admin, separadas por subdominio

La PWA pública (que instala el cliente final para ver/reservar turnos) y el panel admin (que instala el profesional) son **dos aplicaciones instalables independientes**, separadas por subdominio dentro del mismo dominio del cliente — no por ruta. Ejemplo: `negociocliente.com` para la pública y `admin.negociocliente.com` para el panel.

**Por qué por subdominio y no por path (`/admin`):** dos subdominios son, para el navegador, **dos orígenes distintos**. Eso da aislamiento real y gratis — cada uno con su propio scope de service worker, su propio storage, sus propias cookies de sesión, y cero riesgo de que el scope de una PWA choque con el de la otra. Separar por path (`/` vs `/admin`) también es técnicamente posible, pero obliga a extremar cuidado manual para que un service worker no intercepte requests del otro; con subdominios ese problema no existe estructuralmente.

**Qué implica en código e infraestructura:**

- **Un solo proyecto de Vercel por cliente** (no dos) — se mantiene el modelo ya definido de "1 Vercel + 1 Supabase por cliente". Lo que cambia es que ese proyecto responde a **dos dominios**: el dominio raíz/`www` y el subdominio `admin.`. Ambos se agregan como dominios del mismo proyecto en Vercel.
- **Middleware de Next.js** que lee el hostname de cada request (`request.headers.get('host')`) y sirve el árbol de rutas correspondiente — público o admin — desde el mismo build. Un solo repo, un solo deploy, sin duplicar código entre "app pública" y "app admin".
- Dos manifiestos, cada uno servido solo en su hostname correspondiente (`/manifest.json` con contenido distinto según el host que lo pide, o dos rutas de manifiesto con reescritura condicional en el middleware).
- Dos service workers registrados cada uno en su propio origen — no hace falta gestionar scopes manualmente, el navegador ya los separa. La suscripción push se registra contra el service worker del origen correspondiente, y cae naturalmente en `push_subscriptions_public` o `push_subscriptions_admin` según desde qué subdominio se hizo.
- Cada shell sigue manejando su propio prompt de instalación (`beforeinstallprompt` en Android/desktop; instrucción manual en iOS) — eso no cambia por usar subdominios.

**Qué se suma al aprovisionamiento de cada cliente (Fase 0 / checklist del panel central):** además del dominio principal, hay que crear el registro DNS del subdominio `admin.` (CNAME apuntando al mismo proyecto de Vercel) y agregarlo como dominio adicional en Vercel. La tabla `client_instances` del panel central (ya definida en la Especificación de Backend) debe guardar ambos: `public_domain` y `admin_domain` — no asumir que uno se deriva automáticamente del otro por convención, porque un cliente podría eventualmente pedir un subdominio distinto a `admin.` (ej. `panel.`).

**Fixes de viewport y barra inferior** (sin cambios respecto a lo ya definido, aplican igual en ambos subdominios): `viewport-fit=cover`, `100dvh` en vez de `100vh`, `env(safe-area-inset-bottom)` en cualquier barra inferior fija del panel admin, set de íconos propio por manifiesto.

**Dónde entra en el plan de fases:** el middleware de hostname, los dos manifiestos y los dos service workers se construyen en la **Fase 0**. El registro efectivo de push sigue entrando en la Fase 4; lo único que tiene que existir desde el arranque es el shell que lo va a soportar, ya separado por subdominio.



### Fase 0 — Fundaciones (nueva; no estaba en el roadmap original y es la más importante para evitar ambigüedad)

**Objetivo:** que exista la base técnica común antes de tocar cualquier feature de negocio.

**Incluye:**
- Los dos repos con la estructura de 2.1, CI configurado (typecheck + lint + test + build bloqueante).
- Esquema núcleo: `business`, `features`, `services`, `schedules`, `schedule_overrides`, `appointments`, `customers`, `payments` (ya definidos en el Roadmap Técnico), con la convención de 2.3.
- Función `has_feature(business_id, feature_key)` y el patrón de política RLS documentado en la Especificación de Backend — aplicado como plantilla reutilizable, no reescrito a mano por tabla.
- Catálogo de feature flags (`packages/shared/feature-catalog.ts`) con todos los módulos ya mapeados en la Arquitectura Modular, aunque todavía no estén construidos.
- Autenticación del panel admin (Supabase Auth).
- Seed script: crea un negocio demo con datos de ejemplo, para poder probar cada fase siguiente sin cargar todo a mano.
- Sistema de diseño base (tokens de chassis + tokens de marca, modo claro/oscuro con `prefers-color-scheme` + toggle manual) ya especificado en la sección de UI.
- Shell dual de PWA (dos manifiestos, dos service workers, fixes de viewport/safe-area) descrito en 2.10 — sin registro de push todavía, solo la base instalable.

**Seguridad obligatoria para cerrar esta fase:**
- RLS activada por defecto en **todas** las tablas desde el primer día (nunca "la agrego después").
- Ningún secreto server-only aparece en el bundle de cliente (chequeo automatizado en CI).
- Login del panel admin fuerza contraseña fuerte y deja el campo abierto para 2FA (aunque se implemente en una fase posterior, el modelo de datos de `admin_users` debe contemplarlo desde ahora para no migrar tablas después).

**Testing obligatorio:** test de que crear/editar un negocio, loguearse, y ver el panel vacío funciona de punta a punta (E2E mínimo). Además, verificación manual (checklist, no necesariamente automatizada en esta fase) de que ambas PWA — pública y admin — se pueden instalar por separado en Android/desktop e iOS, con ícono y nombre propios, y sin contenido cortado por notch/home indicator.

**Fuera de alcance (no construir todavía):** ningún módulo opcional, ningún flujo de pago real, ningún push, nada de WhatsApp.

**Criterio de cierre medible:** un negocio demo se crea desde cero con el seed script, se loguea en el panel, y el CI está verde en un commit limpio.

---

### Fase 1 — Núcleo operativo (ya definida en el Roadmap Técnico, se agrega lo siguiente)

**Alcance:** el ya definido (identidad, catálogo de servicios, agenda, reserva pública, Mercado Pago para señas, panel de turnos, PWA, QR, sistema de flags).

**Seguridad obligatoria para cerrar esta fase:**
- Webhook de Mercado Pago con verificación de firma + idempotencia (2.9) implementado y testeado con un evento duplicado simulado.
- RLS de escritura en `appointments`/`payments` verificada con un test que intenta escribir sin pasar por el flujo esperado y confirma que falla.
- Rate limiting básico en el endpoint público de creación de turnos (para evitar spam de reservas falsas) — puede ser tan simple como un límite por IP en el edge/middleware, no necesita infraestructura cara.

**Testing obligatorio:** E2E completo del flujo de reserva + pago de seña, incluyendo el caso de webhook duplicado.

**Fuera de alcance:** analítica, portfolio, productos, promociones, push, consultas — todo lo de fases 2 en adelante.

**Criterio de cierre medible:** un cliente de prueba real (no el demo) puede reservar un turno público, pagar una seña, y el profesional lo ve confirmado en el panel — sin que Estudio Equis haya tocado el código a mano después del deploy inicial.

---

### Fase 2 — Gestión y datos (ya definida)

**Se agrega:**
- Cada tabla nueva de esta fase sigue el patrón RLS de la Fase 0 sin excepciones (analítica, reportes).
- Formularios de admision configurables desde el panel admin para adjuntar informacion adicional a una reserva, documentados en `Documentacion/Fase_2_Formularios_Admision.md`.
- Modelo avanzado de servicios y agenda, documentado en `Documentacion/Fase_2_Modelo_Servicios_Agenda.md`, para soportar presencial con horario, virtual con hora pactada, virtual a demanda y solicitudes/contacto sin turno confirmado.
- Las respuestas de formularios se guardan con snapshot/version de la definicion usada al reservar, para que editar el formulario no modifique reservas historicas.
- Los recordatorios por email (Resend) deben verificar SPF/DKIM/DMARC del dominio antes de considerarse "cerrada" la fase — sin esto, los recordatorios caen en spam y el módulo pierde el valor que promete.

**Fuera de alcance:** módulo de consultas/WhatsApp (pasa a Fase 3, junto con portfolio, para agrupar todo lo de "presencia digital y contacto").

**Criterio de cierre medible:** un negocio con historial de al menos 20 turnos de prueba puede ver reportes coherentes con esos datos (no solo que la pantalla cargue, sino que los números cuadren).

---

### Fase 3 — Presencia digital y contacto

**Se agrega respecto al Roadmap original:**
- El módulo de **consultas + ruteo a WhatsApp** (`inquiries_enabled`) entra acá, junto con portfolio y productos simples, porque comparten el mismo objetivo de "el negocio se muestra y se lo pueden contactar sin fricción".
- Las consultas deben integrarse con servicios de modalidad `contact_request`: no crean un turno confirmado, pero si dejan registro en bandeja admin y pueden convertirse en reserva/turno si el prestador lo decide.
- El link `wa.me` requiere que `business.whatsapp_phone` esté validado en formato E.164 antes de generarse — un teléfono mal formateado rompe el link silenciosamente, así que se valida en el formulario de configuración, no en el momento de generar el link.

**Fuera de alcance:** campañas push masivas, cupones, gift cards, paquetes de sesiones — fase 4.

**Criterio de cierre medible:** una consulta enviada desde la web pública aparece en el panel en tiempo real (o casi) y el botón de WhatsApp abre con el número y mensaje correctos.

---

### Fase 4 — Fidelizacion, comunicacion y push dual

**Estado 2026-07-15:** se ejecuta antes de Fase 3 para estabilizar comunicacion transaccional y PWA publica antes de sumar presencia/contacto comercial.

**Se agrega respecto al Roadmap original:**
- La tabla existente `push_subscriptions` se mantiene unificada con `surface`, y se extiende con `customer_id`, `appointment_id` y `service_request_id` para targeting publico sin duplicar infraestructura.
- El catalogo `notification_event_types`, las preferencias `admin_notification_preferences` y la auditoria `push_notification_records` se construyen juntas con Web Push API + VAPID.
- El panel conserva avisos operativos; el cliente final recibe eventos dirigidos solo cuando su suscripcion quedo vinculada a su turno o solicitud.

**Fuera de alcance:** campañas masivas, cupones, gift cards, membresias, multi-staff, multi-sucursal y lista de espera — fases posteriores.

**Criterio de cierre medible:** un cambio real de estado de turno/solicitud o pago genera una notificacion push visible para el panel y otra dirigida al cliente correcto; el panel lista el evento en `/panel/notificaciones` y la PWA publica lo guarda en `Notificaciones` local.

---

### Fase 5 — Expansión, automatización y panel central

**Se agrega respecto al Roadmap original — esta fase ahora incluye explícitamente:**
- El **panel central** (`estudioequis.com.ar`), incluyendo la bóveda de credenciales, el motor de acción, y el registro de auditoría (`access_grants`) — tal como se especificó.
- Activación remota y **self-service** de módulos que no requieren migración (pago → webhook → flag activado sin intervención humana) — para los que sí requieren migración, el panel central dispara el script de migración batch, no un despliegue manual por cliente.
- Multi-staff y multi-sucursal recién se construyen si hay al menos un cliente real que lo necesite — no antes, para no diseñar a ciegas un modelo de datos que después no calce con el caso real.

**Seguridad obligatoria (la más exigente de todas las fases):** 2FA obligatorio para cualquier usuario del panel central, secretos de la bóveda encriptados con una clave de gestión separada (no en la misma base que los datos), y cada acción remota queda en `access_grants` con quién/cuándo/qué cliente/qué acción.

**Criterio de cierre medible:** activar un módulo ya soportado por la versión instalada, para un cliente real, no requiere que nadie entre a Vercel o Supabase de ese cliente — se hace desde el panel central de punta a punta.

---

## 4. Checklist de seguridad transversal (aplica a todas las fases, se revisa antes de cada cierre de fase)

- [ ] RLS activada en toda tabla nueva, sin excepción, desde el commit que la crea.
- [ ] Todo módulo opcional valida `has_feature()` tanto en RLS como en la función de servidor que lo usa (doble capa, nunca solo una).
- [ ] Ningún secreto server-only llega al bundle de cliente (verificado en CI, no solo revisado a mano).
- [ ] Todo webhook de pago verifica firma y es idempotente.
- [ ] Todo endpoint público (sin autenticación) tiene algún límite de tasa razonable.
- [ ] Toda fecha se guarda en UTC; toda conversión a zona horaria local ocurre solo en presentación.
- [ ] Todo error de servidor sigue el formato de 2.4 — nunca se filtra un stack trace ni un mensaje interno de Postgres al cliente.
- [ ] Toda migración de esquema queda versionada en el repo antes de aplicarse a cualquier instancia real.

---

## 5. Reglas de trabajo para el agente de código

1. No crear ninguna tabla, columna, variable de entorno o feature flag con un nombre que no siga las convenciones de la sección 2 — si hace falta un nombre nuevo, se agrega primero al catálogo/glosario y después se usa en código.
2. No adelantar funcionalidad de una fase posterior dentro de una fase anterior, aunque parezca simple agregarla — genera código a medio terminar sin sus checks de seguridad correspondientes.
3. No modificar el formato de errores, el patrón de RLS, ni la estructura de repos definida acá sin señalarlo explícitamente como un cambio de convención, nunca de forma implícita.
4. Toda funcionalidad que toque dinero (pagos, señas, webhooks) o datos personales (clientes, turnos) requiere el test correspondiente en el mismo cambio que la introduce, no "en una pasada posterior".
5. Ante una ambigüedad no cubierta por este documento, el agente debe señalarla explícitamente y proponer una convención antes de escribir código — no asumir en silencio.

---

## 6. Lo único que sigue pendiente de decisión humana (no técnica)

Todo lo técnico quedó fijado arriba. Lo que sigue abierto son decisiones de negocio que no le corresponden al agente de código:

1. Elegir monorepo único vs. dos repos separados (2.1) — cualquiera funciona técnicamente, pero hay que decidirlo antes de la Fase 0 para no reestructurar después.
2. Duración por defecto de la garantía técnica y política de cancelación (ya señalado en el análisis de brechas) — no bloquea el código, pero sí el contrato con el primer cliente real.
3. Revisión legal de los documentos comerciales por un abogado argentino (ya recomendada en los documentos originales) — tampoco bloquea el código, pero sí la venta.

Ninguno de estos tres puntos debería demorar el arranque de la Fase 0.
