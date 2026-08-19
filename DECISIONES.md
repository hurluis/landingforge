# Decisiones

Este documento recoge las decisiones que el brief deja abiertas, las
desviaciones respecto de él con su razón, y los hallazgos de la construcción.
Si alguna no convence, esta es la lista que hay que discutir: no hay decisiones
sueltas escondidas dentro del código.

---

## Lo que corrigió la v2

La primera versión falló y vale la pena escribir por qué, porque la causa fue
una sola y era de método.

**Se construyó sin ver ni un píxel del resultado.** El panel de navegador de la
sesión no renderizaba, y en vez de resolver eso primero se siguió adelante a
ciegas. El resultado tenía una pantalla entera en negro donde debía ir la tira
de nueve fotogramas, un H1 que se desbordaba a cinco líneas y un botón de la
barra sin etiqueta visible. Nada de eso sobrevive a una mirada.

La corrección de fondo no fue de diseño sino de herramienta:
`scripts/mirar.mjs` levanta Chromium, recorre la página en pasos pequeños (los
reveals de `once: true` solo disparan si el elemento pasa de verdad por el
viewport) y captura fotogramas a lo largo del recorrido, además de comprobar
desbordes, número de H1 y em-dashes. Con coreografía de scroll, una captura del
tope no dice nada.

Lo segundo que corrigió la v2 fue de criterio: se había aplicado vara de UI de
producto a una superficie de persuasión. Fraunces como display y una rampa
champán, oro y cobre como acento son, los dos, los AI-tells que `taste-skill`
marca como prohibidos por defecto. Era el default vestido de decisión.

---

## Decisiones abiertas, cerradas

### Persistencia: SQLite, no Supabase

`node:sqlite`, el módulo integrado de Node 22+, detrás de la interfaz
`lib/datos/repositorio.ts`.

**Por qué.** No añade un servicio externo del que dependa la sustentación, no
arrastra dependencias nativas que compilar en Windows, y el esquema completo
cabe en un archivo, así que se puede leer y defender de principio a fin.
Supabase habría ahorrado la autenticación, pero ese trabajo es justamente lo
que se evalúa como ingeniería de software.

**El costo, dicho sin adornos.** `node:sqlite` es experimental y avisa en cada
arranque. Un archivo SQLite no sirve para varias instancias. Por eso la
persistencia está detrás de una interfaz: migrar a Postgres es escribir otra
clase, no tocar pantallas.

### Modelo de imagen: Gemini

Sin cambios. Toda la metodología está calibrada para ese modelo: el límite de
25 caracteres, la lista negra y la prosa narrativa son reglas suyas. Cambiar de
generador invalidaría buena parte del activo. Es una decisión de arquitectura,
no de proveedor.

### Precios: los del brief, marcados como ilustrativos

Los números de `lib/planes.ts` están **sin validar**, y la página de precios y
la política de créditos lo declaran. Antes de publicarlos hay que correr la
fórmula de unit economics con la tarifa vigente de la API de imagen.

### Dominio y rúbrica

Fuera de lo que se puede resolver desde el código: verificar `landingforge.com`
y `.co`, y contrastar el alcance contra la rúbrica real de la entrega.

---

## Desviaciones respecto del brief

### Next.js 16 en vez de 15

Next 15 se instaló primero y `npm audit` devolvió **tres vulnerabilidades de
severidad alta** en dependencias transitivas (postcss y sharp), sin arreglo
posible sin subir de versión mayor. Con Next 16: **cero**. La seguridad es
sección evaluable, así que entregar con tres avisos altos pesa más que una
versión mayor de diferencia. El código de App Router es idéntico; el único
cambio de forma fue renombrar `middleware.ts` a `proxy.ts`, la convención nueva.

### El nav no usa `mix-blend-mode: difference`

