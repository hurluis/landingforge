/**
 * Tokens de movimiento exportados a JS — §6.2.
 * Las curvas viven en CSS; esto es su espejo para Motion.
 */

export const EASE = {
  /** Llegadas confiadas. El default. */
  out: [0.16, 1, 0.3, 1],
  /** Entradas rápidas de UI. */
  outHard: [0.23, 1, 0.32, 1],
  /** Movimiento en pantalla. */
  inOut: [0.77, 0, 0.175, 1],
  /** Paneles deslizantes. */
  drawer: [0.32, 0.72, 0, 1],
} as const;

export const SPRING = {
  /** Reveals de UI. Bounce por debajo de 0.2: nada de juguete. */
  ui: { type: "spring", duration: 0.5, bounce: 0.18 },
  /** Parallax y follow. Sobreamortiguado: se siente pegado, no flotando. */
  attached: { stiffness: 400, damping: 90 },
  /** Suavizado de scrollYProgress. Mata el jitter sin desconectarse del scrollbar. */
  scroll: { stiffness: 220, damping: 34, restDelta: 0.001 },
  /** Botón magnético. */
  magnetic: { stiffness: 300, damping: 22, mass: 0.3 },
} as const;

export const DUR = {
  press: 0.16,
  hover: 0.2,
  menu: 0.22,
  overlay: 0.32,
  /** Entrada focal autorizada. Solo marketing. */
  focal: 0.7,
} as const;

/** Viewport estándar de los reveals: una sola vez, nunca al volver a subir. */
export const UNA_VEZ = { once: true, amount: 0.4 } as const;
