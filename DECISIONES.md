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

### La constelación del fondo: sin assets, sin malla y con seis significados

El cliente pidió una animación 3D que se moviera con el scroll, y luego pidió que se
pareciera a la de una referencia: una nube de miles de triángulos diminutos que se
transforma a medida que se baja. La primera versión de este proyecto resolvía la primera
petición con un martillo de forja —malla CC0 de Poly Haven, 58 KB— que cruzaba la página.
Cumplía, pero tenía un techo: **un objeto solo puede decir una cosa**. El martillo entraba,
cruzaba y salía diciendo «esto es una forja» durante diecisiete pantallas.

La constelación no es un objeto, es materia. Las mismas partículas se reorganizan en una
figura distinta sobre cada sección, así que el fondo dice cinco cosas seguidas sin cambiar
de identidad:

| figura | dónde | qué significa |
|---|---|---|
| chispa | el hero | el golpe. Envuelve el fotograma que se está formando |
| toroide | la tira | un anillo: las nueve secciones que se recorren y vuelven |
| globo | final de la tira | el mercado, el país. Llega antes que la sección de Colombia |
| hélice | pasos y estudio | tres hebras que suben: los tres pasos |
| lámina | el cierre | el plano 9:16 que el producto entrega, ya templado |

Existe una sexta, la `rejilla` —una retícula exacta, sin una sola partícula fuera de sitio,
que significa el mundo de las plantillas—, y la home **no la usa**: su sección es de papel
y la taparía entera. Una figura invisible no significa nada. La usan las páginas cortas,
donde no hay secciones que anclar y el reparto es automático.

**Por qué la referencia no se copió con sus colores.** La referencia es negro puro con
violeta eléctrico y ámbar. Aquí el color significa estado del trabajo —naranja en proceso,
templado terminado, azul información— y meter un violeta de marca ajena habría roto la
única regla dura de la paleta. Lo que se tomó es la técnica y el gesto: triángulos
contorneados de 1 px, mezcla aditiva, reparto de tamaños con casi todas diminutas y unas
pocas grandes, y partículas de ambiente sueltas por toda la pantalla. Pintadas con acero,
ember, heat, forged, quench y unas pocas al blanco.

**Cómo se colocan las figuras.** No con fracciones escritas a ojo, que se desincronizan a
la primera vez que alguien añade un párrafo, sino midiendo el DOM: se busca cada sección
por el `aria-labelledby` que ya tiene puesto y se calcula su posición real. La regla que lo
ordena todo es que **las figuras se posan sobre las secciones oscuras y los cambios ocurren
sobre las de papel**. El papel es opaco y tapa el fondo entero; usarlo de telón hace que la
nube desaparezca siendo una cosa y reaparezca siendo otra, que es mejor que verla
derretirse. Cada figura se queda quieta todo su tramo y solo se deshace en la última
pantalla antes de que llegue la siguiente sección: medir la transición en pantallas y no en
fracción del tramo es lo que evita que la nube esté permanentemente a medio camino, que es
cuando se ve el truco.

**Cuánta presencia.** Cada figura declara su peso. El hero y el cierre son dos titulares y
aire, y la nube puede ocuparlos entera; la tira de las nueve secciones tiene nueve tarjetas,
sus etiquetas y una barra de progreso, y ahí el fondo se retira al 40 %. No es gusto, es
medición: con la nube a plena presencia, la etiqueta «06 Autoridad» de 13 px caía de
5,18:1 a 3,83:1, por debajo del piso de 4,5:1 del propio proyecto. Al 40 % queda en 4,63:1.
La auditoría se hizo sobre píxeles renderizados, no sobre tokens, comparando la página con
la constelación encendida y apagada en 18 posiciones de scroll.

**El piso de rendimiento.** `three` entra por `import()` en tiempo ocioso y solo si la sonda
de WebGL dice que sí, así que en una máquina sin WebGL no se descarga ni la librería.
Cero assets: no hay `.gltf`, ni `.bin`, ni texturas, ni una sola petición de red; la nube se
calcula al vuelo con un generador determinista, así que es la misma en cada carga. Una sola
llamada de dibujo: seis vértices de plantilla y el resto son atributos por instancia, y el
morfeo, el giro y el calor ocurren en el vertex shader. El bucle no toca React ni una vez
por fotograma, en reposo baja a 30 fps y con la pestaña oculta se apaga.

Encima hay un guardarraíl: se mide la mediana de fotograma con el scroll en marcha y, si
pasa de 26 ms, la constelación se recorta ella sola al 45 % de las instancias y a un píxel
por píxel. Por eso las partículas de ambiente van repartidas entre las de la figura y no
apiladas al final: recortar la cola habría borrado la atmósfera entera y dejado la nube
intacta. Medido con rasterización por software —el peor caso imaginable, sin GPU—, el
recorte baja el coste de 58 ms a 46 ms por fotograma; con GPU real, once mil segmentos de
línea no son nada.

