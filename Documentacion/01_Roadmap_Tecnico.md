**ESTUDIO EQUIS**

**Roadmap Técnico**

Plataforma modular de turnos, ventas y gestión

_Fases de desarrollo, stack tecnológico y criterios de decisión_

Junio 2025 · Versión 3.1 · Confidencial

_Este documento describe el modelo, alcance previsto y criterios generales del producto. No constituye por sí solo una propuesta contractual definitiva, una garantía de disponibilidad, una promesa de resultados ni una obligación de implementar todas las funciones mencionadas. Cada implementación se regirá por la propuesta y el alcance aceptados por el cliente._

1\. Objetivo del roadmap

Este documento describe las fases de construcción previstas de la plataforma, el stack tecnológico seleccionado como referencia, los criterios para priorizar funciones y las decisiones de arquitectura que sostendrían la escalabilidad del producto.

No es una promesa de entrega ni un contrato de alcance. Es una guía de trabajo que puede actualizarse a medida que avanza el desarrollo y se acumula experiencia con implementaciones reales.

2\. Principios técnicos

• Una única plantilla maestra bajo control de Estudio Equis. No se desarrollan versiones separadas para cada cliente.

• Módulos activables por configuración. Las funciones se habilitan mediante flags, sin necesidad de modificar código para cada cliente.

• Instancias aisladas. Cada cliente dispone de su propia base de datos, hosting y credenciales.

• Cuentas propias del cliente. Vercel, Supabase, Resend y Mercado Pago son cuentas del cliente, no de Estudio Equis.

• Repositorio centralizado de Estudio Equis. El código fuente no se transfiere ni se comparte con el cliente.

• Las operaciones habituales previstas dentro del alcance estándar están diseñadas para gestionarse desde el panel, sin necesidad de modificar código. Las incidencias técnicas, actualizaciones o cambios fuera del alcance pueden requerir intervención adicional.

• Costo de infraestructura proporcional al uso. El cliente asume sus propios costos de terceros.

3\. Stack tecnológico de referencia

Las tecnologías indicadas representan la selección actual como punto de partida. Pueden ajustarse según la evolución del ecosistema, los requisitos de cada implementación y las versiones estables disponibles en cada momento.

3.1 Frontend / PWA

**Capa**

**Tecnología de referencia**

**Justificación**

**Framework**

**Next.js, utilizando la versión estable vigente al momento de cada implementación (App Router)**

**SSR, ISR, PWA, enrutamiento y funciones de servidor en un solo proyecto**

**Lenguaje**

**TypeScript**

**Tipado estático, menos errores en tiempo de desarrollo**

**Estilos**

**Tailwind CSS**

**Velocidad de desarrollo, purga automática de clases no usadas**

**Componentes de UI**

**shadcn/ui o Radix**

**Accesible, sin opinión visual rígida, composable**

**Estado global**

**Zustand o React Context**

**Liviano y adecuado para el tamaño de estas aplicaciones**

**Formularios**

**React Hook Form + Zod**

**Validación tipada y buen rendimiento en formularios**

**Fechas**

**date-fns**

**Liviano y con soporte de tree-shaking**

**PWA**

**next-pwa o Workbox**

**Service worker, caché offline e instalación en dispositivos compatibles**

_Cada nueva instancia utilizará la versión estable y compatible de Next.js disponible al momento de su implementación. Las instalaciones existentes no se actualizarán automáticamente a nuevas versiones de Next.js salvo que resulte necesario por compatibilidad o se contrate una actualización._

3.2 Backend y base de datos

**Capa**

**Tecnología**

**Justificación**

**Backend-as-a-Service**

**Supabase**

**PostgreSQL + autenticación + almacenamiento + funciones en un solo servicio**

**Base de datos**

**PostgreSQL vía Supabase**

**Relacional, con Row Level Security por fila y soporte de transacciones**

**Autenticación**

**Supabase Auth**

**JWT, enlaces mágicos, OAuth y gestión de sesiones**

**Almacenamiento**

**Supabase Storage**

**Imágenes, logos y archivos de portfolio**

**Pagos**

**Mercado Pago con credenciales del cliente**

**El Access Token del profesional se configura como variable de entorno privada**

**ORM / Consultas**

