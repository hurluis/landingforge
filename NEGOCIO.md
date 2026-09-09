# Modelo de negocio

Análisis de LandingForge con la metodología **Business Model Navigator**
(Gassmann, Frankenberger y Csik — Universidad de St. Gallen). El método sale de
analizar 250 modelos de negocio exitosos de 25 años y destilar **55 patrones
recurrentes**, con una tesis incómoda y bien sostenida: la mayoría de los
modelos «nuevos» son recombinaciones de patrones que ya existían en otra
industria.

Esto no es un plan de negocio ni una proyección. Es el inventario de qué
patrones están **ya implementados en el código**, cuáles no, y qué se gana o se
pierde con cada uno.

---

## 1. El marco

Cada patrón se clasifica según a cuál de cuatro dimensiones afecta —las cuatro
preguntas que definen cualquier modelo de negocio:

| | Pregunta | Qué define |
|---|---|---|
| **WHO** | ¿Quién es el cliente? | Segmento objetivo |
| **WHAT** | ¿Qué le ofrecemos? | Propuesta de valor |
| **HOW** | ¿Cómo lo producimos y entregamos? | Cadena de valor |
| **VALUE** | ¿Por qué es rentable? | Mecanismo de ingresos y costes |

Who–What–How forman el triángulo; **Value va en el centro**, porque es
consecuencia de los otros tres y no un cuarto vértice independiente.

**La regla operativa:** hay innovación en modelo de negocio cuando se modifican
**al menos dos** de las cuatro dimensiones. Cambiar una sola es mejora de
producto o de proceso.

> Dato del propio mazo, contado carta por carta: 54 de los 55 patrones tocan
> dos o más dimensiones. El único que toca una sola es `Digitization`, que
> afecta solo a *What* — porque digitalizar sin cambiar nada más es un cambio
> de soporte, no un modelo nuevo. Y **redefinir el WHO es lo más raro**: solo 8
> de 55 patrones lo tocan. Ahí está la palanca escasa.

---

## 2. Los patrones ya implementados

Cada fila apunta al código que lo sostiene. Si no hay código, no está en esta
tabla.

### `Subscription` · What + How

Tarifa mensual por acceso: tres planes con créditos, campañas guardadas,
paletas alternativas y marcas por nivel. Ingreso recurrente y previsible en vez
de transacción suelta.

→ [lib/planes.ts](lib/planes.ts) · `PLANES`

### `Freemium` · What + Value

Cinco créditos al registrarse, **sin tarjeta**. Suficiente para completar una
campaña real de cinco secciones antes de decidir nada. La versión gratuita no
es una demo recortada: es el producto entero con un tope de volumen.

→ `lib/planes.ts` · `CREDITOS_BIENVENIDA = 5`

### `Pay Per Use` · What + Value + How

El consumo se mide por sección generada: una sección, un crédito. El usuario no
paga por lo que no usa, y el coste del proveedor está atado al consumo real.
Es lo que hace que los planes tengan unit economics en lugar de ser una tarifa
plana a ciegas.

→ `wizard.tsx` · `const costo = estado.secciones.length`

### `Add-On` · What + Value

La oferta principal tiene un precio competitivo y hay un extra que empuja el
gasto final: paquetes de 25 créditos sueltos por encima del plan. El cliente
adapta el gasto a un pico de demanda sin cambiar de plan.

→ `lib/planes.ts` · `PAQUETE_EXTRA`

### `Digitization` · What

El servicio existía antes: contratar a un diseñador para el paquete visual de
una landing. El producto lo convierte en variante digital sin degradar la
propuesta —esa es la condición de la carta— pero **por sí solo no sería un
modelo nuevo**. Es la carta de una sola dimensión, y aquí solo cuenta porque va
combinada con las anteriores.

### `E-Commerce` · What + Value + How

Entrega íntegramente por canal en línea, sin infraestructura física ni equipo
de ventas. El ahorro de estructura es lo que permite el precio de `Semilla`.

### `Orchestrator` · Value + How

La empresa se queda con la competencia central —la metodología de ingeniería de
prompts, las nueve tipologías, la matriz de paletas, el validador de siete
reglas— y **subcontrata el modelo generativo**, que es intercambiable por
diseño.

Esta es la decisión estratégica más importante del producto y está escrita en
el README: *«El modelo se puede cambiar. La metodología es el activo.»* La capa
de IA está detrás de una interfaz con una implementación simulada completa, así
que el producto corre entero sin proveedor.

→ [lib/ia/index.ts](lib/ia/index.ts), [lib/ia/mock.ts](lib/ia/mock.ts), [lib/metodologia/](lib/metodologia/)

### `Aikido` · Who + What + Value

Ofrecer lo diametralmente opuesto a la mentalidad de la competencia. El mercado
de herramientas de prompts **esconde los prompts**: son el producto. Aquí la
metodología completa se publica en `/metodologia` —las nueve tipologías, la
fórmula de siete componentes, la matriz de paletas— y se vende la ejecución.

Es uno de los ocho patrones que tocan *Who*, y no por casualidad: atrae a quien
desconfía de las cajas negras, que es un cliente distinto del que compra un
pack de prompts.

→ [app/(marketing)/metodologia/page.tsx](app/(marketing)/metodologia/page.tsx)

### `Leverage Customer Data` · What + How

Uso interno, no venta a terceros: el panel de calidad mide qué reglas del
validador fallan más y sobre qué tipologías. Los datos de uso realimentan la
metodología, que es el activo.

→ [app/(admin)/admin/calidad/page.tsx](app/(admin)/admin/calidad/page.tsx)

---

## 3. Lectura del conjunto

