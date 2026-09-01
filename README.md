# LandingForge

Plataforma web que convierte la foto de un producto en el paquete visual completo de una
landing page de e-commerce: paleta de marca asignada por matriz, copy de conversión y los
prompts validados de hasta nueve secciones de arte.

El motor no es «una IA que hace imágenes bonitas». El motor es una **metodología de
ingeniería de prompts** , estructurada, versionada y probada en el mercado colombiano, que
se ejecuta sobre un modelo generativo intercambiable. El modelo se puede cambiar. La
metodología es el activo.

---

## Arranque rápido

```bash
npm install
cp .env.example .env.local     # y genera un AUTH_SECRET
npm run dev
```

Genera el `AUTH_SECRET` con:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Abre <http://localhost:3000>. **No hace falta clave de Gemini**: sin `GEMINI_API_KEY` la
aplicación corre entera contra `lib/ia/mock.ts`, que ejecuta la misma metodología sin
modelo generativo. Con clave, la redacción la hace Gemini sobre el mismo esqueleto.

Rutas útiles:

| Ruta | Qué es |
|---|---|
| `/` | La página de venta |
| `/metodologia` | Las nueve tipologías, la fórmula y la matriz de paletas, publicadas |
| `/precios` | Planes y la letra pequeña, en grande |
| `/kit` | Página interna del sistema de diseño: todas las primitivas en todos sus estados |
| `/app` | Biblioteca de campañas (requiere sesión) |
| `/app/nueva` | El Estudio, wizard de cuatro pasos |

---

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run verificar` | Tipos + lint + contraste + build. La puerta antes de entregar |
| `npm run e2e` | 66 comprobaciones de extremo a extremo contra el servidor corriendo |
| `npm run verificar:clave` | Compila con una clave centinela y comprueba que no aparece en el bundle del cliente |
| `npm run verificar:contraste` | Audita los pares de color reales contra el piso de WCAG |
| `npm run assets` | Regenera las texturas y el bodegón de producto |
| `npm run mirar` | Levanta Chromium, recorre la home y guarda fotogramas en `.capturas/` |

`npm run e2e` necesita el servidor levantado en otra terminal.

---

## Funcionalidades

| ID | Funcionalidad | Estado |
|---|---|---|
| **F1** | Estudio de prompts: wizard de 4 pasos, generación en streaming, validador de 7 reglas | Funcional completa |
| **F2** | Cuenta, biblioteca con CRUD, créditos transaccionales | Funcional completa |
| **F3** | Asistente acotado al dominio, en streaming, con guardarraíles | Funcional completa |
| F4 | Generación de imágenes | Fuera de alcance: interfaz construida, tras bandera de entorno |
| F5 | Exportación de landing HTML | Backlog |
| F6 | Pasarela de pago | Simulada, y la pantalla lo declara |

La decisión de que F1 genere **texto y no imágenes** es deliberada: la ingeniería de prompt
es la parte valiosa del producto y cuesta una fracción de un token de imagen. Se demuestra
completa y funcionando. F4 queda con su interfaz construida pero deshabilitada, y el botón
dice honestamente por qué.

---

## Arquitectura

```
app/
  (marketing)/          home, metodología, precios, legal · nav + pie + asistente
  (app)/                biblioteca, estudio, campaña, cuenta · sidebar + guard de sesión
  entrar/               login y registro
  kit/                  sistema de diseño, página interna
  api/                  prompts (streaming), chat (streaming), campanas, auth, cuenta