**supabase-js o Drizzle ORM**

**Consultas tipadas sin SQL directo en la mayoría de los casos**

3.3 Infraestructura y despliegue

**Servicio**

**Proveedor**

**Titular de la cuenta**

**Condiciones estimadas**

**Hosting frontend**

**Vercel**

**Cliente**

**Plan inicial disponible según condiciones vigentes del proveedor**

**Base de datos**

**Supabase**

**Cliente**

**Plan inicial disponible según condiciones vigentes del proveedor**

**Dominio**

**Namecheap / NIC.ar u otro**

**Cliente**

**Costo anual variable según extensión y registrador**

**Correo transaccional**

**Resend**

**Cliente**

**Plan inicial disponible según condiciones vigentes del proveedor**

**Pagos**

**Mercado Pago**

**Cliente**

**Comisión por transacción según plan del profesional**

**Push (notificaciones)**

**Web Push API nativa del navegador**

**N/A (estándar web)**

**Sin licencia directa adicional; sujeto al consumo de infraestructura y a las condiciones del navegador y del dispositivo**

**Repositorio de código**

**GitHub (Estudio Equis)**

**Estudio Equis**

**No accesible por el cliente**

Los servicios de infraestructura pueden ofrecer niveles iniciales sin cargo. Su disponibilidad, capacidad y condiciones dependen de cada proveedor y del consumo real de la aplicación. Estudio Equis puede orientar al cliente sobre los planes disponibles, pero no controla los límites, precios ni políticas de los proveedores externos. No se garantiza que un nivel inicial sea suficiente durante un período determinado.

4\. Modelo de datos

El esquema de base de datos está diseñado para ser único y configurable. Cada cliente tiene su propia instancia de Supabase, por lo que no existe un tenant compartido entre clientes. La activación de funciones se controla mediante una tabla de configuración.

4.1 Tablas del núcleo

• business - Datos del negocio, marca, configuración general.

• features - Módulos habilitados por flags booleanos.

• services - Catálogo de servicios con precio, modalidad, política de agenda, duración operativa, buffers, seña y modo de pago.

• schedules - Disponibilidad semanal base.

• schedule_overrides - Excepciones, feriados y bloqueos.

• appointments - Turnos: estado, cliente, servicio, fecha y pago.

• customers - Base de clientes con historial.

• payments - Registro de señas y pagos.

4.2 Tablas de módulos adicionales

• products - Catálogo de productos.

• portfolio_items - Galería manual con imagen, título y enlace.

• promotions - Promociones con fechas, servicios y descuentos.

• push_subscriptions - Tokens de notificaciones por usuario.

• campaigns - Campañas push programadas.

• analytics_snapshots - Métricas precalculadas para reportes.

• intake_forms - Formularios configurables por negocio para pedir informacion adicional en reservas.

• intake_form_fields - Campos, orden, tipo y validacion de cada formulario.

• service_intake_forms - Asociacion entre servicios y formularios activos.

• appointment_intake_responses - Respuestas guardadas con snapshot de formulario por turno.

4.3 Control de módulos

La tabla features contiene un flag booleano por módulo. El frontend consulta esta tabla al iniciar la aplicación y renderiza condicionalmente las secciones y menús. Si el módulo no está habilitado, el componente no se carga.

**Sobre la activación de módulos:**

Cuando el módulo ya se encuentra disponible en la versión instalada, puede habilitarse mediante un cambio de configuración. Si el módulo requiere una versión nueva, migraciones de base de datos o cambios de infraestructura, Estudio Equis realizará el despliegue correspondiente con acceso temporal a las cuentas del cliente.

4.4 Contrato de integridad negocio / datos / web publica

La web publica, el manifest PWA y el panel no deben inferir negocios por orden de edicion, datos demo ni campos editables desde el panel. Cada instancia desplegada usa una Supabase del cliente con un unico negocio canonico. `NEXT_PUBLIC_SITE_URL` define la URL publica de landing/PWA y `NEXT_PUBLIC_APP_URL` queda como compatibilidad/fallback; el panel se deriva automaticamente como `panel.<dominio-publico>`. Las columnas `business.public_domain` y `business.panel_domain` pueden quedar como metadata tecnica sincronizada, pero no son la fuente de verdad editable por el cliente.

