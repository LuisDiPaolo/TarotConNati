**ESTUDIO EQUIS**

**Propuesta Comercial**

Plataforma modular de turnos, ventas y gestión

_Paquetes, módulos, condiciones de servicio e infraestructura_

Junio 2025 · Versión 3.1 · Confidencial

_Este documento describe el modelo, alcance previsto y criterios generales del producto. No constituye por sí solo una propuesta contractual definitiva, una garantía de disponibilidad, una promesa de resultados ni una obligación de implementar todas las funciones mencionadas. Cada implementación se regirá por la propuesta y el alcance aceptados por el cliente._

# 1\. Qué ofrece el producto

Una plataforma digital propia para profesionales y pequeños negocios que trabajan con turnos, reservas o atención programada.

_Tu agenda, tus servicios, tus pagos y tus clientes en una aplicación con tu marca. No estás en un directorio compartido: tenés tu propia aplicación, tu propio dominio y tu propia base de clientes._

La plataforma puede reunir en una única aplicación instalable (PWA):

- Identidad visual propia: logo, colores, tipografía y portada.
- Catálogo de servicios con precio, duración y modo de pago.
- Agenda configurable con disponibilidad por día, horario y excepciones.
- Sistema de reservas online para los clientes del profesional.
- Cobro de señas o pagos mediante Mercado Pago del profesional.
- Panel administrativo para la gestión diaria.
- Módulos adicionales según el paquete contratado.

# 2\. Para quién está diseñado

| **Sector**         | **Ejemplos orientativos**                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------------- |
| Estética y belleza | Manicura, nail artists, lash artists, depilación, bronceado, maquillaje, cosmetología, peluquerías, barberías |
| Bienestar          | Masajistas, yoga, pilates, entrenadores personales, kinesiólogos, nutricionistas, consultorios independientes |
| Arte y creatividad | Tatuadores, fotógrafos, diseñadores, profesores particulares, talleres, estudios creativos                    |
| Otros servicios    | Veterinarias, técnicos, consultores, estudios profesionales, negocios con atención programada                 |

# 3\. Paquetes disponibles

## Pack Esencial

_Para profesionales que buscan ordenar sus turnos, reducir el intercambio de mensajes y cobrar señas desde una aplicación propia._

**Incluye:**

- Aplicación web instalable (PWA) con identidad visual propia.
- Catálogo de servicios con precio, duración, categoría y modo de pago.
- Agenda configurable: días, horarios, pausas, feriados, bloqueos y excepciones.
- Sistema de reservas online con selección de servicio, fecha y horario.
- Cobro de señas (fijas o porcentuales) integrado con Mercado Pago del profesional.
- Panel administrativo: gestión de turnos, confirmaciones, cancelaciones y notas.
- Ficha básica de clientes.
- Código QR con la URL del negocio.
- Configuración gestionable desde el panel, sin necesidad de modificar código.

## Pack Profesional

_Para profesionales que además quieren analizar los datos de su negocio y mostrar mejor su trabajo._

**Incluye todo lo del Pack Esencial, más:**

- Analítica comercial: ingresos registrados, turnos por período, ticket promedio, clientes nuevos y recurrentes.
- Reportes por servicio: más reservado, tasa de ausencias, recurrencia.
- Métricas temporales: días más activos y horarios con menor ocupación.
- Pago total como alternativa independiente a la seña.
- Productos simples: compra con retiro en el negocio, sin logística ni envíos.
- Portfolio manual: galería curada con imágenes y enlace opcional a Instagram.
- Historial completo de clientes: servicios, pagos, visitas y notas internas.
- Módulo de promociones: descuentos porcentuales o precios especiales con fechas de vigencia.
- Recordatorios automáticos por correo electrónico.
- Notificaciones push transaccionales: confirmación, recordatorio y cancelación.

**Nota sobre analítica:**

_Las métricas reflejan ingresos registrados, cobros y ventas dentro de la plataforma. No reemplazan un sistema contable, fiscal ni de facturación electrónica._

## Pack Comercial

_Para negocios que buscan usar la plataforma como canal activo de ventas, comunicación y fidelización._

**Incluye todo lo del Pack Profesional, más:**

