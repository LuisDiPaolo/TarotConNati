**ESTUDIO EQUIS**

**Arquitectura Modular**

Plataforma modular de turnos, ventas y gestión

_Estructura de módulos, flags de activación y criterios de extensión_

Junio 2025 · Versión 3.1 · Confidencial

_Este documento describe el modelo, alcance previsto y criterios generales del producto. No constituye por sí solo una propuesta contractual definitiva, una garantía de disponibilidad, una promesa de resultados ni una obligación de implementar todas las funciones mencionadas. Cada implementación se regirá por la propuesta y el alcance aceptados por el cliente._

# 1\. Qué es la arquitectura modular

La plataforma está concebida como una única aplicación con capacidad para mostrar u ocultar secciones completas según la configuración de cada cliente. No existen versiones separadas del software: hay una plantilla maestra bajo control de Estudio Equis y un mecanismo de control de visibilidad que determina qué funciones ve y usa cada cliente.

## Estructura de titularidad

| **Activo**                        | **Titular**     | **Descripción**                                                                                     |
| --------------------------------- | --------------- | --------------------------------------------------------------------------------------------------- |
| Plantilla maestra y código fuente | Estudio Equis   | Repositorio de GitHub privado, no accesible por el cliente                                          |
| Instancia ejecutable en Vercel    | Cliente (aloja) | Desplegada desde el repositorio de Estudio Equis; el cliente aloja la instancia, no posee el código |
| Base de datos Supabase            | Cliente         | Instancia propia con datos exclusivos del negocio                                                   |
| Credenciales de Mercado Pago      | Cliente         | Access Token propio; los cobros van directamente a su cuenta                                        |
| Dominio                           | Cliente         | Bajo titularidad o control del cliente                                                              |
| Datos del negocio                 | Cliente         | Exportables según los términos acordados                                                            |

# 2\. Mapa de módulos

## 2.1 Núcleo - siempre activo

Estos módulos están presentes en todas las implementaciones y no pueden deshabilitarse de forma individual.

| **Módulo**      | **Descripción**                             | **Panel admin** | **Público** |
| --------------- | ------------------------------------------- | --------------- | ----------- |
| identity        | Marca, logo, colores, tipografía y textos   | ✓               | ✓           |
| services        | Catálogo de servicios                       | ✓               | ✓           |
| schedule        | Disponibilidad y agenda semanal             | ✓               | ✓           |
| appointments    | Reservas y gestión de turnos                | ✓               | ✓           |
| deposits        | Cobro de señas con Mercado Pago del cliente | ✓               | ✓           |
| customers_basic | Datos básicos del cliente en la reserva     | ✓               | -           |
| pwa             | Instalación, manifest e ícono               | -               | ✓           |
| admin_panel     | Panel administrativo base                   | ✓               | -           |

## 2.2 Módulos opcionales

| **Flag**                 | **Módulo**                      | **Pack mínimo** | **Público** | **Panel** |
| ------------------------ | ------------------------------- | --------------- | ----------- | --------- |
| full_payments_enabled    | Pago total (sin seña)           | Profesional     | ✓           | ✓         |
| analytics_enabled        | Analítica comercial             | Profesional     | -           | ✓         |
| products_enabled         | Productos simples               | Profesional     | ✓           | ✓         |
| portfolio_enabled        | Portfolio y galería manual      | Profesional     | ✓           | ✓         |
| promotions_enabled       | Promociones con descuento       | Profesional     | ✓           | ✓         |
| customer_history_enabled | Historial completo de clientes  | Profesional     | -           | ✓         |
| reports_enabled          | Reportes por servicio y período | Profesional     | -           | ✓         |
| push_enabled             | Push transaccional              | Profesional     | -           | ✓         |
| push_campaigns_enabled   | Campañas push manuales          | Comercial       | -           | ✓         |
| coupons_enabled          | Cupones con código              | Comercial       | ✓           | ✓         |
| gift_cards_enabled       | Gift cards digitales            | Comercial       | ✓           | ✓         |
| packages_enabled         | Paquetes de sesiones            | Comercial       | ✓           | ✓         |
| segmentation_enabled     | Segmentación básica de clientes | Comercial       | -           | ✓         |
| advanced_reports_enabled | Reportes avanzados              | Comercial       | -           | ✓         |
| multi_staff_enabled      | Varios profesionales            | Futuro          | ✓           | ✓         |
| multi_location_enabled   | Varias sucursales               | Futuro          | ✓           | ✓         |
| waitlist_enabled         | Lista de espera                 | Futuro          | ✓           | ✓         |
| memberships_enabled      | Membresías                      | Futuro          | ✓           | ✓         |

# 3\. Cómo funciona el control de módulos

## 3.1 Tabla features en Supabase

Cada instancia contiene una tabla features en la base de datos del cliente, con un campo booleano por módulo. Estudio Equis actualiza este campo cuando el cliente contrata una ampliación.