Todas las consultas operativas deben quedar ancladas a `business_id`: servicios, agenda, excepciones, formularios, clientes, turnos, solicitudes, pagos, push y reportes. El panel obtiene el `business_id` desde `admin_users` del usuario autenticado; la web publica, APIs y manifest resuelven el unico negocio de la instancia solo si el host corresponde al dominio publico configurado, al panel derivado o a localhost. Un deploy de nuevos modulos o una recarga de seed no debe cambiar que negocio muestra la web publica ni mezclar datos entre panel y landing.

`business` es singleton por instancia/Supabase. No se agregan mas negocios dentro de una misma instancia. La expansion multi-sucursal debe modelarse como entidad separada de sucursales/ubicaciones, con telefono, direccion, disponibilidad, usuarios asignados y seleccion publica por disponibilidad o preferencia del cliente.

5\. Fases de desarrollo previstas

Fase 1 - Núcleo operativo

_Objetivo: que un profesional pueda recibir turnos y cobrar señas desde una aplicación con su propia marca._

• Proyecto base Next.js + TypeScript + Tailwind CSS + Supabase.

• Autenticación del panel administrativo.

• Configuración del negocio: nombre, logo, colores, descripción y datos de contacto.

• Catálogo de servicios con precio, categoría, modalidad, política de agenda, duración, buffers y modo de pago.

• Agenda semanal configurable: días, horarios, pausas y excepciones.

• Flujo de reserva pública: selección de servicio, fecha, horario y datos del cliente.

• Integración con Mercado Pago usando credenciales propias del cliente: Checkout Pro para señas y pagos.

• Panel de turnos: listado, estados, confirmación, cancelación y notas.

• PWA: manifest, service worker, instalación e ícono propio.

• Generación de código QR con la URL del negocio.

• Sistema de módulos: tabla features y renderizado condicional.

_Criterio de cierre de Fase 1: el cliente puede gestionar desde el panel las funciones operativas del núcleo sin necesidad de modificar código._

Fase 2 - Gestión y datos

_Objetivo: que el profesional pueda entender la actividad de su negocio a partir de los datos generados._

• Ficha de cliente: historial de turnos, pagos y notas internas.

• Formularios de admision configurables desde el panel y adjuntos a la reserva publica, con respuestas visibles en el detalle del turno.

• Modelo avanzado de servicios y agenda: presencial con horario, virtual con hora pactada, virtual a demanda, solicitud/contacto, buffers y bloqueo real de disponibilidad.

• Registro de ausencias y cancelaciones con motivo.

• Marcado de turno como realizado.

• Analítica básica: turnos por período, ingresos registrados, clientes nuevos versus recurrentes.

• Reportes por servicio: más reservado, ticket promedio y tasa de ausencias.

• Métricas temporales: días más activos y horarios con menor ocupación.

• Pago total como opción independiente de la seña.

• Recordatorios automáticos por correo electrónico vía Resend (cuenta del cliente).

Fase 2.5 - Onboarding e identidad PWA del negocio

_Objetivo: que el cliente pueda dejar lista su instancia desde el panel admin, sin depender del seed demo ni de cambios de codigo._

• Alta o completado del negocio desde `/panel/configuracion` como asistente de puesta en marcha cuando no exista una fila valida en `business`.

• El admin carga solo datos comprensibles: nombre comercial, WhatsApp, presentacion breve y dominio publico opcional. El sistema deriva slug, nombres instalables y valores tecnicos.

• Ajustes avanzados separados para identidad visual, colores, logo/iconos de app y funciones publicas como barra inferior o notificaciones.

• Manifiestos dinamicos por negocio para web publica y panel, con nombre, descripcion, theme color e iconos propios, sin exponer el concepto de manifest al usuario final del panel.

• Bucket de assets de marca en Supabase Storage con validacion de tipo, peso, dimensiones y politicas de acceso para admins del negocio.

• Checklist de puesta en marcha: negocio y marca, servicios, agenda/modalidad sin horario, formularios, Mercado Pago, push notifications y prueba de reserva/solicitud.

• Empty states utiles para operar una base limpia despues de correr `limpiar-demo-conservar-negocio.sql`.

