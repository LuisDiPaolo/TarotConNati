# Análisis de Producto y Brechas — Plataforma Modular de Turnos (Estudio Equis)

*Basado en: Roadmap Técnico, Arquitectura Modular, Propuesta Comercial y Modelo de Negocio Argentina (v3.1, jun. 2025)*

---

## 1. Resumen ejecutivo de lo que ya está definido

El proyecto tiene un nivel de madurez **poco habitual para una etapa pre-lanzamiento**: no es solo una idea de producto, sino un modelo comercial, legal y técnico bastante cerrado.

| Dimensión | Estado |
|---|---|
| **Producto** | PWA con Next.js + Supabase + Mercado Pago, para profesionales con turnos (estética, bienestar, arte, servicios). Núcleo: identidad, servicios, agenda, reservas, señas, panel admin, PWA, QR. |
| **Modularidad** | Sistema de flags booleanos (`features`) por cliente, 3 packs (Esencial / Profesional / Comercial) + módulos individuales comprables por separado. |
| **Multi-tenant** | Aislamiento total: 1 instancia Supabase + 1 proyecto Vercel + 1 dominio por cliente. No hay tenant compartido. |
| **Monetización** | Pago único por implementación + venta de módulos adicionales + servicios opcionales recurrentes (mantenimiento, horas prepago, gestión comercial) — sin suscripción obligatoria. |
| **Propiedad intelectual** | Muy bien resuelta: plantilla maestra y repo son de Estudio Equis; cliente licencia de uso, no código. Amparado en Ley 11.723. |
| **Datos personales** | Contempla Ley 25.326, aunque delega la responsabilidad de "responsable de base de datos" al cliente. |
| **Roadmap** | 5 fases, desde núcleo operativo hasta expansión/automatización (multi-staff, multi-sucursal, WhatsApp, Google Calendar, membresías). |
| **Modelo financiero** | Rangos de precio, escenarios a 1-3 años, análisis de riesgos comerciales — todo etiquetado correctamente como "orientativo, no garantía". |

**Conclusión inicial:** la capa *comercial y legal* está prácticamente resuelta. La capa que necesita más trabajo antes de vender con confianza es la **capa operativa/técnica de fondo** — todo lo que ocurre *después* de que el roadmap de features esté "listo", que es justamente lo que determina si el negocio escala o se ahoga en soporte manual.

---

## 2. Brechas críticas (bloquean la promesa de "robusto, seguro, escalable")

### 2.1 Seguridad: los flags son solo de UI, no de backend

> *"El frontend consulta esta tabla al iniciar la aplicación y renderiza condicionalmente."*

Esto es un **riesgo de seguridad real**, no un detalle menor. Si un módulo (por ejemplo `analytics_enabled` o `products_enabled`) solo se oculta en el frontend, cualquier cliente con conocimientos básicos puede:
- Llamar directamente a los endpoints de Supabase/API sin pasar por la UI.
- Acceder a funciones no contratadas sin que el sistema lo bloquee.

**Falta contemplar:**
- Enforcement de flags a nivel de **Row Level Security (RLS)** y/o middleware de API — no solo en el componente React.
- Validación server-side en cada mutación (crear producto, crear cupón, etc.) contra la tabla `features`.
- Tests automáticos que verifiquen que un flag apagado realmente bloquea el backend, no solo el menú.

### 2.2 No hay automatización real del aprovisionamiento (Fase 5 es aspiracional, no construida)

El documento reconoce que el proceso actual (puntos 40-49 del roadmap) es **manual**: crear cuentas, correr migración, cargar config, desplegar, asignar dominio. Esto es sostenible con 5-10 clientes, pero:

**Falta contemplar:**
- Con 30-50 instancias aisladas (arquitectura de "1 Supabase por cliente"), cada actualización de la plantilla maestra implica **migrar N bases de datos por separado**, una por una. Esto no está resuelto ni presupuestado en tiempo/costo.
- Un **panel interno de gestión de clientes** (mencionado en el punto 32 del roadmap) que hoy no existe: sin esto, activar un módulo sigue siendo "acceso temporal + deploy manual" para cada cliente, lo cual contradice la promesa de "escalable por módulos".
- Scripts de aprovisionamiento **idempotentes y versionados** (Infrastructure as Code: Terraform/Pulumi o al menos scripts CLI reproducibles), no solo "el proceso de referencia hasta que exista automatización".
- Un sistema de **versionado del schema por instancia**: saber qué versión de la plantilla corre cada cliente, para poder aplicar parches de seguridad sin romper personalizaciones.

### 2.3 No hay activación de módulos self-service

Actualmente, comprar un módulo requiere: el cliente paga → Estudio Equis evalúa compatibilidad → accede temporalmente a las cuentas → despliega manualmente. Esto:
- Introduce fricción y demora entre el pago y el uso (mala experiencia).
- No escala: cada venta de módulo consume horas humanas de Estudio Equis, lo cual limita el techo de crecimiento aunque el pricing lo llame "expansión de bajo costo de adquisición".

**Falta contemplar:**
- Un flujo de **checkout self-service** para módulos ya soportados por la versión instalada (pago → webhook → flag activado automáticamente, sin intervención humana).
- Reservar la intervención manual solo para los casos que *realmente* requieren migración de infraestructura.

### 2.4 Sin stack de calidad ni CI/CD documentado

No hay mención de:
- Testing automatizado (unit, integración, E2E) — crítico dado que hay flujos de dinero (Mercado Pago) y multi-tenant.
- Pipeline de CI/CD (lint, build, test antes de deploy).
- Ambiente de **staging** separado de producción antes de desplegar a instancias de clientes reales.
- Estrategia de **rollback** si un deploy rompe una instancia.

Sin esto, cada actualización de la plantilla maestra es un riesgo directo sobre negocios en producción de terceros (con dinero real circulando).

### 2.5 Sin observabilidad ni monitoreo

No se menciona:
- Logging centralizado / error tracking (ej. Sentry) por instancia.
- Monitoreo de uptime y alertas (¿cómo se enteran si la instancia de un cliente está caída?).
- Métricas de uso agregadas *entre* clientes para detectar problemas sistémicos (ej. "el webhook de Mercado Pago está fallando en el 15% de las instancias").

Actualmente, un cliente probablemente seria la primera fuente de alerta ante una caída — lo cual es reactivo, no profesional.

### 2.6 Backups y continuidad del negocio

No se define:
- Frecuencia de backups de cada base Supabase (el cliente es titular, pero ¿quién configura la política de backup en el plan gratuito/inicial de Supabase, que suele ser limitada?).
- Prueba de restauración (un backup no probado no es un backup confiable).
- Plan de continuidad si Estudio Equis (como operador único del repo privado) queda inhabilitado temporalmente para desplegar (¿qué pasa con clientes que necesitan un fix urgente?).

---

## 3. Brechas de producto/negocio (afectan la "completitud" y monetización)

