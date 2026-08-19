# Decisiones

El brief maestro deja cinco decisiones abiertas en §17 y fija el resto. Aquí están las que
se cerraron y las cuatro desviaciones respecto del documento, cada una con su razón. Si
alguna no convence, esta es la lista que hay que discutir: no hay decisiones sueltas
escondidas dentro del código.

---

## Decisiones abiertas de §17, cerradas

### 1 · Persistencia: SQLite, no Supabase

`node:sqlite`, el módulo integrado de Node 22+, detrás de la interfaz
`lib/datos/repositorio.ts`.

**Por qué.** Tres razones, en orden de peso: no añade un servicio externo del que dependa
la sustentación; no arrastra dependencias nativas que compilar en Windows; y el esquema
completo cabe en un archivo, así que se puede leer y defender de principio a fin. Supabase
habría ahorrado el trabajo de autenticación, pero ese trabajo es justamente lo que se
evalúa como ingeniería de software.

**El costo, dicho sin adornos.** `node:sqlite` es experimental y emite un aviso en cada
arranque. Un archivo SQLite no sirve para varias instancias. Por eso la persistencia está
detrás de una interfaz: migrar a Postgres es escribir otra clase, no tocar pantallas.

### 2 · Modelo de imagen: Gemini

Sin cambios respecto del brief. Toda la metodología —el límite de 25 caracteres, la lista
negra, la prosa narrativa— está calibrada para Gemini. Cambiar de generador invalidaría
buena parte del activo. Es una decisión de arquitectura, no de proveedor.

### 3 · Precios: los del brief, marcados como ilustrativos

Los números de `lib/planes.ts` son los de §8.2 y están **sin validar**. La página de
precios y la política de créditos lo declaran. Antes de publicarlos hay que correr la
fórmula de §8.1 con la tarifa vigente de la API de imagen.

### 4 · Dominio y rúbrica

Quedan fuera de lo que se puede resolver desde el código: hay que verificar
`landingforge.com` / `.co` y contrastar §7 y §14 contra la rúbrica real de la entrega.

---

## Desviaciones respecto del brief

El brief dice que si algo contradice el documento, gana el documento. Estas cuatro se
apartan de él a propósito, y por eso están escritas.

### A · Next.js 16 en vez de Next.js 15

**El brief pide Next 15.** Se instaló, y `npm audit` devolvió **3 vulnerabilidades de
severidad alta** en dependencias transitivas de Next 15 (postcss y sharp), sin arreglo
posible sin subir de versión mayor. Con Next 16: **0 vulnerabilidades**.

§9.6 declara la seguridad como sección evaluable, así que entregar con tres avisos altos
pesa más que una versión mayor de diferencia. El código de App Router es idéntico; el único
cambio de forma fue renombrar `middleware.ts` a `proxy.ts`, que es la convención nueva.

### B · `motion` en vez de `framer-motion`

Esto no es desviación del brief sino de la petición original: §16.2 ya corregía que
`framer-motion` fue renombrado a `motion` y está en modo legado. Se instaló `motion` y se
importa desde `motion/react`, que es lo que asume la documentación actual y lo que asumen
las skills de animación.

### C · `@google/genai` en vez de `@google/generative-ai`

`@google/generative-ai` es el SDK anterior y está descontinuado; `@google/genai` es el
oficial vigente. La intención del brief —usar el SDK oficial de Gemini, con la clave solo
en el servidor— se cumple igual. El archivo afectado es uno: `lib/ia/gemini.ts`.

### D · Los fotogramas dibujan la estructura, no fotografías generadas

§4.7 pide que La Forja corra sobre «una imagen real, no un placeholder», y §6.2.4 habla de
nueve fotogramas «mostrando una sección real generada». Con F4 fuera de alcance no hay
secciones generadas que mostrar. Se resolvió así:

- **La Forja** corre sobre un bodegón de producto real, generado píxel a píxel por
  `scripts/generar-pieza.mjs` con el mismo esquema de luz que prescribe la metodología:
  clave cálida arriba a la derecha, contorno frío a la izquierda, sombra de contacto con
  desplazamiento y desenfoque. Es un asset raster de verdad, determinista y versionable, y
  no arrastra licencias de un banco de imágenes.
- **El grano** sale de `public/textura/grano.png`, un mosaico de ruido real de dos octavas
  generado por `scripts/generar-textura.mjs`. §4.8 prohíbe `feTurbulence` y ese es
  exactamente el atajo que se evitó.
- **Los nueve fotogramas de la tira** dibujan la estructura de cada tipología con la paleta
  asignada, que es lo que §7.1 pide explícitamente para el paso 4 del wizard. Es la misma
  pieza reutilizada, y es preferible a un mockup con foto de banco que fingiría una
  funcionalidad todavía no conectada.

---

## Hallazgos durante la construcción

### El contraste de `--text-lo` sobre `--surface-2`

§4.2 avisa: «verificar `--text-lo` sobre `--surface-1` antes de dar por buena cualquier
pantalla». Se verificó, y sobre `--surface-1` pasa (4.99:1). El problema estaba una
superficie más arriba: sobre `--surface-2` da **3.47:1**, por debajo del piso de 4.5:1.

Los tokens no se tocaron —§4.2 dice que son los únicos valores permitidos—. Lo que se
corrigió fue el uso: en superficies elevadas el texto secundario va en `--text-mid`, y
`--text-lo` solo queda para iconos y bordes, donde el piso es 3:1. Como efecto secundario,
los campos y los selects dejaron de elevarse a `--surface-2` al recibir foco, porque eso
habría dejado sus placeholders por debajo del piso; el foco se señala con el borde y el
anillo `--rim`, que ya cumplían.

La regla quedó escrita en `app/globals.css` y la comprueba
`scripts/verificar-contraste.mjs`, para que no se vuelva a colar.

### Renombrar no abre un modal

§7.2 pide poder renombrar una campaña. La primera versión lo hacía con un diálogo, y §4.8
prohíbe el modal para tareas que no necesitan interrupción ni foco protegido. Renombrar es
justo ese caso. Ahora el título de la campaña se edita en su sitio, y el único modal del
producto sigue siendo el de borrado, que sí es destructivo.

### La ruta de la base de datos hacía que el build trazara todo el proyecto

Construir la ruta con `resolve(process.cwd(), process.env.DATABASE_URL)` impide al
empaquetador acotar el análisis estático, y termina metiendo todo el proyecto —incluida
`public/`— en el bundle del servidor. La ruta se acotó estáticamente a `datos/`.
