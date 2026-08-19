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

### La pieza 3D del fondo: malla prestada, material propio

El cliente pidió una animación 3D gratuita, tomada de internet, que se moviera
con el scroll. La malla es **Cross Pein Hammer** de Poly Haven, **CC0 1.0**
(dominio público: uso comercial libre, sin atribución obligatoria; se acredita
igual en `scripts/preparar-pieza3d.mjs` porque no acreditar es de mal gusto,
no porque la licencia lo exija). Autor: Tics.

**Por qué un martillo de forja y no una escena de catálogo.** El objeto tenía
que significar algo o sobraba. LandingForge es una forja; el martillo de bola
cruzada es la herramienta con la que se trabaja el metal caliente. Un casco de
videojuego o un donut girando habrían sido igual de gratis y no habrían dicho
nada.

**Qué se descartó del paquete original.** Venían 1,5 MB: 58 KB de malla y
1,45 MB de texturas JPG. Las texturas se tiraron enteras, y no por peso —eso
fue la consecuencia agradable— sino por paleta: el mango es madera marrón, y
en un sistema donde el color significa estado del trabajo, un marrón fotográfico
no significa nada. La pieza se pinta con un acero de la paleta y su temperatura
la escribe el scroll: fría arriba, incandescente en el método, templada al
cerrar. Es la misma curva del campo de luz.

**Por qué three.js a pelo y no react-three-fiber.** El componente hace una
sola cosa: cargar una malla, mover dos grupos y pintar. R3F habría añadido un
reconciliador y un árbol de React para un objeto que no tiene estado y que a
propósito no toca React ni una vez por frame. Se paga peso y superficie de
fallo a cambio de nada.

**Lo que costó una segunda mirada.** La primera versión salía a escala real,
con emisivo alto y el mapa de entorno saturado: un martillo azul y cobre del
tamaño de la pantalla, cruzando por delante del titular. Eso no es un fondo,
es un competidor. La corrección fue toda en la misma dirección —30 % del alto
del viewport, opacidad 0,5, emisivo un tercio, entorno a la mitad— y en
vertical se retira más todavía (72 % del tamaño y opacidad 0,3), porque en un
teléfono el texto ocupa el ancho entero y la pieza no tiene por dónde pasar
sin cruzarlo. El teléfono es donde se lee y donde se compra.

**Lo que no hace.** No se monta con movimiento reducido, ni sin WebGL, ni si
el `.gltf` no carga; en los tres casos queda el campo de luz, que ya era un
fondo completo. `three` entra por `import()` en tiempo ocioso, así que no pesa
en el bundle inicial ni compite con el LCP, y el bucle se apaga solo con la
pestaña oculta y ~1,5 s después de que el scroll se detenga.

---

## Los dos materiales, y por qué el fondo dejó de ser negro

El cliente pidió que la página no fuera toda negra y que el fondo se moviera
con el scroll y con el mouse. Eso choca de frente con tres prohibiciones del
brief: el gradiente de malla tipo Stripe, los blobs abstractos sin relación
con el producto, y la inversión de tema a mitad de página. El cliente manda
sobre el documento, pero la salida no fue montar un aurora genérico, que es
justo el AI-tell contra el que el propio brief avisa. Se derivó del sujeto.

**El campo de luz.** El fondo es un aparejo de iluminación de estudio, con el
mismo esquema que la metodología prescribe en cada prompt: luz clave cálida,
relleno suave, luz de contorno fría y grano. El puntero mueve la clave, porque
mover una luz por un estudio es un gesto real del oficio, y va con un resorte
sobreamortiguado para que la luz tenga masa en vez de pegarse al cursor. El
scroll sube la temperatura: arriba la página está fría, del color del material
sin trabajar, y se calienta hacia el método y el estudio en vivo. Es una capa
fija con MotionValues, así que no provoca un render de React.

**Los dos materiales.** La página alterna entre el estudio, oscuro, donde se
miran las imágenes sin que el entorno contamine el juicio de color; y el
papel, claro, donde el trabajo se imprime y se entrega. No es un modo claro
pegado encima: es la diferencia entre mirar y llevarse. Van en papel el
problema, la metodología (los sellos templados sobre caliza leen como un
certificado, que es lo que son) y los precios (un contrato se imprime).

Está resuelto redefiniendo los mismos tokens semánticos dentro de `.papel`.
Como `@theme inline` hace que las utilidades resuelvan a `var(--token)` en el
sitio de uso, poner esa clase en una sección invierte el subárbol entero sin
tocar un solo componente. Los dos materiales se auditan por separado.

El papel es caliza fría, no crema: crema con serif de alto contraste y
terracota es la paleta número uno de la que el brief manda huir, y esto no es
eso.

**La tipografía.** Bodoni Moda. El brief prohibía serif con razón, pero
prohibía en concreto Fraunces e Instrument Serif, que son las dos que salen
por defecto. Bodoni no está en ese grupo, y hace algo que ninguna grotesca
hace: su contraste altísimo cambia de carácter con el material. Sobre papel
los remates finos casi desaparecen y el texto se lee impreso; sobre el estudio
oscuro los mismos remates brillan. El peso nunca baja de 500, porque en
negativo un didone ligero pierde las astas.

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

### El audit de contraste estaba mal, y por eso daba luz verde

`luminancia()` linealizaba los canales rojo y verde pero multiplicaba el azul
en bruto, sin pasarlo por la curva sRGB. Todos los ratios que este proyecto
reportó antes de esa corrección eran inválidos. Al arreglarlo aparecieron
cinco pares por debajo del piso que llevaban tiempo pasando por buenos, y hubo
que ajustar `--slag` en los dos materiales y `--ok` en el papel.

Ahora el script se comprueba a sí mismo antes de medir nada: tres pares de
ratio conocido, negro sobre blanco a 21:1 entre ellos, y si el medidor falla
la calibración el proceso se cae. Un audit que no se verifica puede firmar una
paleta ilegible, que es exactamente lo que pasó.

### El fotograma del hero estaba vacío en la primera pantalla

El `clip-path` de la máscara arrancaba en `inset(100% 0 0 0)`, así que a
reposo la imagen estaba recortada entera y el fotograma se leía como una caja
negra. Justo lo contrario de lo que tiene que decir la primera pantalla.

Van dos capas: la de abajo es el material en bruto, muy desenfocado, con grano
y sin máscara nunca; la de arriba es la pieza formada, y es esa la que la
máscara descubre de abajo hacia arriba. Además hubo que levantar la exposición
del material en bruto, porque el bodegón es una foto de estudio oscura y
desenfocarla 26px la promedia a negro.

### La ruta de la base de datos hacía que el build trazara todo el proyecto

Construirla con `resolve(process.cwd(), process.env.DATABASE_URL)` impide al
empaquetador acotar el análisis estático y termina metiendo todo el proyecto,
incluida `public/`, en el bundle del servidor. La ruta se acotó a `datos/`.

### Renombrar no abre un modal

El brief prohíbe el modal para tareas que no necesitan interrupción ni foco
protegido, y renombrar una campaña es ese caso exacto. El título se edita en su
sitio. El único modal del producto sigue siendo el de borrado.