**Lo que no hace.** Sin WebGL no se monta, y queda el campo de luz, que ya era un fondo
completo por sí solo. Con movimiento reducido sí se monta, pero no anima: dibuja UN
fotograma y suelta el bucle. Movimiento reducido significa menos movimiento, no una página
desnuda.

**Lo que se fue con el martillo.** La malla y su script de preparación siguen en el
repositorio (`scripts/preparar-pieza3d.mjs`, `public/pieza3d/`) porque `npm run assets`
los sigue generando y porque tirar un asset versionado por una decisión de diseño reversible
es de mal perder. No los carga nadie.

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

---

## El panel de administración

### El repositorio de administración es una interfaz aparte

`Repositorio` tiene una propiedad que se puede afirmar sin leer el código:
todos sus métodos reciben un `usuarioId` y filtran por él en el propio `WHERE`.
Eso es lo que impide que alguien lea la campaña de otro adivinando un id.

Las consultas del panel son globales por naturaleza. Añadirlas a esa misma
interfaz habría destruido la propiedad: a partir de ahí, saber si un método
aísla o no exigiría leerlo. Por eso viven en `RepositorioAdmin`, en otro
archivo. La promesa de aislamiento del primero sigue siendo cierta, y el hecho
de importar el segundo es en sí mismo la señal de que ese código exige rol.

### El rol no viaja en el token

Era la opción cómoda: el token ya se verifica en el Edge, y meter el rol dentro
habría permitido bloquear `/admin` en `proxy.ts` sin tocar la base de datos.

Se descartó porque un token es una foto del pasado. Con siete días de vigencia,
quitarle el rol a alguien no habría tenido ningún efecto hasta que cerrara
sesión, y una cuenta comprometida habría conservado el panel una semana. El
rol se lee de la base de datos en cada petición. Cuesta una consulta por
petición y compra que la degradación sea inmediata.

### Sin rol se responde 404, no 403

Un 403 es informativo: confirma que la ruta existe. Para una ruta pública eso
da igual, pero `/admin` es justo lo que buscaría alguien tanteando URLs, y
confirmárselo es regalarle la mitad del trabajo.

Es la misma decisión que ya estaba tomada en el login, donde el mensaje no
distingue un correo inexistente de una contraseña errada. Aplica a las páginas
y también a `/api/admin`.

### El guardia está en tres capas, y la primera es la más débil

`proxy.ts` corre en el runtime Edge y no puede abrir SQLite, así que de
`/admin/*` solo sabe que hay una cookie firmada, no de quién. El rol se
comprueba en `app/(admin)/layout.tsx`, contra la base de datos, y otra vez en
cada route handler a través de `conAdmin`.

Esa tercera capa no es redundante: un route handler no pasa por el layout. Si
confiara en él, `/api/admin` quedaría abierto a cualquiera con sesión.

### El administrador no puede degradarse ni borrarse a sí mismo

Sin esa regla, un solo clic mal dado deja la plataforma sin ningún
administrador y sin forma de recuperar el acceso salvo tocando la base de datos
a mano. Las dos comprobaciones viven en el servidor. La interfaz además no
ofrece los botones, pero eso es cortesía, no seguridad.

### El ajuste de créditos aparece en el historial del usuario

Se escribe como un movimiento con motivo propio, `ajuste-admin`, en la misma
transacción que el cambio de saldo. El usuario ve en su cuenta que el equipo le
tocó los créditos y por qué.

La alternativa —anotarlo solo en la auditoría interna— habría sido más cómoda y
peor: el saldo de alguien cambiando sin explicación en su propia pantalla es la
clase de cosa que destruye la confianza en un producto que cobra por crédito.

### La auditoría se escribe antes de los borrados

En las dos acciones destructivas, la línea de auditoría se inserta antes de
borrar. Si se escribiera después y el borrado fallara a medias, quedaría
registrado un hecho que no ocurrió. Al revés, lo peor que queda es una
intención sin efecto, que es la mitad honesta del error.

La tabla no tiene un solo `UPDATE` ni `DELETE` en todo el proyecto. Un registro
que se puede corregir no sirve para lo único para lo que existe un registro.

### El panel no puede editar campañas

Hay ruta para borrar una campaña por abuso, y no hay ninguna para modificarla.
Es una decisión de producto, no una omisión: el administrador diagnostica, y
reescribir el trabajo de un cliente por encima de él no es parte del trabajo.
Que la capacidad no exista en el servidor es más fuerte que ocultar un botón.

### La intensidad del mapa de calor es una tasa, no un conteo

La primera versión escalaba cada celda contra el máximo de la tabla. Con los
datos de la primera semana ese máximo vale 1, así que cualquier celda con un
solo caso se pintaba al rojo vivo y la tabla entera parecía una alarma.

Y aun con datos, comparar filas por conteo bruto es incorrecto: una tipología
con 100 prompts y 50 incumplimientos está mejor que una con 2 y 2. La
intensidad se calcula sobre los prompts de la propia fila; la cifra impresa
sigue siendo el conteo.

### El color del panel no introduce ningún tono nuevo

