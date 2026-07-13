**ESTUDIO EQUIS**

**Modelo de Negocio**

Análisis para el mercado argentino

_Monetización, expansión por módulos, escenarios financieros y contexto local_

Junio 2025 · Versión 3.1 · Confidencial

_Este documento describe el modelo, alcance previsto y criterios generales del producto. No constituye por sí solo una propuesta contractual definitiva, una garantía de disponibilidad, una promesa de resultados ni una obligación de implementar todas las funciones mencionadas. Cada implementación se regirá por la propuesta y el alcance aceptados por el cliente._

_Los precios, escenarios y proyecciones de este documento son valores orientativos sujetos a revisión. No constituyen una lista de precios vigente, una promesa comercial ni una garantía de ventas, ingresos, conversión, adopción o crecimiento. Se presentan exclusivamente como análisis interno para apoyar decisiones de negocio._

# 1\. El problema central del modelo

El objetivo del producto es que pueda ofrecerse a distintos clientes sin que las horas de trabajo crezcan en la misma proporción que la cantidad de implementaciones. Eso depende de que se cumplan, en mayor o menor medida, tres condiciones:

| **Condición**                                            | **Si no se cumple, el riesgo es...**                         |
| -------------------------------------------------------- | ------------------------------------------------------------ |
| El setup de cada cliente requiere pocas horas            | El margen de la implementación se reduce                     |
| La mayor parte del producto es común entre clientes      | Se termina desarrollando una solución distinta para cada uno |
| Existen ingresos posteriores a la implementación inicial | El negocio depende casi por completo de ventas nuevas        |

El modelo no requiere una suscripción mensual obligatoria para ser viable. Lo que necesita es un valor inicial suficiente, un proceso de implementación que pueda optimizarse con el tiempo y una ruta de expansión posterior por módulos.

# 2\. Estructura de titularidad como base del modelo

La separación entre lo que pertenece al cliente y lo que pertenece a Estudio Equis no es solo una cuestión legal: es parte de lo que hace sostenible el modelo de negocio.

| **Activo**                                    | **Titular**     | **Relevancia comercial**                                                      |
| --------------------------------------------- | --------------- | ----------------------------------------------------------------------------- |
| Código fuente, plantilla maestra, repositorio | Estudio Equis   | Permite ofrecer el producto a distintos clientes sin perder el activo central |
| Instancia ejecutable (Vercel)                 | Cliente (aloja) | El cliente no puede replicar ni revender el sistema                           |
| Base de datos Supabase                        | Cliente         | Los datos del negocio son del cliente; Estudio Equis no los retiene           |
| Credenciales de Mercado Pago                  | Cliente         | Los cobros se acreditan directamente al profesional                           |
| Dominio                                       | Cliente         | Control del profesional sobre su propia URL                                   |
| Datos del negocio                             | Cliente         | Pueden exportarse en los términos acordados                                   |

_El código fuente es el activo central de Estudio Equis. El cliente adquiere una licencia de uso sobre su instancia, no el código. Esta distinción es lo que permite ofrecer el producto a múltiples clientes sin desarrollarlo nuevamente cada vez._

# 3\. Estructura de ingresos

## 3.1 Ingreso por implementación (pago único)

Es el ingreso principal previsto en la etapa inicial. Cubre el tiempo de configuración y entrega del sistema.

| **Paquete**       | **Rango orientativo de lanzamiento (ARS)** | **Rango orientativo a futuro (ARS)** | **Setup estimado (objetivo interno)** |
| ----------------- | ------------------------------------------ | ------------------------------------ | ------------------------------------- |
| Pack Esencial     | \$120.000 - \$150.000                      | \$200.000 - \$250.000                | Algunas horas de trabajo técnico      |
| Pack Profesional  | \$200.000 - \$280.000                      | \$320.000 - \$400.000                | Más horas que el Pack Esencial        |
| Pack Comercial    | \$350.000 - \$450.000                      | \$500.000 - \$650.000                | El de mayor tiempo de configuración   |
| Módulo individual | \$50.000 - \$90.000                        | \$80.000 - \$130.000                 | Variable según el módulo              |