- Campañas push manuales: el profesional redacta y envía mensajes a su base de clientes.
- Promociones programadas con fecha de inicio y fin.
- Cupones con código y descuento aplicable en la reserva.
- Gift cards digitales.
- Paquetes de sesiones: cantidad determinada de turnos a precio especial.
- Segmentación básica: clientes inactivos, frecuentes y nuevos.
- Métricas de campañas: alcance estimado y conversión a reserva.
- Reportes avanzados y posibilidad de exportación de datos.

## Módulos individuales

Es posible contratar módulos por separado sin cambiar de paquete. El cliente puede comenzar con el Pack Esencial e incorporar funciones específicas a medida que las necesite.

| **Módulo**           | **Descripción**                                                  | **Pack mínimo de referencia** |
| -------------------- | ---------------------------------------------------------------- | ----------------------------- |
| Analytics            | Ingresos registrados, métricas y reportes por servicio y período | Profesional                   |
| Portfolio            | Galería curada con imágenes y enlace opcional a Instagram        | Profesional                   |
| Productos            | Venta simple de productos con retiro en el negocio               | Profesional                   |
| Promociones          | Descuentos y precios especiales con fechas de vigencia           | Profesional                   |
| Push transaccional   | Confirmaciones y recordatorios automáticos                       | Profesional                   |
| Campañas push        | Envíos manuales a la base de clientes                            | Comercial                     |
| Gift cards           | Tarjetas de regalo digitales                                     | Comercial                     |
| Paquetes de sesiones | Bundles de turnos a precio especial                              | Comercial                     |
| Cupones              | Códigos de descuento para reservas                               | Comercial                     |

# 4\. Qué incluye la implementación

Al contratar cualquier paquete, el trabajo de setup incluye:

- Asistencia en la creación y configuración de las cuentas técnicas del cliente (Vercel, Supabase, Resend).
- Configuración de identidad visual: colores, tipografía, logo, portada e imágenes.
- Carga inicial de servicios, categorías y precios.
- Configuración de la agenda: días, horarios, pausas y excepciones.
- Vinculación con la cuenta de Mercado Pago del profesional mediante sus propias credenciales.
- Configuración del dominio o subdominio del cliente.
- Despliegue inicial desde el repositorio de Estudio Equis a la infraestructura del cliente.
- Generación del código QR.
- Activación de los módulos contratados.
- Acceso al panel administrativo.

_Los plazos dependen de la recepción completa de los datos, accesos, credenciales, contenidos y confirmaciones requeridas. Las demoras ocasionadas por información incompleta, falta de respuesta, validaciones pendientes o problemas con cuentas de terceros no se imputan a Estudio Equis. Cuando el cliente modifique el alcance durante la implementación, el plazo podrá revisarse._

# 5\. Cómo funcionan los pagos

La plataforma no procesa ni retiene fondos. Los pagos son gestionados directamente por Mercado Pago mediante el Access Token privado del profesional, configurado como variable de entorno. Los cobros son acreditados en la cuenta de Mercado Pago del profesional.

_El flujo previsto es: el cliente final elige el turno y paga → Mercado Pago procesa el cobro con las credenciales del profesional → la plataforma recibe la confirmación y actualiza el estado de la reserva. El dinero va directamente al profesional. Estudio Equis no interviene en la transacción._

- El profesional utiliza su propia cuenta de Mercado Pago.
- Las comisiones de Mercado Pago corresponden al plan del profesional.
- Estudio Equis no retiene comisión sobre los cobros del profesional.
- Los proveedores de infraestructura no tienen visibilidad sobre las transacciones de Mercado Pago.

# 6\. Costos del cliente

## 6.1 Precio de implementación

Es un pago único que cubre el trabajo de setup y entrega del sistema. El cliente adquiere una licencia de uso sobre la instancia implementada para su negocio, no el código fuente ni la plantilla maestra. Los valores orientativos se indican en la propuesta vigente al momento de la contratación.

_El cliente paga por tener su sistema configurado y funcionando. No paga una cuota mensual para seguir usando las funciones ya adquiridas._

## 6.2 Costos de terceros - a cargo del cliente

