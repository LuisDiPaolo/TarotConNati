# Prompt de arranque — pegar en Codex (Xcode Intelligence)

*Copiar todo el bloque de abajo tal cual. Está escrito para ser el primer mensaje de la sesión, antes de pedir código de ninguna fase.*

---

```
Vas a construir una plataforma modular de turnos/reservas (identidad de marca todavía sin definir — el producto es "en blanco" y cada cliente lo configura con la suya) siguiendo un plan de fases blindado. Este mensaje es tu contexto de arranque. No escribas código todavía: primero confirmá que entendiste las reglas de esta sección antes de que te pida la Fase 0.

═══════════════════════════════════════════
REGLAS QUE NO SE NEGOCIAN EN NINGUNA FASE
═══════════════════════════════════════════

1. Seguí exactamente las convenciones de nombres, estructura de repos, formato de errores, zona horaria/moneda, y patrón de RLS que te voy a pasar en el documento "00_Especificacion_Arranque_Fases_Blindadas.md". No inventes una convención distinta aunque te parezca razonable — si algo no está cubierto ahí, preguntame antes de decidir por tu cuenta.

2. RLS (Row Level Security) va activada en absolutamente todas las tablas desde el commit que las crea. Ningún módulo opcional se controla solo desde el frontend — todo flag de feature se valida también en la base de datos (función has_feature()) y en la función de servidor correspondiente. Esto es innegociable en cualquier fase.

3. No adelantes funcionalidad de una fase futura dentro de la fase actual, aunque te parezca simple agregarla de paso. Cada fase tiene un criterio de cierre medible — no se pasa a la siguiente sin cumplirlo.

4. Ningún secreto server-only (service role key, token de Mercado Pago, claves privadas VAPID, connection string de base de datos) puede aparecer en código que se ejecuta en el cliente/navegador. Si tenés dudas de si algo es server-only, tratalo como server-only.

5. Todo lo que toque dinero (pagos, señas, webhooks de Mercado Pago) o datos personales de clientes necesita su test en el mismo cambio que lo introduce, no después.

═══════════════════════════════════════════
CARPETAS DE REFERENCIA — TEMPORAL 1 y TEMPORAL 2
═══════════════════════════════════════════

Vas a encontrar dos carpetas en la raíz del proyecto: TEMPORAL 1 y TEMPORAL 2. Son dos proyectos anteriores míos, completos, que dejo únicamente como referencia técnica — NO son parte de este producto y NO se integran, importan ni referencian desde el código final.

Lo que SÍ quiero que saques de ahí (estudiando su implementación, no copiando archivos):

- Cómo resolvieron la instalabilidad de PWA como dos experiencias separadas por subdominio (público en el dominio raíz, admin en un subdominio tipo admin.dominio.com) o equivalente: manifiestos servidos según hostname, service workers por origen, prompts de instalación en Android/desktop e instrucciones manuales en iOS.
- Cómo resolvieron los bugs típicos de viewport en mobile: uso de 100dvh vs 100vh, viewport-fit=cover, manejo de env(safe-area-inset-*) para que una barra inferior fija no quede tapada por el home indicator o el notch.
- Cómo implementaron push notifications con Web Push API (registro de suscripción, manejo de claves VAPID, estructura del payload, limpieza de suscripciones vencidas).
- Cualquier otro patrón de estructura, configuración de Next.js, o solución a un problema técnico transversal (no de negocio) que sea reutilizable acá.

Lo que NO quiero que saques ni repliques de ahí, bajo ningún concepto:

- Nombres de marca, nombres de producto, logos, isotipos, paletas de color, tipografías elegidas, textos de copy, contenido de ejemplo, ni ningún elemento de identidad visual de esos proyectos anteriores.
- Estructura de datos específica de negocio de esos proyectos si no coincide con el modelo de datos ya definido para este producto — este proyecto tiene su propio esquema (business, features, services, appointments, etc.) y no se adapta al de TEMPORAL 1/2, es al revés: se extrae la solución técnica y se reimplementa contra el esquema propio.
- Ninguna dependencia, librería o configuración de esos proyectos se copia "porque ya estaba resuelta ahí" sin verificar que es compatible con el stack fijado en la Fase 0 (versión de Next.js, Tailwind, Supabase, etc.).

Si algo de TEMPORAL 1 o TEMPORAL 2 resuelve un problema técnico pero está atado a una decisión de marca o de negocio de ese proyecto anterior, extraé solo el mecanismo (el "cómo"), no el resultado (el "qué dice o cómo se ve").

Una vez que termines de extraer lo necesario de ambas carpetas para la Fase 0, avisame para que las elimine del repo — no deben quedar en el proyecto final ni en el historial de git de la plantilla maestra.

═══════════════════════════════════════════
ORDEN DE TRABAJO
═══════════════════════════════════════════

1. Confirmá que leíste y entendiste las reglas de arriba.
2. Te paso "00_Especificacion_Arranque_Fases_Blindadas.md" completo.
3. Empezamos por la Fase 0 (fundaciones): estructura de repos, stack, esquema núcleo, RLS base, catálogo de feature flags, sistema de diseño con modo claro/oscuro, y el shell dual de PWA separado por subdominio (dominio raíz para público, admin.dominio.com para el panel, con middleware de Next.js que resuelve por hostname) — extrayendo lo que corresponda de TEMPORAL 1 y TEMPORAL 2 según lo indicado arriba.
4. No avanzamos a la Fase 1 hasta que el criterio de cierre de la Fase 0 esté cumplido y yo lo confirme.
```

---

### Notas para vos (no van dentro del prompt de arriba)

- Antes de pegar esto, asegurate de subir junto con el mensaje el archivo `00_Especificacion_Arranque_Fases_Blindadas.md` (y si Codex lo permite, también `Analisis_Producto_y_Brechas.md` y `Especificacion_Backend_Panel_Interno_Push.md` como contexto adicional) — el prompt los referencia por nombre.
- Las carpetas TEMPORAL 1 / TEMPORAL 2 conviene dejarlas fuera de git desde el primer commit (agregalas a `.gitignore` apenas las copies al proyecto) para que ni por error terminen versionadas o desplegadas.
- Si Codex arranca escribiendo código antes de confirmar que entendió las reglas, cortalo ahí y pedile la confirmación explícita primero — es la única forma de saber que no va a improvisar convenciones a mitad de la Fase 0.
