# Experiencia de usuario

Este documento hace una sola cosa: enlazar cada concepto de la teoría con el
sitio del código donde está implementado y con la comprobación que lo sostiene.
No es una declaración de intenciones. Si una fila de estas tablas no se puede
verificar abriendo un archivo o corriendo un comando, sobra.

`DECISIONES.md` cuenta *por qué* se tomó cada decisión de diseño. Esto cuenta
*contra qué criterio* se puede juzgar.

---

## 1. El encuadre

Las cuatro capas, de fuera hacia dentro. El orden importa porque son
prerequisitos acumulativos, no alternativas: ninguna compensa a la anterior.

```
ACCESIBILIDAD  ¿puede la persona acceder?          condición de entrada
USABILIDAD     ¿lo logra sin esfuerzo inútil?      calidad de la interacción
EMOCIONES      ¿cómo lo vivió y lo recuerda?       huella afectiva
ENGAGEMENT     ¿vuelve?                            continuidad
───────────────────────────────────────────────────────────────────
UX = las cuatro, antes, durante y después del uso
```

Un producto puede ser usable y accesible y aun así producir una experiencia
indiferente. Y al revés: ninguna cantidad de espectáculo salva a una interfaz
que no se deja usar. Por eso el mundo de la portada y el aviso de «qué falta»
del wizard son el mismo trabajo visto desde dos capas distintas.

---

## 2. Usabilidad — ISO 9241-11

La norma define usabilidad como el grado en que un producto puede ser usado por
**usuarios específicos** para **objetivos específicos** con efectividad,
eficiencia y satisfacción en un **contexto de uso específico**. Las tres
especificidades son parte de la definición: sin contexto declarado no hay
medición posible.

**El contexto de uso de LandingForge, declarado:**

| | |
|---|---|
| **Usuario** | Vendedor de e-commerce o dropshipping en Colombia. Opera solo o con un equipo mínimo. No es diseñador ni sabe de ingeniería de prompts, y no tiene por qué |
| **Objetivo** | Salir de una foto de proveedor con el paquete visual completo de una landing que convierta |
| **Entorno** | Escritorio para trabajar, móvil para revisar. Conexión variable. A menudo bajo presión de una campaña de tráfico pagado ya lanzada |
| **Alternativa actual** | Una plantilla genérica, o contratar a un diseñador por pieza |

| Atributo | Cómo lo persigue el producto | Dónde |
|---|---|---|
| **Efectividad** | Nueve tipologías con regla crítica y errores conocidos; validador de siete reglas antes de guardar nada | [lib/metodologia/tipologias.ts](lib/metodologia/tipologias.ts), [lib/metodologia/reglas-prompt.ts](lib/metodologia/reglas-prompt.ts) |
| | El wizard dice qué falta en vez de solo bloquear el paso | [components/estudio/estado.ts](components/estudio/estado.ts) → `queFalta` |
| **Eficiencia** | Cuatro pasos, uno por pantalla; el borrador sobrevive a recargas; se puede volver a cualquier paso ya resuelto sin pulsar «Atrás» N veces | [components/estudio/wizard.tsx](components/estudio/wizard.tsx) |
| | Generación en *streaming*: cada sección aparece lista, no se espera a las nueve | `wizard.tsx` → `PantallaGenerando` |
| **Satisfacción** | Sin instrumento aún. El protocolo para medirla está en §8 y es lo que falta por ejecutar | — |

> La satisfacción es el atributo más difícil de medir porque es subjetivo, y
> es el único de los tres que este documento no puede dar por cubierto. Decirlo
> es más útil que inventarse un número.

---

## 3. Los cinco atributos de Nielsen (1993)

| Atributo | Implementación | Dónde |
|---|---|---|
| **Learnability** | Un paso por pantalla con título y subtítulo que explican qué se pide; los cuatro pasos nombrados desde el primero, así que la forma del proceso se ve antes de recorrerlo | `wizard.tsx` → `Pasos` |
| **Efficiency** | Estado en la URL (`?paso=2`) y en `sessionStorage`; salto directo a pasos completados | `wizard.tsx`, `estado.ts` |
| **Memorability** | El wizard es siempre el mismo recorrido de cuatro etapas nombradas. La biblioteca conserva las campañas con su nombre | [components/app/biblioteca.tsx](components/app/biblioteca.tsx) |
| **Errors** | `pasoCompleto` impide avanzar incompleto; `queFalta` explica por qué; el crédito se devuelve cuando una sección falla | `estado.ts`, `wizard.tsx` |
| **Satisfaction** | Pendiente de medición — §8 | — |