_Criterio de cierre de Fase 2.5: una instancia sin seed demo puede darse de alta desde un asistente claro, cargar servicios reales, publicar la web sin configurar campos tecnicos y luego ajustar identidad/app desde opciones avanzadas sin intervencion de codigo._

Fase 2.6 - Experiencia publica de servicios

_Objetivo: que la web publica presente los servicios como catalogo profesional y que la reserva ocurra dentro del contexto del servicio elegido._

• Reemplazo del dropdown principal por cards de servicio con imagen, titulo, descripcion breve, precio, duracion/modalidad e indicador de pago.

• Detalle de servicio como bottom sheet en mobile/PWA, cubriendo casi toda la pantalla, con scroll interno y cierre claro.

• Detalle de servicio como bottom sheet flotante tambien en desktop, pegado abajo, con ancho maximo acotado, scroll interno y cierre claro.

• Formulario de reserva/solicitud dentro del detalle del servicio seleccionado, incluyendo horarios, requisitos, formularios de admision e instrucciones.

• Carga de imagen por servicio desde el panel, con recorte, optimizacion de calidad/peso y fallback visual cuando no hay imagen.

_Criterio de cierre de Fase 2.6: el usuario final puede elegir un servicio desde cards visuales, abrir su detalle en una experiencia responsive y completar la reserva o solicitud sin pasar por un dropdown generico._

Fase 3 - Presencia digital

• Portfolio manual: imágenes con título, categoría y enlace opcional de Instagram.

• Galería pública visible para los clientes del profesional.

• Módulo de productos simples: compra con pago total y retiro en el negocio, sin logística ni envíos.

• Módulo de promociones: precio especial o descuento porcentual con fechas de vigencia.

• Consultas y contacto: formulario publico, registro en bandeja admin, ruteo a WhatsApp y conversion manual a reserva/turno cuando corresponda.

Fase 4 - Comunicacion transaccional y PWA publica

• Notificaciones push transaccionales duales: panel y cliente, con eventos separados e idempotentes.

• Push visible con PWA cerrada mediante service worker, siempre que existan VAPID y permiso del navegador.

• Historial de notificaciones en panel y cache local publica para la pestana Notificaciones.

• Servicio de notificaciones activo por defecto, con toggle por negocio en Configuracion para desactivarlo.

• Recordatorio manual por WhatsApp desde cada reserva, con texto prearmado y telefono normalizado para Argentina (`549...`, `54...` o numero local).

• Campanas push manuales, cupones, gift cards, paquetes, segmentacion y metricas comerciales pasan a una fase posterior de fidelizacion comercial.

Fase 5 - Expansión y automatización

• Panel interno de Estudio Equis para alta de clientes y activación de módulos.

• Automatización del proceso de aprovisionamiento: crear instancia, migrar esquema, configurar módulos y desplegar.

• Soporte para varios profesionales dentro de un mismo negocio.

• Soporte para múltiples sucursales.

• Lista de espera automática.

• Integración con WhatsApp API.

• Integración con Google Calendar.

• Membresías y suscripciones de clientes.

6\. Proceso de aprovisionamiento de nuevos clientes

El siguiente es el proceso manual de referencia hasta que exista automatización completa (Fase 5). Los tiempos indicados son objetivos internos y no incluyen demoras por entrega de logos, contenidos, horarios, credenciales, aprobación visual, dominio, Mercado Pago, validación de correo o respuestas del cliente.

• El cliente crea sus cuentas en Vercel y Supabase, o Estudio Equis asiste en ese proceso.

• El cliente proporciona sus credenciales de Mercado Pago de forma segura.

• Estudio Equis ejecuta el script de migración de esquema sobre la instancia Supabase del cliente.

• Se carga la configuración inicial del negocio.

• Se crea el usuario administrador.

• Se configuran los módulos contratados en la tabla features.

• Se configuran las variables de entorno: URL de Supabase, claves y credenciales de Mercado Pago del cliente.

• Estudio Equis despliega desde su repositorio privado a la cuenta Vercel del cliente.

• Se asigna el dominio o subdominio.

• Se entrega el acceso al panel al cliente.