`--heat` sigue siendo el único color de acción del producto. Lo que dice
«estás en administración» es `--quench`, el azul de temple, que en este sistema
ya significa información. Encaja porque el panel es un instrumento de lectura y
no de producción, y evita tener que defender un color de marca nuevo que solo
existiría para una sección.

Los planes en el reparto del tablero se codifican con la rampa `--forged` de un
solo tono en vez de con tres colores distintos, porque los planes están
ordenados: semilla, estudio y agencia son una escala, no tres categorías
sueltas, y una escala se dibuja con luminosidad.

---

## El mundo de la apertura

### Geometría en tiempo real, no vídeo generado

La técnica de referencia —Apple, Emons— pre-renderiza un vuelo de cámara y el
scroll solo desplaza el tiempo del vídeo. Es la forma más directa, y aquí se
descartó por cuatro razones concretas, ninguna de presupuesto:

1. **Peso.** Seis escenas con sus conectores son decenas de megas que hay que
   descargar antes de que el visitante vea nada. El mundo en geometría son
   kilobytes de código y cero peticiones de red.
2. **Proporción.** Un vídeo 16:9 en un móvil vertical enseña su centro y
   pierde la escena. La cámara real se reencuadra: retrocede y sube el sujeto
   cuando el cuadro se estrecha.
3. **Resolución.** El vídeo se pixela al subir de pantalla; la geometría no.
4. **Dependencia.** Un vídeo generado ata el activo visual de la portada a que
   un servicio externo siga existiendo y siga costando lo mismo.

A eso se suma lo obvio: un vuelo fotorrealista pegado a una interfaz que es
deliberadamente material y geométrica se leería como dos productos distintos.

### La cámara reposa y viaja, no recorre

Un recorrido a velocidad constante obliga a leer con la imagen moviéndose y
convierte la página en un carrusel. Aquí cada escena tiene un tramo de scroll
en el que la cámara PERMANECE —avanzando como mucho un 22% hacia el sujeto—, y
solo en el último 44% VIAJA a la siguiente por una bézier cuadrática con el
punto de control elevado.

La velocidad es cero al llegar y al salir de cada escena, así que no hay tirón
en ninguna costura. Y como la posición es una función pura del progreso de
scroll, subir la rueda reproduce el vuelo hacia atrás sin una línea de código
extra: no hay estado que se pueda desincronizar.

### En reposo se dibuja UNA escena, no tres

La primera versión mantenía visibles la escena actual y sus dos vecinas. El
resultado fue que las chispas de la forja se colaban por el borde derecho de la
escena del caos —justo la que tiene que leerse fría, y la única del recorrido
donde el naranja no puede aparecer— y que la línea de ensamblaje invadía la
forja.

Ahora en reposo se dibuja solo la escena actual, y las vecinas aparecen
únicamente durante el viaje, que es cuando ver el mundo conectado es el efecto
buscado. De paso, es menos que dibujar.

### El encuadre se desplaza, no la cámara

El texto ocupa la mitad izquierda en escritorio, así que el diorama tiene que
caer en la derecha. Se consigue apuntando la mirada a la izquierda del sujeto,
no moviendo la cámara: mover la cámara cambiaría el punto de vista del diorama
y no solo su sitio en pantalla.

En vertical el reparto es otro —copia abajo, escena arriba—, así que el
desplazamiento pasa a ser vertical y la cámara además retrocede. El retroceso
se hace con distancia y no subiendo el FOV porque un FOV de 110° deforma la
perspectiva y rompe el aire de maqueta.

### `metalness` alto sin environment map renderiza negro

Los sellos de la bóveda y la puerta acorazada salían marrones y apagados. La
causa no era la luz: un material metálico refleja su entorno, y este mundo no
tiene environment map porque no tiene un solo asset. Por encima de `metalness`
0.3 el reflejo que el material busca no existe y la malla se va a negro.

El canal metálico quedó acotado a 0.3 en la fábrica de materiales, con el
motivo escrito al lado, y el aspecto de metal lo dan ahora la emisión y la
rampa `--forged`, que es de donde tenía que haber salido desde el principio.

### La gráfica de la última escena crece con el scroll, no con el reloj

Es el visitante quien la hace subir al avanzar, que es la idea. Pero el
escalonado inicial tardaba tanto que, en el punto donde la copia está a plena
opacidad, las barras del final aún no habían crecido y la gráfica se leía
DESCENDENTE: exactamente lo contrario de lo que dice la escena.

El escalonado se cerró al 25% del tramo. Una gráfica de ventas que baja en la
sección que promete que suben es un error de producto, no de animación.

### Qué pasó con La Forja

El hero de 400vh se retiró de la portada, no del repositorio. Su narrativa
—material en bruto, calor, pieza terminada— es ahora la escena 02 del mundo, y
su titular se conserva palabra por palabra como el h1 de la página: cambia el
escenario, no la promesa. Dejar los dos habría encadenado 400vh y 1060vh de
scroll cinemático antes del primer bloque de texto.