| **Servicio**         | **Proveedor**                       | **Titular** | **Condiciones orientativas**                                                                                             |
| -------------------- | ----------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| Dominio propio       | Namecheap, NIC.ar u otro            | Cliente     | Costo anual variable según extensión y registrador                                                                       |
| Hosting (frontend)   | Vercel                              | Cliente     | Plan inicial disponible según condiciones vigentes del proveedor                                                         |
| Base de datos        | Supabase                            | Cliente     | Plan inicial disponible según condiciones vigentes del proveedor                                                         |
| Correo transaccional | Resend                              | Cliente     | Plan inicial disponible según condiciones vigentes del proveedor                                                         |
| Pagos                | Mercado Pago                        | Cliente     | Comisión por transacción según plan del profesional                                                                      |
| Notificaciones push  | Web Push API (nativa del navegador) | N/A         | Sin licencia directa adicional; sujeto al consumo de infraestructura y a las condiciones del navegador y del dispositivo |

_Los servicios de infraestructura pueden ofrecer niveles iniciales sin cargo. Su disponibilidad, capacidad y condiciones dependen de cada proveedor y del consumo real de la aplicación. El consumo puede variar según la cantidad de usuarios, reservas, imágenes, archivos, correos, notificaciones, funciones ejecutadas, tráfico, almacenamiento y uso del panel._

_No se garantiza que un nivel inicial sea suficiente durante un período determinado. Si se superan los límites o cambian las condiciones del proveedor, el cliente deberá contratar el plan necesario para mantener el servicio. Estudio Equis puede orientar al cliente sobre los planes disponibles, pero no controla los límites, precios ni políticas de los proveedores externos._

## 6.3 Lo que no paga el cliente

- No paga una cuota mensual obligatoria para usar las funciones ya adquiridas.
- No paga comisión adicional a Estudio Equis sobre los cobros de Mercado Pago.
- No paga por el funcionamiento estándar del sistema entre implementaciones.

# 7\. Qué es del cliente y qué es de Estudio Equis

| **Activo**                                              | **Titular**     | **Descripción**                                                                        |
| ------------------------------------------------------- | --------------- | -------------------------------------------------------------------------------------- |
| Cuentas Vercel, Supabase, Resend, Mercado Pago, dominio | Cliente         | Cuentas propias; Estudio Equis puede asistir en la creación y la configuración inicial |
| Datos del negocio (clientes, turnos, pagos, historial)  | Cliente         | Exportables en los términos acordados; el cliente puede solicitarlos                   |
| Instancia ejecutable de la aplicación                   | Cliente (aloja) | Corre en la cuenta Vercel del cliente; el código fuente permanece en Estudio Equis     |
| Código fuente y plantilla maestra                       | Estudio Equis   | No transferible ni accesible por el cliente                                            |
| Repositorio de GitHub                                   | Estudio Equis   | Privado; el cliente no tiene acceso                                                    |
| Sistema de aprovisionamiento y módulos                  | Estudio Equis   | Propiedad intelectual amparada por Ley 11.723                                          |

_El pago de la implementación no implica cesión de propiedad intelectual. El cliente adquiere una licencia de uso para su propio negocio, no el código ni el derecho a replicarlo, modificarlo o revenderlo._

# 8\. Servicios opcionales

| **Servicio**         | **Descripción**                                                                                 | **Modalidad**                            |
| -------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Soporte técnico      | Diagnóstico, correcciones y recuperación de acceso                                              | Por incidente o paquete de horas prepago |
| Mantenimiento activo | Actualizaciones, ajustes por cambios en Mercado Pago u otros proveedores, revisión de seguridad | Plan mensual o anual opcional            |
| Módulos adicionales  | Activación de nuevas funciones sobre la instalación existente                                   | Precio por módulo                        |
| Cambio de paquete    | Upgrade con activación de módulos del nuevo plan                                                | Precio diferencial entre packs           |
| Personalización      | Desarrollos exclusivos fuera del alcance estándar                                               | Cotización aparte por proyecto           |
| Gestión comercial    | Carga de promociones, campañas push y orientación basada en datos                               | Por campaña o por período acordado       |
| Capacitación         | Entrenamiento en el uso del panel y funciones contratadas                                       | Por sesión                               |

# 9\. Expansión sin cambiar de sistema