---

## 4. Accesibilidad — WCAG 2 nivel AA

### 4.1 Lo implementado

| Criterio | Qué se hace | Dónde |
|---|---|---|
| **1.1.1** Contenido no textual | El lienzo del mundo es `aria-hidden`: es decoración, y la historia vive en el texto de al lado | [components/mundo/mundo.tsx](components/mundo/mundo.tsx) |
| **1.3.1** Información y relaciones | `<label>` real asociado siempre; el placeholder nunca hace de etiqueta; error enlazado con `aria-describedby` | [components/ui/campo.tsx](components/ui/campo.tsx) |
| **1.4.3 / 1.4.11** Contraste | Auditoría de los pares reales sobre los dos materiales, leyendo los tokens del CSS para que no se desfase | [scripts/verificar-contraste.mjs](scripts/verificar-contraste.mjs) |
| **2.1.1** Teclado | Lenis no secuestra anclas ni tabulación; con movimiento reducido no se monta | [components/motion/movimiento.tsx](components/motion/movimiento.tsx) |
| **2.3.3** Movimiento por interacción | `MotionConfig reducedMotion="user"` + bloque CSS + `MundoEstatico` como alternativa completa | `movimiento.tsx`, `globals.css`, `mundo.tsx` |
| **2.4.1** Evitar bloques | Salto al contenido en los tres chromes, no solo en el público | [components/ui/saltar.tsx](components/ui/saltar.tsx) |
| **3.1.1** Idioma | `lang="es-CO"` | [app/layout.tsx](app/layout.tsx) |
| **4.1.2** Nombre, función, valor | Barra del wizard con `role="progressbar"` y `aria-valuetext`; escenas inactivas con `inert` | `wizard.tsx`, `mundo.tsx` |
| **4.1.3** Mensajes de estado | `aria-live="polite"` en el progreso de generación y en el aviso de qué falta | `wizard.tsx` |

### 4.2 La comprobación ejecutable

```bash
npm run verificar:a11y      # necesita el servidor levantado
```

[scripts/verificar-a11y.mjs](scripts/verificar-a11y.mjs) recorre las rutas
públicas con Chromium y comprueba los criterios automatizables: nombres
accesibles, estructura de encabezados, etiquetas de formulario, landmarks,
idioma, títulos distintos por ruta, texto de enlace y —lo más grave— elementos
enfocables atrapados dentro de un `aria-hidden`.

Dos cosas que el script hace a propósito y conviene no «arreglar»:

- **Ignora los subárboles `aria-hidden`** al exigir nombres y etiquetas. Radix
  monta un `<select>` nativo de 1 px, oculto y con `tabindex="-1"`, para que el
  autocompletado del navegador siga funcionando. Reclamarle una etiqueta es un
  falso positivo, y un audit con falsos positivos enseña a ignorar su salida.
- **Solo exige el salto al contenido donde hay navegación que saltar** (tres o
  más destinos). El criterio 2.4.1 existe para bloques repetidos; pedirlo en una
  pantalla de una sola columna es ruido.

**La automatización cubre alrededor de un tercio de la WCAG.** Queda fuera, y
hay que mirarlo a mano: si el `alt` describe de verdad, si el orden de foco
sigue al orden visual, si el contenido aguanta 200 % de zoom. El script lo
imprime al final de cada ejecución en vez de callarlo.

### 4.3 Marco legal colombiano

Ley estatutaria **1618 de 2013** (derechos de las personas con discapacidad,
incluido el acceso a las tecnologías de la información) y **Acuerdo 559 de
2014** para entidades del Distrito. LandingForge es un producto privado y no
está obligado por el Acuerdo, pero el argumento económico se sostiene solo:
accesibilidad es mercado, no caridad.

---

## 5. Percepción y factor humano

| Principio | Aplicación |
|---|---|
| **Nunca el color como único código** | Los estados del validador y del progreso llevan siempre palabra además de color: `lista`, `falló · crédito devuelto`, `en cola`. Con deuteranopía —el 8 % de los hombres— verde y rojo se confunden; las palabras no |
| **Sin colores oponentes** | La paleta no enfrenta rojo-verde ni amarillo-azul: es una rampa de temperatura (`--heat`, `--quench`) sobre neutros |
| **Contraste de luminosidad, no de tono** | Es lo que audita `verificar-contraste.mjs`, y por eso el audit lee los tokens en vez de una lista escrita a mano |
| **Menos colores entre fondo y texto** | Dos materiales, no siete. El estudio oscuro y el papel claro, y la tipografía cambia de carácter entre ellos |