_Valores orientativos sujetos a revisión. No constituyen una lista de precios vigente ni una promesa comercial. Como referencia de contexto, a junio de 2025 el dólar blue ronda los ARS 1.400-1.450, por lo que el Pack Esencial de lanzamiento equivaldría aproximadamente a USD 85-105 a esa cotización. Los precios deberían revisarse periódicamente o anclarse a una referencia en USD para reducir el impacto de la inflación._

**Sobre el precio de lanzamiento:**

Un precio inicial bajo puede tener sentido estratégico para conseguir los primeros casos de uso reales. Una vez que el producto esté validado y el proceso de implementación esté más optimizado, el precio podría revisarse al alza, en línea con el valor que ofrece la plataforma.

## 3.2 Ingresos por expansión (módulos)

Esta es una vía de crecimiento relevante dentro del modelo: cada cliente activo representa una oportunidad de venta con un costo de adquisición bajo, dado que ya conoce y usa el sistema. Cuando el cliente contrata un módulo adicional, Estudio Equis puede necesitar acceso temporal a sus cuentas para desplegar la actualización desde el repositorio privado.

| **Posible motivo de expansión**                | **Módulo**            | **Rango orientativo (ARS)** |
| ---------------------------------------------- | --------------------- | --------------------------- |
| El negocio crece y quiere mostrar su trabajo   | Portfolio             | \$60.000 - \$90.000         |
| Quiere entender mejor sus ingresos             | Analytics             | \$70.000 - \$100.000        |
| Tiene clientes inactivos que recuperar         | Campañas Push         | \$80.000 - \$120.000        |
| Empieza a vender productos además de servicios | Productos simples     | \$60.000 - \$90.000         |
| Quiere fidelizar con gift cards o bundles      | Gift Cards + Paquetes | \$90.000 - \$130.000        |
| Suma un empleado o profesional                 | Multi-staff (futuro)  | \$120.000 - \$180.000       |
| Quiere cambiar de pack completo                | Upgrade diferencial   | Diferencia entre packs      |

## 3.3 Ingresos por servicios opcionales

| **Servicio**                  | **Rango orientativo**       | **Perfil de cliente que podría contratarlo**               |
| ----------------------------- | --------------------------- | ---------------------------------------------------------- |
| Pack de horas prepago (3 hs)  | \$45.000 - \$60.000 ARS     | Busca soporte disponible sin compromiso mensual            |
| Pack de horas prepago (6 hs)  | \$80.000 - \$110.000 ARS    | Negocio activo que necesita ajustes con cierta frecuencia  |
| Plan de mantenimiento mensual | \$20.000 - \$45.000 ARS/mes | Prioriza continuidad y ajustes ante cambios de proveedores |
| Gestión comercial mensual     | \$30.000 - \$55.000 ARS/mes | Prefiere delegar la carga de campañas y promociones        |
| Personalización a medida      | Cotización por proyecto     | Tiene requerimientos fuera del estándar                    |

_El plan de mantenimiento mensual es opcional y no constituye una cuota obligatoria para seguir usando las funciones ya adquiridas. Cubre principalmente ajustes por cambios en APIs de terceros - en particular Mercado Pago, que actualiza su API con cierta frecuencia - y actualizaciones de compatibilidad. Es uno de los argumentos más concretos para el ingreso recurrente: los clientes sin este plan deberían abonar cada ajuste de forma puntual._

# 4\. El contexto argentino

## 4.1 Resistencia a los pagos recurrentes

- Experiencias previas con servicios que continúan cobrando aunque no generen valor percibido.
- Sensación de pérdida de control asociada a dejar de pagar y perder lo construido.
- Inflación que erosiona el valor de una cuota fija en pesos, mientras que en dólares puede volverse cara si sube el tipo de cambio.

Una posible respuesta no es eliminar la recurrencia, sino diseñarla de manera que el cliente perciba un valor concreto, en lugar de sentirla como una obligación. El nombre elegido para el servicio puede influir en esa percepción: una denominación como 'plan de mantenimiento activo' comunica lo que protege, mientras que 'suscripción mensual' suele asociarse a un costo fijo sin contrapartida clara.

## 4.2 Inflación y precios

- Posibilidad de fijar precios en ARS con revisión periódica explícita en el acuerdo.
- Alternativa: precio de referencia en USD, comunicado en ARS al tipo de cambio del día del pago.
- Un punto a favor del modelo: la mayor parte de los costos de infraestructura recurrente recaen sobre el cliente, no sobre Estudio Equis. La inflación puede afectar el margen en pesos, pero no genera necesariamente una carga de infraestructura para Estudio Equis.