Cada módulo adicional se activa sobre la misma instalación, sin migrar datos ni reinstalar la aplicación. La activación puede realizarse por configuración (si el módulo ya está disponible en la versión instalada) o mediante un despliegue con acceso temporal de Estudio Equis (si requiere actualización).

**Ejemplo ilustrativo de ruta de expansión:**

- Mes 1: Pack Esencial activo. El profesional organiza turnos y cobra señas.
- Mes 4: Se incorpora el módulo Analytics. El profesional puede revisar qué servicios generan más ingresos.
- Mes 6: Se incorpora Portfolio. La aplicación muestra los trabajos del profesional.
- Mes 9: Se incorporan Campañas Push. El profesional puede contactar a clientes inactivos.
- Mes 12: El profesional evalúa si un upgrade al Pack Comercial se ajusta a sus necesidades.

_Ejemplo ilustrativo. Los resultados dependen del uso, los precios, la actividad y el comportamiento de cada negocio._

_Cada módulo adicional que el cliente contrata es una ampliación sobre un sistema que ya conoce y usa. La curva de adopción es menor porque la plataforma ya es parte de su operación._

# 10\. Personalizaciones

Si el cliente tiene necesidades fuera del alcance estándar, puede solicitarlas. Estudio Equis evalúa cada solicitud para determinar si corresponde a una configuración existente, un módulo disponible, una mejora general o un desarrollo personalizado.

- Las personalizaciones no incluidas en el producto estándar se presupuestan por separado.
- Estudio Equis puede aceptar, rechazar o proponer una alternativa según el impacto técnico.
- Una personalización exclusiva no otorga al cliente derechos sobre la plantilla maestra.

# 11\. Diferenciación frente a modelos habituales del mercado

Muchas plataformas de turnos funcionan bajo una marca centralizada, con suscripción mensual obligatoria o con nivel de personalización limitado. En determinados modelos, el negocio del profesional aparece dentro de un directorio compartido con otros prestadores del mismo rubro. La propuesta de Estudio Equis prioriza una instancia independiente por cliente, identidad propia, datos aislados y posibilidad de ampliación modular.

| **Aspecto**            | **Modelo de Estudio Equis**                    | **Modelos habituales del mercado**                                        |
| ---------------------- | ---------------------------------------------- | ------------------------------------------------------------------------- |
| Identidad del negocio  | Aplicación con la marca propia del profesional | En muchos casos, el negocio aparece dentro de la plataforma del proveedor |
| Datos del cliente      | Instancia aislada por negocio                  | En algunos modelos, los datos quedan en la plataforma del proveedor       |
| Cobros                 | Directo al profesional vía Mercado Pago propio | Según el plan contratado; algunos modelos retienen comisión               |
| Cuota mensual          | No obligatoria para las funciones adquiridas   | Frecuente en planes con acceso a funciones básicas                        |
| Personalización visual | Total dentro del alcance del sistema           | Variable según el proveedor y el plan                                     |
| Exportación de datos   | Posible en los términos acordados              | Varía entre proveedores                                                   |

_Si el cliente ya utiliza o ha probado otra plataforma, se recomienda identificar qué limitaciones, problemas o necesidades lo llevan a buscar una alternativa._

**Preguntas orientativas para entender la situación del cliente:**

- ¿Qué parte del sistema actual no le resuelve el problema?
- ¿Qué tareas sigue haciendo manualmente?
- ¿Qué costos o comisiones le resultan incómodos?
- ¿Qué datos o métricas no puede consultar?
- ¿Qué nivel de personalización necesita?
- ¿Qué funciones considera indispensables?
- ¿Qué desea conservar de su sistema actual?
- ¿Qué espera mejorar?

_Las respuestas pueden orientar la recomendación del paquete adecuado, la activación de módulos existentes o la cotización de una implementación personalizada. El producto estándar no necesariamente resolverá todos los requerimientos posibles._

# 12\. Disponibilidad y servicios externos

La disponibilidad del sistema depende parcialmente de proveedores externos, conectividad, dominios, navegadores, sistemas operativos y cuentas del cliente. Estudio Equis no controla caídas, suspensiones, cambios de precios, límites, políticas, retenciones, bloqueos o modificaciones de APIs de terceros.