_Objetivo interno: reducir progresivamente el tiempo técnico de implementación a medida que la plantilla, los scripts y los procesos maduren. El objetivo futuro del proceso automatizado es reducir el aprovisionamiento técnico a pocos minutos, sin contar validaciones, pruebas, información pendiente ni decisiones del cliente._

7\. Criterios de priorización

**Pregunta**

**Si la respuesta es NO**

**¿Beneficia a más de un cliente o rubro?**

**Presupuestar como personalización aparte**

**¿Puede implementarse sin romper la plantilla?**

**Evaluar como módulo desacoplado**

**¿El cliente puede gestionarla desde el panel?**

**Revisar la experiencia de usuario antes de lanzar**

**¿Requiere más de dos semanas de desarrollo?**

**Fragmentar en sub-funciones o diferir**

**¿Se puede validar con un cliente real?**

**No lanzar sin datos de uso concretos**

8\. Personalizaciones solicitadas por el cliente

El producto se ofrece como una solución estandarizada y modular. El cliente puede solicitar funciones, integraciones, flujos o cambios particulares que serán evaluados caso por caso.

• Cada solicitud será clasificada como configuración existente, módulo disponible, mejora general o desarrollo personalizado.

• Las personalizaciones no incluidas en el producto estándar se presupuestan por separado.

• Estudio Equis podrá aceptar, rechazar o proponer una alternativa cuando una personalización comprometa la estabilidad, seguridad, escalabilidad o mantenibilidad de la plantilla.

• Una personalización exclusiva no otorga al cliente derechos sobre la plantilla maestra ni sobre otros componentes del producto.

• Si una solicitud puede beneficiar a varios clientes, podrá evaluarse como nuevo módulo general. Si beneficia únicamente a un cliente, se tratará como implementación personalizada con costo adicional.

Modelo de propiedad, cuentas y responsabilidades

1\. Titularidad de las cuentas técnicas

Cada implementación funciona sobre cuentas independientes asociadas al cliente o al proyecto contratado. El cliente puede proporcionar un correo existente o solicitar que se utilice uno específico para crear las cuentas del proyecto.

**Cuenta / Servicio**

**Titular**

**Costo**

**Acceso de Estudio Equis**

**Vercel (hosting)**

**Cliente**

**A cargo del cliente**

**Temporal, para implementación o actualización**

**Supabase (base de datos)**

**Cliente**

**A cargo del cliente**

**Temporal, para implementación o actualización**

**Resend (correo transaccional)**

**Cliente**

**A cargo del cliente**

**Temporal, para configuración**

**Mercado Pago**

**Cliente**

**Comisiones propias del plan MP**

**Nunca. Solo configura credenciales en variables privadas**

**Dominio**

**Cliente**

**Renovación a cargo del cliente**

**Solo para configuración DNS y vinculación inicial**

**Correo del proyecto**

**Cliente**

**A cargo del cliente**

**No**

**GitHub / código fuente**

**Estudio Equis**

**Interno de Estudio Equis**

**N/A - propiedad exclusiva**

2\. Propiedad intelectual del producto

La plantilla maestra, el código fuente, la arquitectura, los componentes reutilizables, los scripts, las automatizaciones, el sistema de módulos, el sistema de aprovisionamiento, la documentación técnica interna, los procedimientos de despliegue y las mejoras generales pertenecen exclusivamente a Estudio Equis. Esta protección está amparada por la Ley 11.723 de Propiedad Intelectual de la República Argentina.

_El pago de la implementación otorga una licencia de uso limitada al negocio, marca, instalación, profesionales y sucursales contratados. No implica cesión de propiedad intelectual. El cliente aloja y utiliza una instancia ejecutable del producto, pero no adquiere la propiedad ni el acceso al código fuente._

El cliente no adquiere:

• Código fuente ni acceso al repositorio de GitHub.

• Derecho de copia, distribución, reventa o sublicencia.

• Derecho de modificación ni de crear productos derivados.

• Acceso a componentes reutilizables de otros proyectos.

• Plantilla maestra ni sistema de aprovisionamiento.

3\. Licencia de uso

El cliente adquiere una licencia de uso sobre la instancia implementada para su propio negocio, válida para un negocio, una marca, una instalación y la cantidad de profesionales y sucursales expresamente contratadas.

