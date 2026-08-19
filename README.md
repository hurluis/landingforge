# LandingForge

Plataforma web que convierte la foto de un producto en el paquete visual completo de una
landing page de e-commerce: paleta de marca asignada por matriz, copy de conversión y los
prompts validados de hasta nueve secciones de arte.

El motor no es «una IA que hace imágenes bonitas». El motor es una **metodología de
ingeniería de prompts** —estructurada, versionada y probada en el mercado colombiano— que
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
| `/app/nueva` | El Estudio — wizard de cuatro pasos |

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

`npm run e2e` necesita el servidor levantado en otra terminal.

---

## Funcionalidades

| ID | Funcionalidad | Estado |
|---|---|---|
| **F1** | Estudio de prompts: wizard de 4 pasos, generación en streaming, validador de 7 reglas | Funcional completa |
| **F2** | Cuenta, biblioteca con CRUD, créditos transaccionales | Funcional completa |
| **F3** | Asistente acotado al dominio, en streaming, con guardarraíles | Funcional completa |
| F4 | Generación de imágenes | Fuera de alcance — interfaz construida, tras bandera de entorno |
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
proxy.ts                guardia de /app/* — solo verifica la firma del token
components/
  ui/                   primitivas: botón, campo, select, diálogo, acordeón, fotograma…
  marketing/            Forja, TiraContactos, BloqueMetodologia, TablaPrecios, Lamina
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

**El principio rector:** el chrome es desaturado para que el color del cliente sea el único
color fuerte en pantalla. La interfaz es un entorno de visualización de imágenes, como
Lightroom o Capture One, y su cromo tiene que desaparecer.

**El elemento firma** es *La Forja* (`components/marketing/forja.tsx`): en el hero, un
fotograma 9:16 pasa de material en bruto —casi negro, con grano y desenfoque fuerte— a
pieza terminada mientras el prompt se escribe solo a su izquierda. Corre una vez al entrar
en viewport, tiene control para repetirla, y **no provoca un solo render de React**: el
progreso vive en un `MotionValue` y tanto el texto como el estado final se escriben
directamente sobre el DOM.

**Movimiento.** Hay un inventario cerrado de diez movimientos autorizados. Cada sección de
la home entra de una forma distinta, derivada de su contenido: la lista de reglas se revela
de arriba abajo como una hoja que se imprime, la tira de fotogramas de izquierda a derecha
como una tira de negativo, las columnas de precios con stagger porque son comparables, y el
bloque de cierre no se mueve. `prefers-reduced-motion` y el gating de puntero
(`hover: hover` **y** `pointer: fine`) van con cada animación, no después.

---

## Estado de los criterios de aceptación

`npm run verificar` y `npm run e2e` cubren la mayoría. Lo comprobado:

- Tipos, lint y build pasan sin errores ni warnings. `npm audit`: 0 vulnerabilidades.
- La clave de API no aparece en el bundle del cliente (verificado con centinela).
- Los 17 pares de color reales pasan el piso de contraste.
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