Cuando un cambio externo requiera trabajo técnico, ese trabajo podrá presupuestarse aparte o quedar cubierto por un plan de mantenimiento activo.

# 13\. Nota sobre datos personales

El sistema almacena nombres, teléfonos, correos y datos de reservas de personas físicas. El profesional que opera la plataforma puede quedar alcanzado como responsable de una base de datos personales bajo la Ley 25.326 de Protección de Datos Personales. La inclusión de una política de privacidad y el cumplimiento de las obligaciones correspondientes son responsabilidad del cliente. Se recomienda consultar con un profesional legal.

# 14\. Cómo empezar

- Elegir el paquete que mejor se ajuste a las necesidades actuales del negocio.
- Acordar el precio de implementación y el alcance inicial.
- Crear o configurar las cuentas técnicas (Vercel, Supabase, Resend); Estudio Equis puede asistir en este proceso.
- Proporcionar la información del negocio: datos, logo, imágenes, servicios, horarios y políticas.
- Configurar Mercado Pago: seguir la guía provista por Estudio Equis para obtener y entregar las credenciales de forma segura.
- Estudio Equis implementa, configura y despliega el sistema en la infraestructura del cliente.
- El profesional completa la configuración restante desde el panel con el asistente de inicio.
- La plataforma queda disponible para su uso.

_El sistema está diseñado para ampliarse sobre la misma instalación, sin migrar datos ni reinstalar la aplicación. La incorporación de cada nuevo módulo está sujeta a la versión instalada, la disponibilidad técnica y la coordinación con Estudio Equis._

# Modelo de propiedad, cuentas y responsabilidades

## 1\. Titularidad de las cuentas técnicas

Cada implementación funciona sobre cuentas independientes asociadas al cliente o al proyecto contratado. El cliente puede proporcionar un correo existente o solicitar que se utilice uno específico para crear las cuentas del proyecto.

| **Cuenta / Servicio**         | **Titular**   | **Costo**                      | **Acceso de Estudio Equis**                              |
| ----------------------------- | ------------- | ------------------------------ | -------------------------------------------------------- |
| Vercel (hosting)              | Cliente       | A cargo del cliente            | Temporal, para implementación o actualización            |
| Supabase (base de datos)      | Cliente       | A cargo del cliente            | Temporal, para implementación o actualización            |
| Resend (correo transaccional) | Cliente       | A cargo del cliente            | Temporal, para configuración                             |
| Mercado Pago                  | Cliente       | Comisiones propias del plan MP | Nunca. Solo configura credenciales en variables privadas |
| Dominio                       | Cliente       | Renovación a cargo del cliente | Solo para configuración DNS y vinculación inicial        |
| Correo del proyecto           | Cliente       | A cargo del cliente            | No                                                       |
| GitHub / código fuente        | Estudio Equis | Interno de Estudio Equis       | N/A - propiedad exclusiva                                |

## 2\. Propiedad intelectual del producto

La plantilla maestra, el código fuente, la arquitectura, los componentes reutilizables, los scripts, las automatizaciones, el sistema de módulos, el sistema de aprovisionamiento, la documentación técnica interna, los procedimientos de despliegue y las mejoras generales pertenecen exclusivamente a Estudio Equis. Esta protección está amparada por la Ley 11.723 de Propiedad Intelectual de la República Argentina.

_El pago de la implementación otorga una licencia de uso limitada al negocio, marca, instalación, profesionales y sucursales contratados. No implica cesión de propiedad intelectual. El cliente aloja y utiliza una instancia ejecutable del producto, pero no adquiere la propiedad ni el acceso al código fuente._

El cliente no adquiere:

- Código fuente ni acceso al repositorio de GitHub.
- Derecho de copia, distribución, reventa o sublicencia.
- Derecho de modificación ni de crear productos derivados.
- Acceso a componentes reutilizables de otros proyectos.
- Plantilla maestra ni sistema de aprovisionamiento.

## 3\. Licencia de uso

El cliente adquiere una licencia de uso sobre la instancia implementada para su propio negocio, válida para un negocio, una marca, una instalación y la cantidad de profesionales y sucursales expresamente contratadas.

**La licencia permite:**