**La licencia permite:**

• Utilizar la aplicación en producción para el negocio contratado.

• Administrar los datos del negocio desde el panel.

• Gestionar las funciones contratadas.

• Operar la agenda, reservas, pagos y módulos adquiridos.

• Solicitar una exportación de datos en los términos acordados.

**La licencia no permite:**

• Revender el sistema, duplicarlo o entregarlo a terceros.

• Utilizarlo para implementar otro negocio o marca.

• Extraer, reutilizar o redistribuir el código.

• Realizar ingeniería inversa ni eliminar protecciones técnicas.

• Alterar la aplicación mediante terceros sin autorización escrita de Estudio Equis.

• Eliminar u ocultar la identificación de autoría de Estudio Equis.

4\. Funcionamiento de los pagos con Mercado Pago

La cuenta de Mercado Pago debe pertenecer al cliente. La plataforma no procesa ni retiene fondos: utiliza el Access Token privado del cliente para crear preferencias de pago y recibir confirmaciones por webhook. Los cobros son procesados directamente por Mercado Pago y acreditados en la cuenta del cliente.

_El flujo previsto es: el cliente final elige el turno y paga → Mercado Pago procesa el cobro con las credenciales del profesional → la plataforma recibe la confirmación y actualiza el estado de la reserva. Los fondos van directamente al profesional. Estudio Equis no interviene en la transacción ni cobra comisión sobre los cobros._

**Estudio Equis:**

• No recibe fondos ni administra liquidaciones.

• No controla retiros ni responde por bloqueos, retenciones o decisiones de Mercado Pago.

• No responde por credenciales revocadas o modificadas por el cliente o por Mercado Pago.

• No cobra comisión adicional sobre las transacciones del profesional.

**Nota técnica:**

_Los proveedores de infraestructura (Vercel, Supabase) no tienen visibilidad sobre las transacciones de Mercado Pago. Para ellos, la integración es una llamada a una API externa. Lo que estos proveedores miden es consumo de recursos: tráfico, base de datos, almacenamiento y cantidad de peticiones._

5\. Dominio

El dominio puede ser registrado directamente por el cliente o gestionado por Estudio Equis. En ambos casos, debe quedar bajo titularidad o control del cliente al finalizar la implementación. Las renovaciones futuras son responsabilidad del cliente.

**Si Estudio Equis gestiona el registro:**

• El servicio incluye búsqueda, registro, configuración de DNS, delegación, vinculación con Vercel y validación SSL.

• El costo de gestión es adicional e independiente del valor oficial del dominio.

• El precio vigente se indicará en la propuesta correspondiente.

6\. Actualizaciones y mantenimiento

La versión entregada incluye las funciones contratadas al momento de la implementación. Las nuevas versiones del producto, mejoras generales, cambios de compatibilidad y actualizaciones motivadas por modificaciones de terceros no están incluidas automáticamente.

**Tipo de actualización**

**Cobertura**

**Correcciones dentro del período de garantía**

**Incluida. Cubre errores reproducibles del alcance contratado.**

**Actualizaciones de compatibilidad (Vercel, Supabase, Mercado Pago, APIs)**

**No incluida por defecto. Puede cubrirse con plan de mantenimiento o pago puntual.**

**Nuevos módulos**

**Se cotizan y activan de forma independiente.**

**Mejoras generales de la plantilla**

**Estudio Equis puede ofrecer versiones actualizadas, pero no está obligado a instalarlas en implementaciones existentes.**

Cuando el cliente contrate una ampliación, Estudio Equis podrá solicitar acceso temporal a Vercel, Supabase, Resend, Mercado Pago, dominio u otros servicios necesarios. El despliegue se realiza mediante integración temporal, CLI, token de despliegue, archivos precompilados u otro mecanismo técnico. Finalizada la intervención, los accesos temporales podrán revocarse o desconectarse.

7\. Disponibilidad y servicios externos

La disponibilidad del sistema depende parcialmente de proveedores externos, conectividad, dominios, navegadores, sistemas operativos y cuentas del cliente. Estudio Equis no controla caídas, suspensiones, cambios de precios, límites, políticas, retenciones, bloqueos o modificaciones de APIs de terceros.