| Área | Qué falta |
|---|---|
| **Checkout propio de Estudio Equis** | No hay definido cómo el cliente *paga* la implementación o los módulos (¿transferencia manual? ¿link de pago?). Para un producto que se autodenomina "enlatado y escalable", vender debería ser tan automatizado como el producto mismo. |
| **Demo / sandbox** | No existe una instancia de prueba pública para que un prospecto navegue el panel antes de comprar. Esto reduce fricción de venta. |
| **SLA de soporte** | Se habla de "garantía técnica" y "plan de mantenimiento", pero no hay tiempos de respuesta comprometidos (ej. 24-48hs) ni canal de soporte definido (ticketing, WhatsApp Business, email). |
| **Política de fin de vida / deprecación** | ¿Qué pasa si Next.js o Supabase hacen un breaking change y un cliente antiguo con Pack Esencial de hace 2 años queda desactualizado? No hay política de deprecación ni de EOL (end of life) de versiones. |
| **Onboarding sin fricción para el profesional final** | Hay "asistente de configuración inicial" en Fase 3, pero nada sobre materiales de auto-ayuda (video tutoriales, base de conocimiento) que reduzcan la carga de soporte 1-a-1. |
| **Plantillas legales para el cliente final** | Se le exige al profesional ser "responsable de datos personales" (Ley 25.326) pero Estudio Equis podría ofrecer, como valor agregado (y diferenciador comercial), una plantilla de política de privacidad / términos de uso lista para el negocio del cliente. |
| **Deliverabilidad de email** | Resend está mencionado, pero no SPF/DKIM/DMARC del dominio del cliente — sin esto, los recordatorios de turno pueden caer en spam. |
| **Rate limiting / anti-abuso en reservas públicas** | El flujo de reserva es público; sin rate limiting, es vulnerable a spam de bots (reservas falsas que bloquean la agenda). |
| **Moderación de contenido subido** | Portfolio y productos permiten subir imágenes; no hay política de qué se acepta o mecanismo de reporte de contenido inapropiado. |
| **Analítica de producto propia (para Estudio Equis)** | No hay mención de cómo Estudio Equis mide qué módulos usan realmente los clientes, tasa de abandono, adopción — información clave para decidir qué construir en Fase 4-5. |

---

## 4. Brechas legales/contractuales (más allá de lo ya cubierto)

Ya está bien resuelto: IP, licencia de uso, aislamiento de datos, exclusiones de garantía, identificación de autoría. Lo que falta:

- **Duración específica de la garantía** — el documento dice "el período indicado expresamente en la propuesta" pero no fija un default (¿30 días? ¿90?).
- **Política de cancelación/reembolso** si el cliente desiste durante la implementación.
- **Cláusula de terminación de la licencia**: ¿qué pasa con la instancia y los datos si el cliente deja de operar el negocio o incumple la licencia (ej. intenta revenderlo)?
- **Revisión legal pendiente**, ya señalada en los propios documentos — no está hecha todavía y es explícitamente recomendada antes de usar esto como contrato real.
- **Marca registrada de "Estudio Equis"** — si el modelo depende de la identificación de autoría como palanca comercial (venderla como opción paga de remoción), conviene proteger la marca.

---

## 5. Priorización sugerida (qué resolver antes de escalar ventas)

**Bloqueantes (antes de vender en serio, no solo a los primeros clientes de validación):**
1. Enforcement de flags a nivel backend/RLS (seguridad).
2. Testing mínimo (al menos E2E del flujo de reserva + pago) y ambiente de staging.
3. Backups verificados + monitoreo/alertas básicas de caída.
4. SLA de soporte y canal de soporte definido por escrito.
5. Definir duración de garantía por defecto y política de cancelación.

**Importantes (para no ahogarse operativamente al pasar de ~10 a ~30+ clientes):**
6. Panel interno de gestión de clientes (Fase 5 adelantada, aunque sea versión mínima).
7. Activación self-service de módulos ya soportados.
8. Versionado de instancias + estrategia de migración batch.
9. Checkout propio para implementación y módulos.

**Deseables (diferenciación y reducción de fricción comercial):**
10. Sandbox/demo público.
11. Plantillas legales para el cliente final (valor agregado).
12. Base de conocimiento / video-onboarding.
13. Analítica interna de adopción de módulos.

---

## 6. Nota final

El proyecto está inusualmente bien pensado en su **narrativa comercial y legal** — de hecho, mejor que la mayoría de productos "enlatados" que llegan al mercado. La brecha principal no es de visión sino de **infraestructura operativa detrás de la promesa**: hoy el modelo de "1 instancia aislada por cliente + deploy manual desde repo privado" es coherente con el discurso de seguridad y propiedad intelectual, pero es exactamente lo que va a generar el cuello de botella operativo si no se invierte pronto en automatización (aprovisionamiento, testing, monitoreo, activación self-service de módulos). Ese es el verdadero "falta contemplar" para que la promesa de *"pago único, escalable por módulos"* se sostenga en la práctica y no solo en el documento comercial.