- Utilizar la aplicación en producción para el negocio contratado.
- Administrar los datos del negocio desde el panel.
- Gestionar las funciones contratadas.
- Operar la agenda, reservas, pagos y módulos adquiridos.
- Solicitar una exportación de datos en los términos acordados.

**La licencia no permite:**

- Revender el sistema, duplicarlo o entregarlo a terceros.
- Utilizarlo para implementar otro negocio o marca.
- Extraer, reutilizar o redistribuir el código.
- Realizar ingeniería inversa ni eliminar protecciones técnicas.
- Alterar la aplicación mediante terceros sin autorización escrita de Estudio Equis.
- Eliminar u ocultar la identificación de autoría de Estudio Equis.

## 4\. Funcionamiento de los pagos con Mercado Pago

La cuenta de Mercado Pago debe pertenecer al cliente. La plataforma no procesa ni retiene fondos: utiliza el Access Token privado del cliente para crear preferencias de pago y recibir confirmaciones por webhook. Los cobros son procesados directamente por Mercado Pago y acreditados en la cuenta del cliente.

_El flujo previsto es: el cliente final elige el turno y paga → Mercado Pago procesa el cobro con las credenciales del profesional → la plataforma recibe la confirmación y actualiza el estado de la reserva. Los fondos van directamente al profesional. Estudio Equis no interviene en la transacción ni cobra comisión sobre los cobros._

**Estudio Equis:**

- No recibe fondos ni administra liquidaciones.
- No controla retiros ni responde por bloqueos, retenciones o decisiones de Mercado Pago.
- No responde por credenciales revocadas o modificadas por el cliente o por Mercado Pago.
- No cobra comisión adicional sobre las transacciones del profesional.

**Nota técnica:**

_Los proveedores de infraestructura (Vercel, Supabase) no tienen visibilidad sobre las transacciones de Mercado Pago. Para ellos, la integración es una llamada a una API externa. Lo que estos proveedores miden es consumo de recursos: tráfico, base de datos, almacenamiento y cantidad de peticiones._

## 5\. Dominio

El dominio puede ser registrado directamente por el cliente o gestionado por Estudio Equis. En ambos casos, debe quedar bajo titularidad o control del cliente al finalizar la implementación. Las renovaciones futuras son responsabilidad del cliente.

**Si Estudio Equis gestiona el registro:**

- El servicio incluye búsqueda, registro, configuración de DNS, delegación, vinculación con Vercel y validación SSL.
- El costo de gestión es adicional e independiente del valor oficial del dominio.
- El precio vigente se indicará en la propuesta correspondiente.

## 6\. Actualizaciones y mantenimiento

La versión entregada incluye las funciones contratadas al momento de la implementación. Las nuevas versiones del producto, mejoras generales, cambios de compatibilidad y actualizaciones motivadas por modificaciones de terceros no están incluidas automáticamente.

| **Tipo de actualización**                                                | **Cobertura**                                                                                                           |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Correcciones dentro del período de garantía                              | Incluida. Cubre errores reproducibles del alcance contratado.                                                           |
| Actualizaciones de compatibilidad (Vercel, Supabase, Mercado Pago, APIs) | No incluida por defecto. Puede cubrirse con plan de mantenimiento o pago puntual.                                       |
| Nuevos módulos                                                           | Se cotizan y activan de forma independiente.                                                                            |
| Mejoras generales de la plantilla                                        | Estudio Equis puede ofrecer versiones actualizadas, pero no está obligado a instalarlas en implementaciones existentes. |

Cuando el cliente contrate una ampliación, Estudio Equis podrá solicitar acceso temporal a Vercel, Supabase, Resend, Mercado Pago, dominio u otros servicios necesarios. El despliegue se realiza mediante integración temporal, CLI, token de despliegue, archivos precompilados u otro mecanismo técnico. Finalizada la intervención, los accesos temporales podrán revocarse o desconectarse.

## 7\. Disponibilidad y servicios externos

La disponibilidad del sistema depende parcialmente de proveedores externos, conectividad, dominios, navegadores, sistemas operativos y cuentas del cliente. Estudio Equis no controla caídas, suspensiones, cambios de precios, límites, políticas, retenciones, bloqueos o modificaciones de APIs de terceros.