| Dimensión | Patrones que la tocan | Cobertura |
|---|---|---|
| **What** | Subscription, Freemium, Pay Per Use, Add-On, Digitization, E-Commerce, Aikido, Leverage Customer Data | Muy alta |
| **Value** | Freemium, Pay Per Use, Add-On, E-Commerce, Orchestrator, Aikido | Muy alta |
| **How** | Subscription, Pay Per Use, E-Commerce, Orchestrator, Leverage Customer Data | Alta |
| **Who** | Aikido | **Baja** |

**Tres lecturas:**

1. **El modelo es sólido y coherente.** Nueve patrones combinados, con las
   cuatro dimensiones tocadas. Cumple de sobra la regla de las dos dimensiones.

2. **`Orchestrator` + `Aikido` son la pareja que sostiene la defensa
   competitiva.** El primero dice que el proveedor de IA es reemplazable; el
   segundo, que publicar el método no regala el negocio porque el activo es la
   ejecución. Sin el primero, el producto es rehén de una tarifa ajena. Sin el
   segundo, es un pack de prompts más.

3. **El WHO es la dimensión débil, y es la escasa.** Todo el modelo apunta a un
   único segmento: el vendedor individual de e-commerce colombiano. Las
   oportunidades sin explotar del §4 son casi todas de *Who*, y ahí es donde
   hay ruptura disponible en lugar de optimización.

---

## 4. Patrones no implementados, por orden de oportunidad

### `Two-Sided Market` · What + Value + How → y abre el *Who*

El plan `Agencia` ya existe pero se vende como «más créditos». Una agencia no
es un vendedor con más volumen: es **otro lado del mercado**. Una agencia que
gestiona doce marcas y un vendedor que gestiona una tienen necesidades
opuestas, y la plataforma que los conecta vale más a medida que crecen los dos
grupos.

Lo que ya está: `marcas: "ilimitadas"` en el plan Agencia. Lo que falta: que las
agencias puedan recibir clientes desde la plataforma.

### `Affiliation` · Value + How

Pago por venta a quien traiga clientes. El mercado colombiano de dropshipping
tiene una capa densa de formadores y comunidades que ya venden cursos a
exactamente este público. Es el canal de adquisición de menor fricción
disponible, y no requiere tocar el producto.

### `White Label` · What + How

Que una agencia entregue el paquete visual bajo su propia marca. Encaja con
`Two-Sided Market` y sube el valor del plan `Agencia` sin coste marginal: el
mismo producto satisface dos segmentos con marcas distintas.

### `Customer Loyalty` · What + Value

**Hoy no existe ningún mecanismo de retención.** El único coste de cambio es
tener las campañas guardadas —un `Lock-In` débil e involuntario. Un programa de
incentivos (créditos que se acumulan, ventajas por antigüedad) protege ingresos
futuros en un mercado donde el cliente típico prueba tres herramientas y se
queda con una.

### `Experience Selling` · Who + What + Value

**Es la carta que une este documento con [UX.md](UX.md).** Dice que el valor de
un producto aumenta con la experiencia que se ofrece, lo que habilita mayor
demanda y precios más altos. Es literalmente el puente entre el engagement como
concepto de UX y la captura de valor como mecanismo de negocio.

Parcialmente implementado: el mundo de la portada y el material de forja ya son
esa apuesta. Lo que falta es que la experiencia siga después de la compra —el
Estudio funciona bien, pero no *se siente* como el hero promete.

### Descartados, con motivo

| Patrón | Por qué no |
|---|---|
| `Razor and Blade` | Ya se cubre con Freemium + Pay Per Use, y aquí no hay consumible atado tecnológicamente |
| `Robin Hood` | Exige una base rica que subsidie; el segmento es homogéneo y de poder adquisitivo medio |
| `Ultimate Luxury` | Incompatible con el volumen que necesita un SaaS a este precio |
| `Open Source` | `Aikido` ya captura el beneficio reputacional de abrir el método sin regalar la ejecución |

---

## 5. La advertencia que ya estaba en el código

```
⚠️ Los precios son ILUSTRATIVOS y están sin validar. Antes de publicarlos hay
que correr la fórmula de §8.1 con la tarifa vigente de la API de imagen.
```

→ `lib/planes.ts`

Sigue vigente y ningún patrón la resuelve. `Pay Per Use` hace que el coste
escale con el uso, que es la mitad del problema; la otra mitad es que el precio
del crédito cubra la tarifa del proveedor con margen. **Publicar un precio sin
unit economics es la forma más rápida de vender a pérdida**, y eso no lo arregla
elegir mejor los patrones.

---

## 6. Cómo se usa este mazo

El documento de las 55 cartas entrega el catálogo pero no el procedimiento. Los
dos mecanismos del método original:

- **Principio de similitud** — buscar un patrón que funcionó en una industria
  *lejana* y trasladarlo. `Razor and Blade` nació en las cuchillas de afeitar y
  Nespresso lo llevó al café.
- **Principio de confrontación** — tomar una carta **al azar** y forzarse a
  imaginar cómo se aplicaría, aunque parezca absurdo. El absurdo es el objetivo:
  rompe la lógica dominante de la industria. Por eso son cartas físicas y no una
  lista.

---

## Referencias

- O. Gassmann, K. Frankenberger y M. Csik (2014) — *El navegador de modelos de
  negocio: 55 modelos que revolucionarán tu negocio*. Pearson.
- BMI.Lab — <https://businessmodelnavigator.com/explore>
- De la Varga Salto, Galindo Reyes, Nadales Rodríguez y Nadales Rodríguez —
  *Las 55 cartas del Business Model Navigator*. Universidad de Málaga,
  Proyecto de Innovación Educativa 19-226.