El brief lo menciona para el nav, tomado de Vercel Ship. Ese mecanismo resuelve
el problema de una barra que cruza secciones claras y oscuras. Esta página
tiene un solo tema oscuro de principio a fin, que es justamente lo que exige el
pre-flight, así que el problema no existe aquí y el blend sería un mecanismo
copiado sin su causa. Queda fuera a propósito, y está escrito en el propio
componente.

### El relleno naranja del CTA solo existe en tamaño grande

El brief fija `--heat: #FF5C2B` y dice que el texto encima es `--void`, nunca
blanco. También exige que todo CTA pase 4.5:1 contra su fondo. Con esos hex las
dos reglas no pueden cumplirse a la vez: `--void` sobre `--heat` da **3.47:1**.

La salida no fue cambiar el color de marca ni saltarse la regla, sino acotar
dónde aparece el relleno: el CTA lleno existe solo en tamaño `lg`, donde la
etiqueta es 19px semibold y por tanto texto grande, cuyo piso es 3:1. En `sm` y
`md` el mismo botón pasa automáticamente a contorno con borde `--heat`, que
conserva el significado y sube muy por encima del piso. Lo hace el componente,
no cada sitio de llamada, así que no se puede olvidar.

### Los fotogramas dibujan la estructura, no fotografías generadas

El brief pide imágenes reales generadas con la propia metodología. F4 está
fuera de alcance, así que esas imágenes todavía no existen. Se resolvió así:

- **La Forja** corre sobre un bodegón de producto real, generado píxel a píxel
  por `scripts/generar-pieza.mjs` con el mismo esquema de luz que prescribe la
  metodología: clave cálida arriba a la derecha, contorno frío a la izquierda,
  sombra de contacto con desplazamiento y desenfoque. Es un asset raster de
  verdad, determinista y versionable, sin licencias de banco de imágenes.
- **El grano** sale de `public/textura/grano.png`, un mosaico de ruido real de
  dos octavas. El brief prohíbe `feTurbulence` y ese era justo el atajo.
- **Los nueve fotogramas** dibujan la estructura de cada tipología con su
  paleta asignada. Es la misma pieza que usa el paso 4 del wizard, y es
  preferible a un mockup con foto de banco que fingiría una funcionalidad no
  conectada.

---

## Hallazgos durante la construcción

### El revelado por máscara no disparaba nunca

`RevealLineas` ponía el `whileInView` sobre el span interno, que arranca
desplazado un 105% y por tanto está recortado por su propia máscara. El
IntersectionObserver no lo veía nunca, así que la animación no se disparaba
jamás y **seis titulares de sección quedaban invisibles de forma permanente**.
Se veía como secciones que empezaban con un hueco enorme.

El disparador tiene que ir en el titular, que sí es visible, y las líneas se
orquestan desde él con variantes. Está escrito en el componente para que no se
repita.

### La aritmética del pan horizontal

El carril usaba `w-[900%]` con fotogramas de `calc(100%/9)`, y ese `100%` es el
del carril, no el del viewport: cada fotograma salía del tamaño de la pantalla
entera. El recorrido ahora se **mide** (`scrollWidth - innerWidth`) y se
recalcula al redimensionar. Un porcentaje adivinado deja fotogramas fuera o de
más según el gap y el padding.

### `--warn` no llega al piso como texto

3.55:1 sobre el canvas. Se usaba como color de texto en tres sitios. Ahora va
solo en icono y borde, donde el piso es 3:1, y el texto va en tinta. El token
no se tocó: el brief lo fija.

### La ruta de la base de datos hacía que el build trazara todo el proyecto

Construirla con `resolve(process.cwd(), process.env.DATABASE_URL)` impide al
empaquetador acotar el análisis estático y termina metiendo todo el proyecto,
incluida `public/`, en el bundle del servidor. La ruta se acotó a `datos/`.

### Renombrar no abre un modal

El brief prohíbe el modal para tareas que no necesitan interrupción ni foco
protegido, y renombrar una campaña es ese caso exacto. El título se edita en su
sitio. El único modal del producto sigue siendo el de borrado.