Cuando un cambio externo requiera trabajo técnico, ese trabajo podrá presupuestarse aparte o quedar cubierto por un plan de mantenimiento activo.

_Las exclusiones de responsabilidad aplican a incidentes causados por el cliente, terceros, credenciales expuestas, cambios no autorizados y proveedores externos. Si el problema surge de una falla comprobable de Estudio Equis dentro del alcance contratado y dentro del período de garantía, corresponde la corrección sin costo adicional. Esta limitación no excluye la responsabilidad que pudiera corresponder por errores técnicos directamente atribuibles a Estudio Equis._

## 8\. Seguridad y accesos

El cliente es responsable de mantener seguras sus contraseñas, usar autenticación en dos pasos cuando esté disponible, no compartir accesos y no publicar tokens o credenciales en canales inseguros, repositorios o interfaces visibles.

Si el cliente permite que otro desarrollador, proveedor o tercero modifique la instalación, Estudio Equis no puede garantizar la integridad de la versión original. En esos casos, la garantía podrá suspenderse hasta realizar una revisión técnica. Los trabajos de diagnóstico, restauración o adaptación podrán presupuestarse aparte.

## 9\. Datos del negocio y protección de datos personales

Los datos comerciales y operativos generados por el uso de la aplicación pertenecen al cliente: clientes, reservas, turnos, pagos registrados, servicios, productos, imágenes, contenido e historial operativo.

**Exportación de datos:**

El cliente podrá solicitar una exportación de los datos operativos de su negocio en un formato técnicamente disponible. El alcance, formato, plazo y eventual costo de dicha exportación deberán acordarse según el volumen y la complejidad de la información.

**Eliminación de datos:**

El cliente puede solicitar la eliminación de sus datos y de su instancia, sujeta a validación de identidad, obligaciones legales, respaldos técnicos existentes y condiciones operativas acordadas. La eliminación puede requerir un plazo técnico razonable y no implica la eliminación inmediata de copias de seguridad que deban conservarse temporalmente por razones técnicas o legales.

_Atención: el sistema almacena nombres, teléfonos, correos y datos de reservas de personas físicas. El cliente puede quedar alcanzado como responsable de una base de datos personales bajo la Ley 25.326 de Protección de Datos Personales de la República Argentina. La inclusión de una política de privacidad y el cumplimiento de las obligaciones correspondientes son responsabilidad del cliente. Se recomienda consultar con un profesional legal._

## 10\. Garantía técnica

La garantía cubre exclusivamente errores reproducibles relacionados con el alcance original contratado, durante el período indicado expresamente en la propuesta.

**No cubre:**

- Nuevas funciones, cambios de diseño o personalizaciones.
- Errores de proveedores externos o cambios en sus APIs.
- Problemas causados por accesos de terceros o cambios realizados por el cliente.
- Pérdida de credenciales, suspensión de cuentas o falta de pago de servicios externos.
- Expiración de dominios, aumento de tráfico o superación de límites de infraestructura.

## 11\. Identificación de autoría de Estudio Equis

La aplicación puede incluir una identificación discreta de autoría: un texto del tipo 'Desarrollado por Estudio Equis', un logo o un enlace en el pie de página, panel, pantalla de instalación u otras secciones no disruptivas. Esta identificación no interfiere con la identidad principal del cliente ni afecta la experiencia de uso. No puede eliminarse sin autorización escrita y forma parte de las condiciones de licencia. Estudio Equis podrá ofrecer una modalidad comercial de retiro de esta identificación si decide incorporarla.

## 12\. Aceptación y documentación

Antes del inicio, el cliente debe recibir información clara sobre qué compra, qué no compra, qué cuentas le pertenecen, qué pertenece a Estudio Equis, qué incluye la entrega, qué costos externos pueden existir, qué responsabilidades de seguridad asume, qué garantía recibe y qué sucede con futuras ampliaciones. La aceptación debe quedar documentada mediante propuesta, orden de trabajo, contrato o confirmación escrita.

_Este bloque tiene fines informativos y comerciales. Antes de utilizarlo como contrato definitivo, se recomienda la revisión por un abogado argentino, especialmente en lo relativo a exclusiones de responsabilidad, protección de datos personales y condiciones de licencia._