---

## 6. Leyes de Gestalt

Trabajan en conjunto, nunca aisladas. La recomendación operativa es revisar
cada ley **después** de terminar una interfaz, para detectar relaciones que el
diseño esté sugiriendo sin haberlo decidido.

| Ley | Dónde se apoya |
|---|---|
| **Proximidad** | El bloque de crédito de la barra lateral agrupa plan, saldo y barra de consumo: se leen como una sola unidad |
| **Similitud** | Todas las secciones del validador comparten forma, altura y ritmo: la lista se lee como un conjunto homogéneo |
| **Continuidad** | Los cuatro pasos alineados y separados por puntos se leen como secuencia, no como cuatro botones sueltos |
| **Figura/fondo** | El velo degradado bajo el mundo separa el texto del diorama sin taparlo |
| **Contraste** | `--heat` está reservado a la acción principal; si se usara para decorar dejaría de significar «esto es lo siguiente» |

---

## 7. Reglas de diseño (Norman)

| Regla | Aplicación |
|---|---|
| **Señales claras y naturales** | El botón principal es el único elemento en `--heat` de cada pantalla |
| **Ser previsible** | El wizard hace siempre lo mismo en los cuatro pasos: cabecera, campos, avance abajo |
| **Buen modelo conceptual** | El vocabulario es de forja de principio a fin —campaña, pieza, temple— y no se mezcla con jerga de modelos generativos. `/metodologia` publica el modelo entero para quien quiera abrirlo |
| **Resultado comprensible** | La pantalla de generación nombra la sección que está construyendo, no un porcentaje abstracto |
| **Conciencia continua que no moleste** | La hairline de temple del panel de administración está siempre presente y nunca pide atención |
| **Que las personas sientan que tienen el control** | Se puede volver a cualquier paso resuelto; el borrador sobrevive a la recarga; renombrar y borrar campañas están a un clic |

**Sobre el error, que es el criterio más práctico de todos:** *si un error es
posible, alguien lo cometerá*. Minimizar la posibilidad (`pasoCompleto`),
minimizar la consecuencia (el crédito se devuelve cuando una sección falla) y
hacer los efectos reversibles (el borrador persiste; las campañas se pueden
renombrar y borrar).

> **El caso que cerró este documento.** El botón «Continuar» se deshabilitaba
> sin decir por qué, mientras que el de generar sí explicaba su bloqueo («te
> faltan N créditos»). El sistema conocía la razón y no la compartía, así que
> el usuario tenía que descubrirla probando. La inconsistencia era nuestra, no
> suya. Eso es lo que arregla `queFalta`.

---

## 8. Lo que falta: evaluación con usuarios

Aquí está el límite honesto de todo lo anterior. **Los usuarios —y no los
diseñadores ni los desarrolladores— son quienes determinan cuándo un producto
es fácil de usar.** Todo lo de arriba es diseño *pensando en* el usuario, que
no es lo mismo que *implicar al* usuario. Nada de esto ha sido validado con
una sola persona real.

Este es el protocolo listo para ejecutar. No requiere laboratorio.

### 8.1 Participantes

Cinco a ocho vendedores de e-commerce o dropshipping colombianos que **no**
hayan visto el producto. Cinco detectan la mayoría de los problemas graves; más
allá de ocho, los hallazgos se repiten.

### 8.2 Tareas

Sin ayuda, pensando en voz alta:

1. Averiguar qué hace este producto y cuánto cuesta *(comprensibilidad)*.
2. Crear una cuenta y llegar al Estudio *(primera vez)*.
3. Generar una campaña completa para un producto propio *(la tarea central)*.
4. Volver mañana y encontrar esa campaña *(memorabilidad)*.
5. Cambiar la paleta asignada y regenerar solo el hero *(recuperación)*.

### 8.3 Métricas a registrar