Cuando un cambio externo requiera trabajo técnico, ese trabajo podrá presupuestarse aparte o quedar cubierto por un plan de mantenimiento activo.

_Las exclusiones de responsabilidad aplican a incidentes causados por el cliente, terceros, credenciales expuestas, cambios no autorizados y proveedores externos. Si el problema surge de una falla comprobable de Estudio Equis dentro del alcance contratado y dentro del período de garantía, corresponde la corrección sin costo adicional. Esta limitación no excluye la responsabilidad que pudiera corresponder por errores técnicos directamente atribuibles a Estudio Equis._

8\. Seguridad y accesos

El cliente es responsable de mantener seguras sus contraseñas, usar autenticación en dos pasos cuando esté disponible, no compartir accesos y no publicar tokens o credenciales en canales inseguros, repositorios o interfaces visibles.

Si el cliente permite que otro desarrollador, proveedor o tercero modifique la instalación, Estudio Equis no puede garantizar la integridad de la versión original. En esos casos, la garantía podrá suspenderse hasta realizar una revisión técnica. Los trabajos de diagnóstico, restauración o adaptación podrán presupuestarse aparte.

9\. Datos del negocio y protección de datos personales

Los datos comerciales y operativos generados por el uso de la aplicación pertenecen al cliente: clientes, reservas, turnos, pagos registrados, servicios, productos, imágenes, contenido e historial operativo.

**Exportación de datos:**

El cliente podrá solicitar una exportación de los datos operativos de su negocio en un formato técnicamente disponible. El alcance, formato, plazo y eventual costo de dicha exportación deberán acordarse según el volumen y la complejidad de la información.

**Eliminación de datos:**

El cliente puede solicitar la eliminación de sus datos y de su instancia, sujeta a validación de identidad, obligaciones legales, respaldos técnicos existentes y condiciones operativas acordadas. La eliminación puede requerir un plazo técnico razonable y no implica la eliminación inmediata de copias de seguridad que deban conservarse temporalmente por razones técnicas o legales.

_Atención: el sistema almacena nombres, teléfonos, correos y datos de reservas de personas físicas. El cliente puede quedar alcanzado como responsable de una base de datos personales bajo la Ley 25.326 de Protección de Datos Personales de la República Argentina. La inclusión de una política de privacidad y el cumplimiento de las obligaciones correspondientes son responsabilidad del cliente. Se recomienda consultar con un profesional legal._

10\. Garantía técnica

La garantía cubre exclusivamente errores reproducibles relacionados con el alcance original contratado, durante el período indicado expresamente en la propuesta.

**No cubre:**

• Nuevas funciones, cambios de diseño o personalizaciones.

• Errores de proveedores externos o cambios en sus APIs.

• Problemas causados por accesos de terceros o cambios realizados por el cliente.

• Pérdida de credenciales, suspensión de cuentas o falta de pago de servicios externos.

• Expiración de dominios, aumento de tráfico o superación de límites de infraestructura.

11\. Identificación de autoría de Estudio Equis

La aplicación puede incluir una identificación discreta de autoría: un texto del tipo 'Desarrollado por Estudio Equis', un logo o un enlace en el pie de página, panel, pantalla de instalación u otras secciones no disruptivas. Esta identificación no interfiere con la identidad principal del cliente ni afecta la experiencia de uso. No puede eliminarse sin autorización escrita y forma parte de las condiciones de licencia. Estudio Equis podrá ofrecer una modalidad comercial de retiro de esta identificación si decide incorporarla.

12\. Aceptación y documentación

Antes del inicio, el cliente debe recibir información clara sobre qué compra, qué no compra, qué cuentas le pertenecen, qué pertenece a Estudio Equis, qué incluye la entrega, qué costos externos pueden existir, qué responsabilidades de seguridad asume, qué garantía recibe y qué sucede con futuras ampliaciones. La aceptación debe quedar documentada mediante propuesta, orden de trabajo, contrato o confirmación escrita.

_Este bloque tiene fines informativos y comerciales. Antes de utilizarlo como contrato definitivo, se recomienda la revisión por un abogado argentino, especialmente en lo relativo a exclusiones de responsabilidad, protección de datos personales y condiciones de licencia._