| **feature_key**        | **enabled** | **activated_at** | **Observación**         |
| ---------------------- | ----------- | ---------------- | ----------------------- |
| analytics_enabled      | true        | 2025-06-01       | Pack Profesional activo |
| portfolio_enabled      | false       | -                | No contratado           |
| push_campaigns_enabled | false       | -                | No contratado           |

## 3.2 Activación de un módulo

La activación depende del estado de la instalación existente:

_Si el módulo ya está disponible en la versión instalada, puede habilitarse mediante un cambio de configuración. Si el módulo requiere una versión nueva, migraciones de base de datos o cambios de infraestructura, Estudio Equis realizará el despliegue correspondiente con acceso temporal a las cuentas del cliente._

Proceso general cuando se contrata una ampliación:

- El cliente solicita la ampliación y abona el módulo.
- Estudio Equis evalúa si la versión instalada es compatible o requiere actualización.
- Si corresponde, Estudio Equis accede temporalmente a las cuentas del cliente para ejecutar la actualización.
- Se actualiza el campo enabled en la tabla features y se despliega desde el repositorio privado.
- El cliente recarga el panel: el módulo queda disponible.
- El cliente configura el módulo y comienza a usarlo.

# 4\. Personalización visual sin modificar código

La identidad visual de cada cliente se carga desde su base de datos y se aplica mediante propiedades CSS personalizadas. El cambio de colores o tipografía no requiere modificar el código fuente.

| **Variable CSS** | **Qué controla**                        | **Configurable desde el panel** |
| ---------------- | --------------------------------------- | ------------------------------- |
| \--color-primary | Color principal de la marca             | Sí                              |
| \--color-accent  | Color secundario y llamadas a la acción | Sí                              |
| \--color-bg      | Fondo general de la aplicación          | Sí                              |
| \--font-heading  | Tipografía de títulos                   | Sí                              |
| \--font-body     | Tipografía de cuerpo de texto           | Sí                              |
| \--border-radius | Redondez general de botones y tarjetas  | Sí                              |

# 5\. Personalizaciones solicitadas por el cliente

El producto estándar está diseñado para cubrir las necesidades habituales del público objetivo. El cliente puede solicitar cambios o funciones adicionales, que serán evaluados según la siguiente clasificación:

| **Tipo**                   | **Ejemplos**                                              | **Costo adicional** | **Afecta plantilla maestra** |
| -------------------------- | --------------------------------------------------------- | ------------------- | ---------------------------- |
| Configuración              | Color, logo, textos, horarios, servicios, seña, políticas | No                  | No                           |
| Módulo disponible          | Activar portfolio, analítica, productos, push             | Según paquete       | No                           |
| Personalización específica | Flujo exclusivo, integración externa, diseño particular   | Sí, cotizar aparte  | No (desacoplado)             |
| Mejora general             | Función que podría beneficiar a varios clientes           | Evaluación interna  | Potencialmente               |

- Las personalizaciones no incluidas en el estándar se presupuestan por separado.
- Estudio Equis podrá aceptar, rechazar o proponer una alternativa cuando una personalización comprometa la estabilidad, seguridad, escalabilidad o mantenibilidad de la plantilla.
- Una personalización exclusiva no otorga al cliente derechos sobre la plantilla maestra ni sobre otros componentes del producto.
- Si una solicitud puede beneficiar a varios clientes, podrá evaluarse como nuevo módulo general. Si beneficia únicamente a un cliente, se tratará como implementación personalizada con costo adicional.

# 6\. Aislamiento de datos y seguridad

Cada cliente dispone de su propia instancia de Supabase. No existe un sistema multiusuario compartido entre clientes. Esto implica que los datos de un cliente no son accesibles desde otro, y que un problema en una instancia no afecta al resto.

- Las credenciales de Mercado Pago son propias del cliente: los cobros van directamente a su cuenta.
- El repositorio de código fuente permanece bajo control de Estudio Equis y no es accesible por los clientes.
- El cliente puede solicitar una exportación de sus datos operativos en los términos acordados.

Si el cliente permite que otro desarrollador, proveedor o tercero modifique la instalación, Estudio Equis no puede garantizar la integridad de la versión original. En esos casos, la garantía podrá suspenderse hasta realizar una revisión técnica, cuyos costos podrán presupuestarse aparte.

# 7\. Infraestructura y costos

Los servicios de infraestructura pueden ofrecer niveles iniciales sin cargo. Su disponibilidad, capacidad y condiciones dependen de cada proveedor y del consumo real de la aplicación.

El consumo puede variar según la cantidad de usuarios, reservas, imágenes, archivos, correos, notificaciones, funciones ejecutadas, tráfico, almacenamiento y uso del panel. Estudio Equis puede orientar al cliente sobre los planes disponibles, pero no controla los límites, precios ni políticas de los proveedores externos.

No se garantiza que un nivel inicial sea suficiente durante un período determinado. Si se superan los límites o cambian las condiciones del proveedor, el cliente deberá contratar el plan necesario para mantener el servicio.

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