| Atributo | Métrica | Instrumento |
|---|---|---|
| Efectividad | Tasa de finalización por tarea; intentos fallidos antes de lograrla | Observación |
| Eficiencia | Tiempo por tarea; comparado con la línea base de hacerlo a mano | Cronómetro |
| Aprendizaje | Tiempo de la tarea 3 la primera vez vs. una semana después | Dos sesiones |
| Errores | Número y gravedad; cuáles se recuperan solos | Observación |
| Satisfacción | **SUS** al terminar | §8.4 |
| Atención | Dónde se detiene la mirada en la portada | Grabación de pantalla, o eyetracking si hay |

El cruce importa: lo observado (tasa de finalización, tiempo) y lo percibido
(SUS) miden cosas distintas y ninguna sola sostiene una conclusión. Un usuario
puede completar todas las tareas y odiar el proceso.

### 8.4 SUS — System Usability Scale

Diez afirmaciones, escala de 1 (muy en desacuerdo) a 5 (muy de acuerdo). Se
aplica **inmediatamente** después de la sesión, antes de comentar nada.

1. Creo que usaría este sistema con frecuencia.
2. Encuentro este sistema innecesariamente complejo.
3. Creo que el sistema es fácil de usar.
4. Necesitaría apoyo técnico para poder usar este sistema.
5. Las funciones del sistema están bien integradas.
6. Hay demasiada inconsistencia en este sistema.
7. Imagino que la mayoría aprendería a usarlo muy rápido.
8. El sistema es muy incómodo de usar.
9. Me sentí muy seguro usando el sistema.
10. Necesité aprender muchas cosas antes de poder empezar.

**Cálculo.** Impares: restar 1 al valor. Pares: restar el valor a 5. Sumar los
diez resultados y multiplicar por 2.5. Da un número de 0 a 100 que **no es un
porcentaje**. Referencia: 68 es el promedio de la industria; por debajo de 50
hay un problema serio; por encima de 80 el producto está en el cuartil alto.

### 8.5 Qué hacer con los resultados

Los hallazgos vuelven a `DECISIONES.md` con la misma forma que el resto: qué se
observó, qué se cambió y por qué. Una evaluación que no cambia el producto es
una evaluación que no se hizo.

---

## 9. Engagement y emociones

Engagement es la cualidad de la experiencia que refleja qué tan involucrado
está el usuario **cognitiva, emocional y conductualmente** durante la
interacción (O'Brien & Toms, 2008). Las tres dimensiones, no solo la última.

| Dimensión | Cómo se persigue | Dónde |
|---|---|---|
| **Cognitiva** | La portada enseña el mecanismo en vez de afirmarlo: seis escenas que van del problema del vendedor a su resultado | [lib/mundo/escenas.ts](lib/mundo/escenas.ts) |
| **Emocional** | Un material con temperatura —forja, temple— en lugar del degradado azul de todas las herramientas de IA. La marca tiene carácter antes de tener funciones |
| **Conductual** | Cinco créditos al registrarse sin tarjeta: la primera campaña completa se puede hacer antes de decidir nada | [lib/planes.ts](lib/planes.ts) |

El riesgo de esta capa está anotado en `DECISIONES.md` y vale repetirlo: el
engagement **había que verlo, no afirmarlo**. Una escena que dice «sostenemos
el scroll» sobre una animación genérica es texto, no demostración.

---

## 10. Resumen ejecutable

```bash
npm run verificar            # tipos + lint + contraste + build
npm run verificar:contraste  # pares de color reales contra el piso WCAG
npm run verificar:a11y       # criterios WCAG automatizables (servidor arriba)
npm run e2e                  # 66 comprobaciones de extremo a extremo
npm run mirar                # recorre la página y captura fotogramas
```

Lo que ninguno de estos comandos puede decir es si el producto se entiende.
Eso es §8, y sigue pendiente.

---

## Referencias

- ISO 9241-11:2018 — *Usability: definitions and concepts*
- ISO/IEC 9126-1:2001 y ISO/IEC 25010:2011 — modelos de calidad de software
- J. Nielsen (1993) — *Usability Engineering*; los cinco atributos
- D. Norman — *The Design of Everyday Things*; affordance, modelo conceptual, error
- W3C / WAI — *Web Content Accessibility Guidelines* 2.2, niveles A / AA / AAA
- H. O'Brien & E. Toms (2008) — definición de engagement
- J. Brooke (1996) — *SUS: A quick and dirty usability scale*
- Ley estatutaria 1618 de 2013 (Colombia); Acuerdo 559 de 2014