## 4.3 Mercado Pago como facilitador

Una parte relevante del público objetivo ya utiliza Mercado Pago, lo que puede reducir la fricción de adopción. El Access Token privado del cliente se configura como variable de entorno: para la infraestructura de hosting, esto es una llamada a una API externa, no un procesador de pagos separado. Los cobros se acreditan directamente al profesional, sin intermediación de Estudio Equis.

## 4.4 Alternativas existentes al sistema

Para buena parte del público objetivo, la alternativa actual no es necesariamente otra plataforma de turnos, sino la gestión manual por WhatsApp o mensajes directos en redes sociales. La propuesta de valor puede apoyarse en cuánto tiempo y cuántas ausencias podría representar esa gestión manual, aunque el resultado varía según cada negocio.

# 5\. Posibles argumentos de venta para el mercado argentino

| **Situación habitual**                                     | **Cómo puede ayudar la plataforma**                                     | **Consideración**                                                            |
| ---------------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Ausencias sin aviso que generan pérdida de tiempo y dinero | Permite cobrar una seña previa, lo que puede ayudar a reducir ausencias | El impacto varía según el rubro y el comportamiento de cada base de clientes |
| Tiempo dedicado a coordinar turnos por mensajes            | Facilita la reserva online sin intermediación manual                    | El tiempo liberado depende del volumen actual de mensajes                    |
| Dificultad para saber qué servicio genera más ingresos     | Brinda información de ingresos registrados por servicio                 | Es información de apoyo, no un reemplazo de un sistema contable              |
| Clientes que no vuelven a reservar                         | Permite enviar recordatorios y comunicaciones a la base de clientes     | La efectividad depende de cómo se utilice la herramienta                     |
| Falta de presencia digital propia                          | Ofrece una aplicación con identidad visual y dominio propios            | Puede contribuir a la percepción de profesionalismo del negocio              |

_Ejemplo ilustrativo, no una promesa de resultado: un profesional con ausencias frecuentes podría reducir esa pérdida al exigir una seña previa. El resultado concreto depende del precio del servicio, la frecuencia de ausencias actual y el comportamiento de cada base de clientes._

# 6\. Costos de infraestructura

## 6.1 Arquitectura de cuentas

Cada cliente tiene sus propias cuentas en Vercel y Supabase. Estudio Equis configura y despliega desde su repositorio privado, pero no paga la infraestructura de los clientes ni concentra sus credenciales. Esto limita la exposición financiera de Estudio Equis frente al crecimiento de la base de clientes, aunque no la elimina por completo, ya que ciertas tareas de soporte podrían requerir tiempo adicional.

## 6.2 Consideraciones sobre el costo para un negocio típico

| **Servicio** | **Qué mide el proveedor**                               | **Cuándo podría aparecer un costo**           | **Referencia de costo superior**                                 |
| ------------ | ------------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------- |
| Vercel       | Tráfico, funciones de servidor, cantidad de solicitudes | Con tráfico alto o uso intensivo de funciones | Plan de pago disponible según condiciones vigentes del proveedor |
| Supabase     | Base de datos, almacenamiento, cantidad de solicitudes  | Con volumen alto de datos o imágenes          | Plan de pago disponible según condiciones vigentes del proveedor |
| Resend       | Cantidad de correos enviados                            | Con alto volumen de recordatorios automáticos | Plan de pago disponible según condiciones vigentes del proveedor |

_Ninguno de estos proveedores mide si el negocio cobra con Mercado Pago ni cuántas transacciones realiza: lo que facturan es consumo de recursos de hosting._

Los servicios de infraestructura pueden ofrecer niveles iniciales sin cargo. Su disponibilidad, capacidad y condiciones dependen de cada proveedor y del consumo real de la aplicación. No se garantiza que un nivel inicial sea suficiente durante un período determinado: si se superan los límites o cambian las condiciones del proveedor, el cliente deberá contratar el plan necesario para mantener el servicio.

# 7\. Escenarios financieros (análisis interno)

_Los siguientes escenarios son hipotéticos y se presentan exclusivamente para análisis interno. No representan una garantía de ventas, ingresos, conversión, adopción ni crecimiento._