proxy.ts                guardia de /app/*: solo verifica la firma del token
components/
  ui/                   primitivas: botón, campo, select, diálogo, acordeón, fotograma
  motion/               LaForja, TiraPinned, StickyStack, Marquesina, Reveal, Parallax,
                        Spotlight, Magnetico, ContadorScroll, Trazo, Movimiento,
                        CampoDeLuz, Constelacion (fondo 3D) y sus formas
  marketing/            Nav, Pie, EstudioVivo, TablaPrecios, Preguntas, Lamina
  estudio/              los cuatro pasos del wizard
  campana/              visor de prompt y validador
  asistente/            F3
lib/
  metodologia/          EL ACTIVO: tipologías, matriz de paletas, reglas, constructor
  ia/                   contrato + implementación real + implementación falsa
  datos/                tipos, interfaz de repositorio, SQLite
  auth/                 sesión, contraseñas, token
scripts/                generación de assets y las verificaciones
```

### Las tres capas que hacen que esto sea sustituible

1. **`lib/metodologia/`** no depende de nada: ni de React, ni de la base de datos, ni del
   modelo. Es la metodología ejecutable, y se puede probar sola.
2. **`lib/ia/cliente.ts`** es un contrato de dos métodos. `mock.ts` y `gemini.ts` lo
   cumplen; `lib/ia/index.ts` elige cuál se inyecta según haya clave o no. Conectar el
   modelo real no toca un solo componente.
3. **`lib/datos/repositorio.ts`** es la interfaz de persistencia. Ninguna pantalla ve SQL.
   Cambiar SQLite por Postgres es escribir otra clase.

### Seguridad

- `GEMINI_API_KEY` vive **solo** en el servidor, sin prefijo `NEXT_PUBLIC_`.
  `lib/ia/gemini.ts` importa `server-only`: si un componente cliente lo importara, el build
  falla. Y `npm run verificar:clave` lo comprueba compilando con una clave centinela y
  buscándola en `.next/static`.
- Contraseñas con **scrypt** y sal por usuario; comparación de tiempo constante.
- Sesión en cookie `httpOnly`, `secure` en producción, `sameSite=lax`, firmada con HS256.
- **Rate limiting** en `/api/chat`, `/api/prompts`, `/api/auth` y la prueba pública.
- **zod** en el borde del servidor, incluso en campos que el formulario ya validó.
- Los créditos se descuentan con la condición dentro del propio `UPDATE`
  (`WHERE creditos >= ?`), así que dos peticiones simultáneas no pueden pasar las dos.
- Al fallar el login, el mensaje es el mismo para correo inexistente y contraseña errada.

---

## El sistema de diseño

Todo sale de `app/globals.css`. La paleta, la escala tipográfica y los tokens de movimiento
son variables CSS; Tailwind las consume. No hay una segunda copia del sistema.

**El color significa estado del trabajo, y eso es todo lo que significa:**

| | Qué dice | Dónde aparece |
|---|---|---|
| `--heat` naranja incandescente | en proceso | CTA, barra de progreso, estado generando |
| rampa `--forged-*` templada | terminado | sellos, borde del fotograma cuando la pieza queda lista |
| `--quench` azul de temple | información y foco | anillos de foco, enlaces |

Nada más lleva color. El usuario lee el estado por el material, no por una etiqueta. La
base es grafito frío con sesgo azul a propósito: el contraste de temperatura hace que el
naranja pegue el doble, que es el mismo principio que la metodología le enseña a sus
usuarios cuando habla de luz clave cálida contra contorno frío.

**Por qué oscuro:** la interfaz es un entorno de visualización de imágenes. Lightroom y
Capture One son oscuros porque un entorno de baja luminancia no contamina el juicio de
color de lo que estás mirando. Las paletas del cliente se muestran a plena saturación y son
las únicas manchas de color libre en pantalla.

**Tipografía:** Bricolage Grotesque para display, Geist para UI, Geist Mono para datos.
Deliberadamente no una serif: «se siente editorial» no es una razón de diseño.

**El momento focal** es *La Forja* (`components/motion/forja.tsx`): el hero es un
contenedor de 400vh con la columna pinned. El titular cede el sitio al prompt, que se
escribe solo atado al scroll, mientras el fotograma pasa de material en bruto a pieza
terminada en cinco beats: se enfoca, entra el color, la máscara lo descubre, se asientan
los elementos de la sección, y la hairline pasa a la rampa templada. Esa última es la única
vez que el metal aparece en el hero.

No provoca un solo render de React: el progreso vive en un `MotionValue`, las propiedades
se derivan de él con `useMotionTemplate`, y el texto se escribe directo al `textContent`.
El texto completo está en el DOM desde el primer render, con el nodo animado `aria-hidden`
y una copia accesible en `sr-only`.

**El fondo es una constelación de partículas** (`components/motion/constelacion.tsx`):
miles de triángulos contorneados que se reorganizan en una figura distinta sobre cada
sección —chispa, toroide, globo, hélice y lámina 9:16—, calculadas al vuelo, sin un solo
asset y en una única llamada de dibujo con geometría instanciada. El morfeo, el giro y la
temperatura ocurren en el vertex shader; la CPU solo escribe uniformes.

Las anclas se miden del DOM real por el `aria-labelledby` que cada sección ya tiene, así
que la coreografía se recoloca sola si la página cambia. Las figuras se posan sobre las
secciones oscuras y los cambios ocurren sobre las de papel, que son opacas y hacen de
telón. Cada figura declara además cuánta presencia se le permite, porque la tira de las
nueve secciones es lo más cargado de la página y ahí el fondo tiene que retirarse para no
comerle contraste a las etiquetas de 13px.

**La coreografía completa** vive en `components/motion/`: revelado por máscara, pan
horizontal pinned de las nueve secciones, sticky stack de la metodología, marquesina que
acelera con la velocidad de scroll, parallax de dos capas, spotlight de cursor, botón
magnético (uno solo en toda la página), contador atado al scroll y el barrido de calor en
CSS puro. Ninguna sección entra igual que otra, y el cierre no se mueve: después de una
página en movimiento, que algo esté quieto es lo que le da peso.

`MotionConfig reducedMotion="user"` va montado en el root, y cada componente de scroll
ramifica su valor: el CSS de `prefers-reduced-motion` no hace nada contra un
`useTransform(scrollYProgress, ...)`, porque ese motion value sigue recalculando cada
frame. Lenis da la sensación de peso, y no se monta en absoluto si el usuario pidió
movimiento reducido.

---

## Estado de los criterios de aceptación

`npm run verificar` y `npm run e2e` cubren la mayoría. Lo comprobado:

- Tipos, lint y build pasan sin errores ni warnings. `npm audit`: 0 vulnerabilidades.
- La clave de API no aparece en el bundle del cliente (verificado con centinela).
- Los 17 pares de color reales pasan el piso de contraste, incluido el CTA contra su fondo.
- 66/66 comprobaciones de extremo a extremo: registro, streaming, créditos transaccionales
  con devolución, CRUD completo, persistencia entre sesiones, las siete reglas del
  validador, resistencia del asistente a la extracción del system prompt, y rate limiting.

Pendiente de comprobar a mano, porque necesita ojo o navegador:

- Lighthouse (rendimiento ≥ 90, accesibilidad ≥ 95 en la home).
- `prefers-reduced-motion` activado de verdad en el navegador.
- El *feel* de La Forja: reproducirla a 2–5× de duración y mirarla otra vez al día
  siguiente.

---

## Lo que falta y se sabe

- **Los precios de `lib/planes.ts` son ilustrativos.** Hay que correr la fórmula de unit
  economics con la tarifa vigente de la API de imagen antes de publicarlos.
- **El rate limiting es en memoria del proceso.** Sirve para una instancia; en varias hay
  que moverlo a Redis o al KV de la plataforma.
- **`node:sqlite` es experimental en Node 24** y emite un aviso en cada arranque. Funciona,
  pero es la razón por la que el repositorio está detrás de una interfaz.
- **Los fotogramas de las secciones dibujan la estructura, no fotografías generadas**,
  porque F4 no está conectada. Es preferible a fingir una funcionalidad que no existe.

Las decisiones de arquitectura y las desviaciones respecto del brief están en
[DECISIONES.md](DECISIONES.md).