## 7.1 Escenario ilustrativo: 10 clientes en 12 meses

| **Fuente de ingreso**                                     | **Cálculo de referencia**            | **Estimado ARS** |
| --------------------------------------------------------- | ------------------------------------ | ---------------- |
| Implementaciones                                          | 10 clientes x \$200.000 ARS promedio | \$2.000.000      |
| Módulos adicionales (hipótesis: 40 % de clientes)         | 4 x \$80.000                         | \$320.000        |
| Packs de horas prepago (hipótesis: 30 %)                  | 3 x \$70.000                         | \$210.000        |
| Plan de mantenimiento (hipótesis: 20 %, 8 meses promedio) | 2 x \$30.000 x 8                     | \$480.000        |
| Total del escenario                                       |                                      | \$3.010.000 ARS  |

_A una referencia de ~ARS 1.430/USD, este escenario equivaldría a aproximadamente USD 2.100. Es un escenario hipotético para análisis interno; los porcentajes de conversión a módulos, horas o mantenimiento son supuestos, no datos observados._

## 7.2 Escenario ilustrativo a varios años

La siguiente tabla plantea un posible camino de crecimiento si se cumplieran determinados supuestos de retención y expansión de clientes. No debe interpretarse como una proyección de resultados esperados ni como un objetivo comprometido.

| **Período** | **Clientes activos (hipótesis)** | **Nuevas ventas (hipótesis)** | **Recurrente mensual (hipótesis)** | **Ingreso anual (hipótesis)**   |
| ----------- | -------------------------------- | ----------------------------- | ---------------------------------- | ------------------------------- |
| Primer año  | 10                               | 10                            | \$60.000 - \$90.000 ARS            | \$3.000.000 - \$3.500.000 ARS   |
| Segundo año | 25                               | 15                            | \$200.000 - \$350.000 ARS          | \$5.500.000 - \$8.000.000 ARS   |
| Tercer año  | 50+                              | 25                            | \$500.000 - \$900.000 ARS          | \$11.000.000 - \$17.000.000 ARS |

_Escenario hipotético para análisis interno. No representa una garantía de ventas, ingresos, conversión, adopción ni crecimiento. Los resultados reales dependen de la ejecución comercial, la competencia, las condiciones macroeconómicas y la capacidad de retención de clientes, entre otros factores._

# 8\. Diferenciación frente a modelos habituales del mercado

Muchas plataformas de turnos funcionan bajo una marca centralizada, con suscripción recurrente para acceder a funciones básicas o con un nivel de personalización limitado. Existen modelos donde el negocio del profesional aparece dentro de un directorio compartido junto a otros prestadores del mismo rubro. La propuesta de Estudio Equis prioriza una instancia independiente, identidad propia, datos aislados y posibilidad de ampliación modular.

| **Aspecto**            | **Modelo de Estudio Equis**                     | **Modelos habituales del mercado**                                   |
| ---------------------- | ----------------------------------------------- | -------------------------------------------------------------------- |
| Identidad del negocio  | Aplicación con la marca propia del profesional  | Según el proveedor, puede aparecer dentro de una plataforma común    |
| Datos del cliente      | Instancia aislada por negocio                   | Puede variar; algunos modelos centralizan los datos en el proveedor  |
| Cobros                 | Directos al profesional vía Mercado Pago propio | Varía según el plan; algunos modelos retienen una comisión adicional |
| Cuota mensual          | No obligatoria para las funciones ya adquiridas | Frecuente en planes con acceso a funciones básicas                   |
| Personalización visual | Amplia dentro del alcance del sistema           | Puede ser limitada según el proveedor y el plan contratado           |
| Exportación de datos   | Posible en los términos acordados               | Varía entre proveedores                                              |

_Si el cliente ya utiliza o ha probado otra plataforma, conviene indagar qué limitaciones, problemas o necesidades lo llevan a buscar una alternativa, en lugar de asumir que el sistema actual presenta determinadas falencias._

**Preguntas orientativas para la conversación comercial:**

- ¿Qué parte del sistema actual no le resuelve el problema?
- ¿Qué tareas sigue haciendo manualmente?
- ¿Qué costos o comisiones le resultan incómodos?
- ¿Qué datos o métricas no puede consultar?
- ¿Qué nivel de personalización necesita?
- ¿Qué funciones considera indispensables?
- ¿Qué desea conservar de su sistema actual?
- ¿Qué espera mejorar?

_Las respuestas pueden usarse para recomendar el paquete adecuado, activar módulos existentes o cotizar una implementación personalizada. No debería asumirse que el producto estándar resolverá todos los problemas posibles de cada negocio._

# 9\. Riesgos y posibles mitigaciones

| **Riesgo**                                                | **Consideración**                                                           | **Posible mitigación**                                                                            |
| --------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| El cliente no contrata módulos adicionales                | Depende de la percepción de valor del núcleo                                | Priorizar un onboarding que muestre resultados de manera temprana                                 |
| Mercado Pago modifica su API con cierta frecuencia        | Históricamente ha sido un escenario recurrente en la industria              | El plan de mantenimiento puede cubrir estos ajustes                                               |
| El cliente solicita personalizaciones fuera del estándar  | Puede afectar tiempos y mantenibilidad de la plantilla                      | Definir por escrito qué es configuración y qué es desarrollo a medida                             |
| Vercel o Supabase modifican sus planes iniciales          | Depende de decisiones de cada proveedor, fuera del control de Estudio Equis | Con cuentas propias del cliente, el ajuste de plan recae sobre él; comunicar esto desde el inicio |
| La inflación erosiona el margen en pesos                  | Riesgo estructural de la economía argentina                                 | Cláusula de revisión periódica de precios o referencia en USD                                     |
| El proceso de implementación toma más tiempo del previsto | Especialmente en las primeras implementaciones                              | Documentar cada etapa para identificar oportunidades de mejora                                    |
| Terceros intervienen y alteran la instalación original    | Puede comprometer la integridad técnica del sistema                         | Cláusula explícita de suspensión de garantía ante intervención no autorizada                      |

# 10\. Posible hoja de ruta comercial

Lo siguiente es una secuencia de referencia, no un cronograma comprometido. Los plazos reales dependen de la disponibilidad, la demanda y los resultados obtenidos en cada etapa.

## Primeros meses: validación

- Buscar los primeros clientes con condiciones que faciliten el acceso, a cambio de feedback documentado sobre el uso real del sistema.
- Priorizar que el flujo de reserva y cobro de seña funcione de manera confiable antes de avanzar con otras funciones.
- Registrar cuánto tiempo lleva cada implementación para identificar qué partes podrían optimizarse.

## Etapa intermedia: ajuste de precio y primeras expansiones

- Revisar el precio de lanzamiento una vez validado el producto con clientes reales.
- Ofrecer módulos adicionales a los clientes iniciales que ya cuentan con datos y resultados visibles.
- Documentar casos de uso concretos, con la debida prudencia respecto de los resultados que pueden generalizarse.

## Etapa de mayor madurez: proceso y escala

- Buscar reducir progresivamente el tiempo de implementación del Pack Esencial a medida que el proceso se documenta y automatiza.
- Evaluar la incorporación de clientes con plan de mantenimiento activo para dar mayor previsibilidad al ingreso recurrente.
- Considerar publicidad dirigida a rubros específicos si los datos de adquisición lo justifican.

# 11\. Conclusiones

- El código fuente bajo control de Estudio Equis es el activo central: permite ofrecer el producto a distintos clientes sin desarrollarlo de nuevo cada vez.
- El modelo no requiere una suscripción obligatoria, pero sí se beneficia de un precio de implementación adecuado y de una ruta de expansión posterior.
- La expansión por módulos tiende a tener menor costo de adquisición que una venta nueva, porque el cliente ya conoce el sistema.
- Los costos de infraestructura recaen principalmente sobre el cliente, lo que reduce - sin eliminar - la exposición financiera de Estudio Equis frente al crecimiento.
- Mercado Pago opera con credenciales propias del cliente; Estudio Equis no intermedia en los cobros.
- Los escenarios de crecimiento presentados son hipotéticos y deben tratarse como guía de análisis, no como objetivos garantizados.

_Visión orientativa a mediano plazo: una base de clientes activos con un proceso de implementación cada vez más eficiente, una proporción relevante con algún servicio recurrente contratado, e ingresos por expansión que ganen peso frente a los de nuevas implementaciones. Se trata de un objetivo de dirección, no de una meta numérica comprometida._

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