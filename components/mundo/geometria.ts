import type { Escena } from "@/lib/mundo/escenas";

/**
 * LOS SEIS DIORAMAS · geometría del mundo, construida al vuelo.
 *
 * Cero assets. Ni un .gltf, ni una textura, ni una petición de red: todo sale
 * de primitivas —cajas, cilindros, conos, cápsulas— compuestas con la paleta
 * de `globals.css`. Es la misma decisión que ya tomó la constelación, y por
 * las mismas razones: pesa kilobytes, escala a cualquier resolución sin
 * pixelarse, y no depende de que un servicio externo siga existiendo.
 *
 * Reglas que se respetan aquí porque son las del sistema, no las mías:
 *
 *   · `--heat` significa EN PROCESO. Solo emite naranja lo que se está
 *     forjando: la escena del caos no tiene una sola chispa, y la bóveda
 *     tampoco. Si todo brillara, el naranja dejaría de decir nada.
 *   · La rampa `--forged` significa TERMINADO, y solo aparece sobre objetos
 *     físicos: sellos, paneles ya enfriados, cinta de los paquetes.
 *   · `--quench` es información: pantallas, anillos de la bóveda, gráfica.
 *   · La luz clave es cálida y el contorno frío. El contraste de temperatura
 *     es lo que hace que el naranja pegue el doble sobre grafito.
 *
 * Rendimiento: las geometrías y los materiales se crean UNA vez por mundo y
 * se comparten entre mallas. Cada diorama devuelve además su propio `animar`,
 * que el bucle solo llama para las escenas visibles.
 */

type Three = typeof import("three");
type Grupo = import("three").Group;
type Malla = import("three").Mesh;
type Objeto = import("three").Object3D;

/* ---------------------------------------------------------------- */
/* Paleta — los mismos hex que declara app/globals.css               */
/* ---------------------------------------------------------------- */

export const COLOR = {
  void: 0x101216,
  anvil: 0x181b21,
  anvilHi: 0x222630,
  sunk: 0x0a0c10,
  scale: 0x2b3038,
  scaleHi: 0x3d444f,
  ash: 0xf4f5f7,
  smoke: 0x9ba3ae,
  slag: 0x838892,
  heat: 0xff5c2b,
  heatLo: 0xc43d12,
  ember: 0xffa05c,
  forgedHi: 0xf0dcb4,
  forged: 0xc9a063,
  forgedLo: 0x8a6634,
  quench: 0x5cc8ff,
  quenchLo: 0x2a93c7,
} as const;

/** Un diorama montado: su grupo y, si se mueve, cómo. */
export interface Diorama {
  grupo: Grupo;
  /** `t` segundos desde el arranque, `p` progreso 0..1 dentro de la escena. */
  animar?: (t: number, p: number) => void;
}

/**
 * Fábrica de recursos compartidos. Crear una caja por objeto multiplicaría
 * por cien los buffers en GPU sin cambiar un píxel del resultado.
 */
export interface Taller {
  THREE: Three;
  caja: import("three").BoxGeometry;
  plano: import("three").PlaneGeometry;
  cilindro: import("three").CylinderGeometry;
  cono: import("three").ConeGeometry;
  esfera: import("three").SphereGeometry;
  toro: import("three").TorusGeometry;
  capsula: import("three").CapsuleGeometry;
  mat: (color: number, opciones?: OpcionesMaterial) => import("three").Material;
  liberar: () => void;
}

interface OpcionesMaterial {
  /** Cuánto emite. 0 es materia muerta; > 0 es una fuente de luz aparente. */
  brillo?: number;
  /** Color de la emisión si difiere del difuso. */
  emision?: number;
  rugosidad?: number;
  metalico?: number;
  transparente?: number;
}

export function crearTaller(THREE: Three): Taller {
  const cache = new Map<string, import("three").Material>();
  const materiales: import("three").Material[] = [];

  const geos = {
    caja: new THREE.BoxGeometry(1, 1, 1),
    plano: new THREE.PlaneGeometry(1, 1),
    cilindro: new THREE.CylinderGeometry(0.5, 0.5, 1, 20),
    cono: new THREE.ConeGeometry(0.5, 1, 4),
    esfera: new THREE.SphereGeometry(0.5, 16, 12),
    toro: new THREE.TorusGeometry(1, 0.04, 8, 48),
    capsula: new THREE.CapsuleGeometry(0.5, 1, 4, 8),
  };

  function mat(color: number, o: OpcionesMaterial = {}) {
    const clave = `${color}|${o.brillo ?? 0}|${o.emision ?? -1}|${o.rugosidad ?? 0.85}|${o.metalico ?? 0}|${o.transparente ?? 1}`;
    const existente = cache.get(clave);
    if (existente) return existente;

    const m = new THREE.MeshStandardMaterial({
      color,
      roughness: o.rugosidad ?? 0.85,
      /* Tope de 0.3 a propósito. Un material metálico refleja su entorno, y
         este mundo no tiene environment map —no hay assets—, así que por
         encima de ahí el reflejo que buscaría no existe y la malla se
         renderiza casi negra. El aspecto de metal lo dan la emisión y la
         rampa `--forged`, no el canal metálico. */
      metalness: Math.min(o.metalico ?? 0, 0.3),
      /* Facetado plano: es lo que da el aspecto de maqueta de arcilla en vez
         de plástico suave, y no cuesta nada porque evita normales suaves. */
      flatShading: true,
      emissive: o.brillo ? (o.emision ?? color) : 0x000000,
      emissiveIntensity: o.brillo ?? 0,
      transparent: (o.transparente ?? 1) < 1,
      opacity: o.transparente ?? 1,
    });
    cache.set(clave, m);
    materiales.push(m);
    return m;
  }

  return {
    THREE,
    ...geos,
    mat,
    liberar() {
      for (const g of Object.values(geos)) g.dispose();
      for (const m of materiales) m.dispose();
      cache.clear();
    },
  };
}

/* ---------------------------------------------------------------- */
/* Ayudas de composición                                             */
/* ---------------------------------------------------------------- */

type Colocacion = {
  pos?: [number, number, number];
  esc?: [number, number, number] | number;
  rot?: [number, number, number];
};

function poner(malla: Objeto, { pos, esc, rot }: Colocacion) {
  if (pos) malla.position.set(pos[0], pos[1], pos[2]);
  if (typeof esc === "number") malla.scale.setScalar(esc);
  else if (esc) malla.scale.set(esc[0], esc[1], esc[2]);
  if (rot) malla.rotation.set(rot[0], rot[1], rot[2]);
  return malla;
}

/** Genera pseudoaleatorios deterministas: el mundo es idéntico en cada carga. */
function dado(semilla: number) {
  let s = semilla >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* ---------------------------------------------------------------- */
/* 1 · EL CAOS — la única escena sin una sola chispa                 */
/* ---------------------------------------------------------------- */

function caos(t: Taller): Diorama {
  const { THREE } = t;
  const g = new THREE.Group();
  const azar = dado(11);

  const suelo = new THREE.Mesh(t.plano, t.mat(COLOR.sunk, { rugosidad: 1 }));
  poner(suelo, { pos: [0, -1.9, 0], esc: [26, 26, 1], rot: [-Math.PI / 2, 0, 0] });
  g.add(suelo);

  /* Mesa: tablero + cuatro patas. */
  const tablero = new THREE.Mesh(t.caja, t.mat(COLOR.scale));
  poner(tablero, { pos: [0, 0, 0], esc: [7, 0.28, 4.4] });
  g.add(tablero);
  for (const [x, z] of [
    [-3.2, -1.9],
    [3.2, -1.9],
    [-3.2, 1.9],
    [3.2, 1.9],
  ] as const) {
    const pata = new THREE.Mesh(t.caja, t.mat(COLOR.anvil));
    poner(pata, { pos: [x, -1.05, z], esc: [0.22, 1.9, 0.22] });
    g.add(pata);
  }

  /* Cajas de envío apiladas sin criterio: el desorden ES el mensaje. */
  const tonosCarton = [COLOR.scaleHi, COLOR.scale, COLOR.anvilHi];
  for (let i = 0; i < 9; i++) {
    const c = new THREE.Mesh(t.caja, t.mat(tonosCarton[i % 3]));
    const ancho = 0.55 + azar() * 0.5;
    poner(c, {
      pos: [-3 + azar() * 6, 0.14 + ancho / 2 + (i > 5 ? ancho : 0), -1.6 + azar() * 3.2],
      esc: [ancho, ancho, ancho * (0.7 + azar() * 0.5)],
      rot: [0, azar() * Math.PI, 0],
    });
    g.add(c);
  }

  /* Papeles sueltos. */
  for (let i = 0; i < 5; i++) {
    const p = new THREE.Mesh(t.caja, t.mat(COLOR.smoke, { rugosidad: 1 }));
    poner(p, {
      pos: [-2.6 + azar() * 5.2, 0.16, -1.7 + azar() * 3.4],
      esc: [0.62, 0.012, 0.86],
      rot: [0, azar() * Math.PI, 0],
    });
    g.add(p);
  }

  /* El producto: solo, de pie, sin nada que lo sostenga visualmente. */
  const producto = new THREE.Mesh(t.cilindro, t.mat(COLOR.ash, { rugosidad: 0.55 }));
  poner(producto, { pos: [0.2, 0.75, 0.1], esc: [0.62, 1.2, 0.62] });
  g.add(producto);
  const tapa = new THREE.Mesh(t.cilindro, t.mat(COLOR.slag, { rugosidad: 0.5 }));
  poner(tapa, { pos: [0.2, 1.42, 0.1], esc: [0.42, 0.22, 0.42] });
  g.add(tapa);

  /* El celular que hace de estudio fotográfico. Su pantalla es la única
     fuente de luz de la escena, y es fría: por eso la foto sale mal. */
  const cuerpoCel = new THREE.Mesh(t.caja, t.mat(COLOR.anvil));
  poner(cuerpoCel, { pos: [2.5, 0.95, 1.2], esc: [0.78, 1.5, 0.07], rot: [0, -0.5, -0.12] });
  g.add(cuerpoCel);
  const pantalla = new THREE.Mesh(
    t.plano,
    t.mat(COLOR.quenchLo, { brillo: 1.1, emision: COLOR.quench }),
  );
  poner(pantalla, { pos: [2.47, 0.95, 1.25], esc: [0.66, 1.34, 1], rot: [0, -0.5, -0.12] });
  g.add(pantalla);

  const luzCel = new THREE.PointLight(COLOR.quench, 22, 14, 2);
  luzCel.position.set(2.2, 1.2, 1.6);
  g.add(luzCel);

  /* Taza fría, el detalle que fecha la escena. */
  const taza = new THREE.Mesh(t.cilindro, t.mat(COLOR.anvilHi));
  poner(taza, { pos: [-2.6, 0.44, 1.3], esc: [0.42, 0.6, 0.42] });
  g.add(taza);

  return {
    grupo: g,
    animar(tiempo) {
      /* Solo parpadea la pantalla. Todo lo demás está muerto, que es el punto. */
      pantalla.scale.x = 0.66 + Math.sin(tiempo * 1.7) * 0.004;
      luzCel.intensity = 20 + Math.sin(tiempo * 2.3) * 2;
    },
  };
}

/* ---------------------------------------------------------------- */
/* 2 · LA FORJA — máximo calor de toda la página                     */
/* ---------------------------------------------------------------- */

function forja(t: Taller): Diorama {
  const { THREE } = t;
  const g = new THREE.Group();

  const suelo = new THREE.Mesh(t.plano, t.mat(COLOR.sunk, { rugosidad: 1 }));
  poner(suelo, { pos: [0, -2.6, 0], esc: [30, 30, 1], rot: [-Math.PI / 2, 0, 0] });
  g.add(suelo);

  /* El yunque: base tronco-cónica, cintura y tabla. */
  const base = new THREE.Mesh(t.caja, t.mat(COLOR.scale));
  poner(base, { pos: [0, -2.1, 0], esc: [2.6, 0.9, 1.8] });
  g.add(base);
  const cintura = new THREE.Mesh(t.caja, t.mat(COLOR.scale));
  poner(cintura, { pos: [0, -1.35, 0], esc: [1.1, 0.7, 1.0] });
  g.add(cintura);
  const tabla = new THREE.Mesh(t.caja, t.mat(COLOR.smoke, { metalico: 0.3, rugosidad: 0.45 }));
  poner(tabla, { pos: [0, -0.85, 0], esc: [3.4, 0.42, 1.5] });
  g.add(tabla);
  /* El cuerno, que es lo que hace que un yunque se lea como yunque. */
  const cuerno = new THREE.Mesh(t.cono, t.mat(COLOR.smoke, { metalico: 0.3, rugosidad: 0.45 }));
  poner(cuerno, { pos: [2.35, -0.85, 0], esc: [0.72, 1.5, 0.72], rot: [0, Math.PI / 4, -Math.PI / 2] });
  g.add(cuerno);

  /* El producto flotando sobre el yunque, incandescente por dentro. */
  const producto = new THREE.Mesh(t.cilindro, t.mat(COLOR.ash, { rugosidad: 0.4, metalico: 0.15, brillo: 0.22 }));
  poner(producto, { pos: [0, 1.3, 0], esc: [0.78, 1.5, 0.78] });
  g.add(producto);
  const halo = new THREE.Mesh(
    t.cilindro,
    t.mat(COLOR.heat, { brillo: 1.5, transparente: 0.24 }),
  );
  poner(halo, { pos: [0, 1.3, 0], esc: [1.0, 1.62, 1.0] });
  g.add(halo);

  /* Las láminas de material siendo dobladas: los bloques de la landing,
     todavía calientes, curvándose alrededor de la pieza. */
  const laminas: Malla[] = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const l = new THREE.Mesh(
      t.caja,
      t.mat(i % 2 ? COLOR.heatLo : COLOR.heat, { brillo: 0.8 + (i % 3) * 0.25 }),
    );
    poner(l, {
      pos: [Math.cos(a) * 3.4, 0.6 + Math.sin(i * 1.7) * 0.9, Math.sin(a) * 3.4],
      esc: [1.5, 0.09, 0.95],
      rot: [Math.sin(i) * 0.5, -a, Math.cos(i) * 0.45],
    });
    laminas.push(l);
    g.add(l);
  }

  /* Chispas. Puntos aditivos que suben y reaparecen abajo. */
  const CHISPAS = 340;
  const posiciones = new Float32Array(CHISPAS * 3);
  const velocidades = new Float32Array(CHISPAS);
  const azar = dado(29);
  for (let i = 0; i < CHISPAS; i++) {
    posiciones[i * 3] = (azar() - 0.5) * 7;
    posiciones[i * 3 + 1] = -2 + azar() * 7;
    posiciones[i * 3 + 2] = (azar() - 0.5) * 7;
    velocidades[i] = 0.5 + azar() * 1.5;
  }
  const geoChispas = new THREE.BufferGeometry();
  geoChispas.setAttribute("position", new THREE.BufferAttribute(posiciones, 3));
  const matChispas = new THREE.PointsMaterial({
    color: COLOR.ember,
    size: 0.075,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const chispas = new THREE.Points(geoChispas, matChispas);
  g.add(chispas);

  const fragua = new THREE.PointLight(COLOR.heat, 52, 26, 2);
  fragua.position.set(0, 0.6, 0);
  g.add(fragua);

  return {
    grupo: g,
    animar(tiempo) {
      producto.rotation.y = tiempo * 0.5;
      producto.position.y = 1.3 + Math.sin(tiempo * 1.1) * 0.11;
      halo.rotation.y = -tiempo * 0.3;
      halo.position.y = producto.position.y;

      for (let i = 0; i < laminas.length; i++) {
        const l = laminas[i];
        l.rotation.z += 0.0022 + i * 0.0004;
        l.position.y += Math.sin(tiempo * 0.8 + i) * 0.0022;
      }
      g.rotation.y = Math.sin(tiempo * 0.12) * 0.05;

      const p = geoChispas.attributes.position as import("three").BufferAttribute;
      const arr = p.array as Float32Array;
      for (let i = 0; i < CHISPAS; i++) {
        arr[i * 3 + 1] += velocidades[i] * 0.014;
        if (arr[i * 3 + 1] > 5.5) arr[i * 3 + 1] = -2.2;
      }
      p.needsUpdate = true;

      fragua.intensity = 46 + Math.sin(tiempo * 4.1) * 8 + Math.sin(tiempo * 9.3) * 4;
    },
  };
}

/* ---------------------------------------------------------------- */
/* 3 · LA LÍNEA — nueve moldes, nueve tipologías                     */
/* ---------------------------------------------------------------- */

function linea(t: Taller): Diorama {
  const { THREE } = t;
  const g = new THREE.Group();

  const suelo = new THREE.Mesh(t.plano, t.mat(COLOR.sunk, { rugosidad: 1 }));
  poner(suelo, { pos: [0, -2.4, 0], esc: [40, 40, 1], rot: [-Math.PI / 2, 0, 0] });
  g.add(suelo);

  /* La cinta, en diagonal para que el vuelo la recorra en escorzo. */
  const cinta = new THREE.Mesh(t.caja, t.mat(COLOR.anvil, { metalico: 0.2, rugosidad: 0.6 }));
  poner(cinta, { pos: [0, -0.9, 0], esc: [18.5, 0.36, 2.7] });
  g.add(cinta);
  const borde = new THREE.Mesh(t.caja, t.mat(COLOR.scaleHi, { metalico: 0.4, rugosidad: 0.45 }));
  poner(borde, { pos: [0, -0.68, 0], esc: [18.5, 0.06, 2.9] });
  g.add(borde);

  for (let i = -4; i <= 4; i++) {
    const pata = new THREE.Mesh(t.caja, t.mat(COLOR.anvilHi));
    poner(pata, { pos: [i * 2.1, -1.75, 0], esc: [0.24, 1.4, 0.24] });
    g.add(pata);
  }

  /* Nueve moldes y nueve paneles. El panel se enfría a medida que avanza:
     naranja recién salido, templado al final. Es la metodología, dibujada. */
  const paneles: Malla[] = [];
  const FORMAS: [number, number][] = [
    [1.5, 2.6],
    [1.9, 1.5],
    [2.2, 1.7],
    [1.4, 2.3],
    [2.0, 1.4],
    [1.6, 2.0],
    [1.8, 1.6],
    [1.5, 2.1],
    [2.1, 1.9],
  ];
  for (let i = 0; i < 9; i++) {
    const x = -7.6 + i * 1.9;
    const avance = i / 8;

    const molde = new THREE.Mesh(t.caja, t.mat(COLOR.scale, { metalico: 0.3, rugosidad: 0.5 }));
    poner(molde, { pos: [x, -0.55, 0], esc: [1.5, 0.34, 1.9] });
    g.add(molde);

    /* Interpolación de la rampa: heat → forged. Los dos extremos son tokens
       reales del sistema, no un degradado inventado. */
    const c = new THREE.Color(COLOR.heat).lerp(new THREE.Color(COLOR.forged), avance);
    const [w, h] = FORMAS[i];
    const panel = new THREE.Mesh(
      t.caja,
      t.mat(c.getHex(), { brillo: 1.05 - avance * 0.72, rugosidad: 0.55 }),
    );
    poner(panel, { pos: [x, -0.38 + h / 2, 0], esc: [w, h, 0.07] });
    paneles.push(panel);
    g.add(panel);
  }

  const luzCaliente = new THREE.PointLight(COLOR.heat, 34, 22, 2);
  luzCaliente.position.set(-7, 0.6, 1.6);
  g.add(luzCaliente);
  const luzFria = new THREE.PointLight(COLOR.forgedHi, 24, 22, 2);
  luzFria.position.set(7, 0.6, 1.6);
  g.add(luzFria);

  return {
    grupo: g,
    animar(tiempo) {
      for (let i = 0; i < paneles.length; i++) {
        const p = paneles[i];
        /* Escalonado: cada panel sale de su molde con su propio retraso, así
           la línea se lee como una secuencia y no como un bloque. */
        const fase = tiempo * 0.7 - i * 0.42;
        const brote = (Math.sin(fase) + 1) / 2;
        p.scale.y = FORMAS[i][1] * (0.9 + brote * 0.14);
        p.position.y = -0.38 + p.scale.y / 2;
      }
      luzCaliente.intensity = 31 + Math.sin(tiempo * 3.3) * 5;
    },
  };
}

/* ---------------------------------------------------------------- */
/* 4 · EL MERCADO — Colombia, con sus señales                        */
/* ---------------------------------------------------------------- */

function mercado(t: Taller): Diorama {
  const { THREE } = t;
  const g = new THREE.Group();
  const azar = dado(73);

  const suelo = new THREE.Mesh(t.plano, t.mat(COLOR.anvil, { rugosidad: 1 }));
  poner(suelo, { pos: [0, -1.4, 0], esc: [34, 34, 1], rot: [-Math.PI / 2, 0, 0] });
  g.add(suelo);

  /* Toldos. El único sitio de la página donde hay color libre, igual que las
     paletas de cliente: son las telas del mercado, no la interfaz. */
  const TELAS = [COLOR.forged, COLOR.forgedLo, COLOR.scaleHi, COLOR.forgedHi];
  const pantallas: Malla[] = [];

  for (let i = 0; i < 10; i++) {
    const fila = Math.floor(i / 5);
    const col = i % 5;
    const x = -7.2 + col * 3.6 + (fila ? 1.7 : 0);
    const z = -3 + fila * 5.6;

    const toldo = new THREE.Mesh(t.cono, t.mat(TELAS[i % 4], { rugosidad: 0.95 }));
    poner(toldo, { pos: [x, 1.05, z], esc: [3.0, 1.0, 3.0], rot: [0, Math.PI / 4, 0] });
    g.add(toldo);

    for (const [dx, dz] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ] as const) {
      const poste = new THREE.Mesh(t.caja, t.mat(COLOR.scale));
      poner(poste, { pos: [x + dx * 1.15, -0.25, z + dz * 1.15], esc: [0.1, 2.2, 0.1] });
      g.add(poste);
    }

    /* Mesón y cajas de fruta. */
    const meson = new THREE.Mesh(t.caja, t.mat(COLOR.scale));
    poner(meson, { pos: [x, 0.05, z - 0.5], esc: [2.5, 0.16, 1.2] });
    g.add(meson);
    for (let k = 0; k < 3; k++) {
      const huacal = new THREE.Mesh(t.caja, t.mat(k % 2 ? COLOR.forgedLo : COLOR.slag));
      poner(huacal, {
        pos: [x - 0.85 + k * 0.85, 0.35, z - 0.5],
        esc: [0.6, 0.45, 0.7],
        rot: [0, azar() * 0.4, 0],
      });
      g.add(huacal);
    }

    /* Vendedor con el celular en la mano. La pantalla es la reseña. */
    const cuerpo = new THREE.Mesh(
      t.capsula,
      t.mat([COLOR.smoke, COLOR.slag, COLOR.scaleHi][i % 3], { rugosidad: 1 }),
    );
    poner(cuerpo, { pos: [x + 0.7, 0.28, z + 0.9], esc: [0.42, 0.62, 0.42] });
    g.add(cuerpo);
    const cabeza = new THREE.Mesh(t.esfera, t.mat(COLOR.slag, { rugosidad: 1 }));
    poner(cabeza, { pos: [x + 0.7, 1.0, z + 0.9], esc: 0.42 });
    g.add(cabeza);

    const cel = new THREE.Mesh(
      t.plano,
      t.mat(COLOR.quenchLo, { brillo: 1.4, emision: COLOR.quench }),
    );
    poner(cel, {
      pos: [x + 1.05, 0.62, z + 1.25],
      esc: [0.3, 0.56, 1],
      rot: [-0.5, 0.3, 0],
    });
    pantallas.push(cel);
    g.add(cel);
  }

  /* Las motos de contraentrega, que es la señal de confianza número uno. */
  const motos: Grupo[] = [];
  for (let i = 0; i < 2; i++) {
    const m = new THREE.Group();
    const chasis = new THREE.Mesh(t.caja, t.mat(COLOR.heatLo, { rugosidad: 0.6 }));
    poner(chasis, { pos: [0, 0.1, 0], esc: [1.5, 0.3, 0.5] });
    m.add(chasis);
    /* El cajón del domicilio: templado, porque es la entrega cumplida. */
    const cajon = new THREE.Mesh(t.caja, t.mat(COLOR.forged, { rugosidad: 0.7 }));
    poner(cajon, { pos: [-0.55, 0.5, 0], esc: [0.66, 0.6, 0.62] });
    m.add(cajon);
    for (const dx of [-0.5, 0.5]) {
      const rueda = new THREE.Mesh(t.cilindro, t.mat(COLOR.void, { rugosidad: 0.9 }));
      poner(rueda, { pos: [dx, -0.15, 0], esc: [0.44, 0.14, 0.44], rot: [Math.PI / 2, 0, 0] });
      m.add(rueda);
    }
    const piloto = new THREE.Mesh(t.capsula, t.mat(COLOR.scaleHi, { rugosidad: 1 }));
    poner(piloto, { pos: [0.05, 0.62, 0], esc: [0.34, 0.42, 0.34] });
    m.add(piloto);
    m.position.set(-12 + i * 9, -1.1, 1.6 + i * 2.2);
    motos.push(m);
    g.add(m);
  }

  const sol = new THREE.PointLight(COLOR.ember, 42, 34, 2);
  sol.position.set(0, 7, 4);
  const relleno = new THREE.PointLight(COLOR.forgedHi, 18, 30, 2);
  relleno.position.set(-6, 3, 8);
  g.add(relleno);
  g.add(sol);

  return {
    grupo: g,
    animar(tiempo) {
      for (let i = 0; i < motos.length; i++) {
        const m = motos[i];
        /* Recorren la plaza y reaparecen: el reparto no para. */
        m.position.x = (((tiempo * 2.1 + i * 10) % 22) - 11);
        m.position.y = -1.1 + Math.sin(tiempo * 7 + i) * 0.03;
      }
      for (let i = 0; i < pantallas.length; i++) {
        const s = pantallas[i];
        const m = s.material as import("three").MeshStandardMaterial;
        m.emissiveIntensity = 1.15 + Math.sin(tiempo * 2.2 + i * 1.3) * 0.3;
      }
    },
  };
}

/* ---------------------------------------------------------------- */
/* 5 · LA BÓVEDA — temple frío, la escena más quieta                 */
/* ---------------------------------------------------------------- */

function boveda(t: Taller): Diorama {
  const { THREE } = t;
  const g = new THREE.Group();

  /* Cámara circular. Se ve por dentro, así que las caras van invertidas. */
  const paredGeo = new THREE.CylinderGeometry(9, 9, 9, 32, 1, true);
  const pared = new THREE.Mesh(
    paredGeo,
    new THREE.MeshStandardMaterial({
      color: COLOR.anvilHi,
      roughness: 0.95,
      flatShading: true,
      side: THREE.BackSide,
    }),
  );
  poner(pared, { pos: [0, 1.4, 0] });
  g.add(pared);

  const piso = new THREE.Mesh(t.cilindro, t.mat(COLOR.sunk, { rugosidad: 1 }));
  poner(piso, { pos: [0, -3, 0], esc: [18, 0.3, 18] });
  g.add(piso);

  /* Anillos de temple en el suelo: información, no decoración. */
  const anillos: Malla[] = [];
  for (let i = 0; i < 3; i++) {
    const a = new THREE.Mesh(
      t.toro,
      t.mat(COLOR.quench, { brillo: 1.2, transparente: 0.55 }),
    );
    poner(a, { pos: [0, -2.8, 0], esc: 2.2 + i * 2.1, rot: [-Math.PI / 2, 0, 0] });
    anillos.push(a);
    g.add(a);
  }

  /* La puerta acorazada, abierta. */
  const puerta = new THREE.Mesh(
    t.cilindro,
    t.mat(COLOR.forgedLo, { metalico: 0.3, rugosidad: 0.45, brillo: 0.18 }),
  );
  poner(puerta, { pos: [-7.2, -0.4, 4.6], esc: [5, 0.6, 5], rot: [Math.PI / 2, 0, 0.5] });
  g.add(puerta);
  const manija = new THREE.Mesh(t.toro, t.mat(COLOR.forged, { metalico: 0.3, rugosidad: 0.35, brillo: 0.4 }));
  poner(manija, { pos: [-7.0, -0.4, 4.6], esc: 1.5, rot: [0, 0.5, 0] });
  g.add(manija);

  /* Cinco sellos templados girando en corro. Sin una letra encima: no se
     simula ninguna certificación real, solo el lenguaje visual del sello. */
  const sellos: Grupo[] = [];
  for (let i = 0; i < 5; i++) {
    const s = new THREE.Group();
    const disco = new THREE.Mesh(
      t.cilindro,
      t.mat(COLOR.forged, { metalico: 0.3, rugosidad: 0.35, brillo: 0.32 }),
    );
    poner(disco, { esc: [1.9, 0.16, 1.9], rot: [Math.PI / 2, 0, 0] });
    s.add(disco);
    const aro = new THREE.Mesh(
      t.toro,
      t.mat(COLOR.forgedHi, { metalico: 0.3, rugosidad: 0.3, brillo: 0.5 }),
    );
    poner(aro, { esc: 0.82 });
    s.add(aro);
    /* Emblema abstracto: tres barras, sin ninguna lectura textual. */
    for (let k = 0; k < 3; k++) {
      const barra = new THREE.Mesh(t.caja, t.mat(COLOR.forgedHi, { metalico: 0.3, brillo: 0.45 }));
      poner(barra, { pos: [0, 0.36 - k * 0.36, 0.1], esc: [0.9 - k * 0.22, 0.13, 0.06] });
      s.add(barra);
    }
    const a = (i / 5) * Math.PI * 2;
    s.position.set(Math.cos(a) * 4.6, 0.2, Math.sin(a) * 4.6);
    sellos.push(s);
    g.add(s);
  }

  const temple = new THREE.PointLight(COLOR.quench, 46, 30, 2);
  temple.position.set(0, 2.5, 0);
  g.add(temple);
  const realce = new THREE.PointLight(COLOR.forgedHi, 26, 22, 2);
  realce.position.set(0, -1, 3);
  g.add(realce);

  return {
    grupo: g,
    animar(tiempo) {
      /* Todo gira despacio y al unísono. Después de la línea de ensamblaje,
         que algo esté casi quieto es lo que le da peso. */
      for (let i = 0; i < sellos.length; i++) {
        const s = sellos[i];
        const a = (i / 5) * Math.PI * 2 + tiempo * 0.14;
        s.position.set(Math.cos(a) * 4.6, 0.2 + Math.sin(tiempo * 0.7 + i) * 0.24, Math.sin(a) * 4.6);
        s.rotation.y = -a + Math.PI / 2;
      }
      for (let i = 0; i < anillos.length; i++) {
        const m = anillos[i].material as import("three").MeshStandardMaterial;
        m.emissiveIntensity = 0.85 + Math.sin(tiempo * 1.1 - i * 0.9) * 0.45;
      }
      temple.intensity = 42 + Math.sin(tiempo * 0.9) * 5;
    },
  };
}

/* ---------------------------------------------------------------- */
/* 6 · LA TIENDA ENCENDIDA — el resultado                            */
/* ---------------------------------------------------------------- */

function tienda(t: Taller): Diorama {
  const { THREE } = t;
  const g = new THREE.Group();

  const suelo = new THREE.Mesh(t.plano, t.mat(COLOR.anvil, { rugosidad: 1 }));
  poner(suelo, { pos: [0, -2.2, 0], esc: [34, 34, 1], rot: [-Math.PI / 2, 0, 0] });
  g.add(suelo);

  /* El celular como monolito: es la pantalla donde ocurre el negocio. */
  const marco = new THREE.Mesh(t.caja, t.mat(COLOR.anvilHi, { metalico: 0.3, rugosidad: 0.5 }));
  poner(marco, { pos: [0, 2.2, 0], esc: [5.4, 9.6, 0.5] });
  g.add(marco);
  const vidrio = new THREE.Mesh(
    t.plano,
    t.mat(COLOR.sunk, { brillo: 0.35, emision: COLOR.quenchLo }),
  );
  poner(vidrio, { pos: [0, 2.2, 0.27], esc: [4.9, 9.1, 1] });
  g.add(vidrio);

  /* La gráfica que sube. Barras templadas: ventas ya cerradas. */
  const barras: Malla[] = [];
  const ALTOS = [1.0, 1.5, 1.3, 2.1, 2.7, 3.4];
  for (let i = 0; i < 6; i++) {
    const b = new THREE.Mesh(
      t.caja,
      t.mat(COLOR.forged, { brillo: 0.5, emision: COLOR.forgedHi }),
    );
    poner(b, { pos: [-1.85 + i * 0.74, -0.5 + ALTOS[i] / 2, 0.32], esc: [0.5, ALTOS[i], 0.06] });
    barras.push(b);
    g.add(b);
  }
  /* Línea base de la gráfica, en temple: es el eje, o sea información. */
  const eje = new THREE.Mesh(t.caja, t.mat(COLOR.quench, { brillo: 1 }));
  poner(eje, { pos: [0, -0.56, 0.32], esc: [4.3, 0.05, 0.05] });
  g.add(eje);

  /* Notificaciones de pedido saliendo de la pantalla. */
  const avisos: Malla[] = [];
  for (let i = 0; i < 4; i++) {
    const a = new THREE.Mesh(
      t.caja,
      t.mat(COLOR.quench, { brillo: 1.3, transparente: 0.9 }),
    );
    poner(a, { pos: [2.6 + (i % 2) * 0.5, 3 + i * 1.5, 0.9], esc: [1.5, 0.42, 0.06] });
    avisos.push(a);
    g.add(a);
  }

  /* Los paquetes listos, con cinta templada. El trabajo terminado. */
  for (let i = 0; i < 7; i++) {
    const fila = Math.floor(i / 4);
    const col = i % 4;
    const x = -7.6 + col * 1.5;
    const y = -1.55 + fila * 1.2;
    const caja = new THREE.Mesh(t.caja, t.mat(COLOR.scaleHi, { rugosidad: 0.95 }));
    poner(caja, { pos: [x, y, 1.2], esc: [1.25, 1.1, 1.1], rot: [0, 0.12 * (i % 3), 0] });
    g.add(caja);
    const cinta = new THREE.Mesh(t.caja, t.mat(COLOR.forged, { brillo: 0.3 }));
    poner(cinta, { pos: [x, y, 1.22], esc: [0.2, 1.12, 1.13], rot: [0, 0.12 * (i % 3), 0] });
    g.add(cinta);
  }

  /* La puerta de la tienda, encendida. Es el único --heat de la escena. */
  const puerta = new THREE.Mesh(
    t.plano,
    t.mat(COLOR.heat, { brillo: 1.5, transparente: 0.85 }),
  );
  poner(puerta, { pos: [7.2, 0.2, -3.2], esc: [2.7, 4.6, 1], rot: [0, -0.6, 0] });
  g.add(puerta);
  for (const dy of [2.9, -2.1]) {
    const dintel = new THREE.Mesh(t.caja, t.mat(COLOR.scale));
    poner(dintel, { pos: [7.2, 0.2 + dy, -3.2], esc: [3.1, 0.28, 0.6], rot: [0, -0.6, 0] });
    g.add(dintel);
  }

  const calida = new THREE.PointLight(COLOR.heat, 40, 30, 2);
  calida.position.set(7.5, 1, 1.5);
  g.add(calida);
  const fria = new THREE.PointLight(COLOR.quench, 30, 28, 2);
  fria.position.set(0, 3, 4);
  g.add(fria);

  return {
    grupo: g,
    animar(tiempo, p) {
      /* Las barras crecen con el SCROLL, no con el reloj: el visitante es
         quien hace subir las ventas al avanzar por la escena. */
      for (let i = 0; i < barras.length; i++) {
        const b = barras[i];
        /* El escalonado se cierra antes del 25% del tramo. Si se demorara
           más, el visitante que pausa a leer vería una gráfica a medio
           crecer, que se lee como ventas CAYENDO: justo lo contrario de lo
           que dice la escena. */
        const listo = Math.max(0, Math.min(1, (p - i * 0.022) * 9));
        const suave = listo * listo * (3 - 2 * listo);
        const alto = Math.max(0.04, ALTOS[i] * suave);
        b.scale.y = alto;
        b.position.y = -0.5 + alto / 2;
      }
      for (let i = 0; i < avisos.length; i++) {
        const a = avisos[i];
        const ciclo = (tiempo * 0.42 + i * 0.25) % 1;
        a.position.y = 1.2 + ciclo * 4.0;
        a.position.z = 0.9 + ciclo * 1.1;
        const m = a.material as import("three").MeshStandardMaterial;
        /* Entran, suben y se desvanecen. */
        m.opacity = Math.sin(ciclo * Math.PI) * 0.9;
      }
      calida.intensity = 37 + Math.sin(tiempo * 2.6) * 4;
    },
  };
}

/* ---------------------------------------------------------------- */

const CONSTRUCTORES: Record<string, (t: Taller) => Diorama> = {
  caos,
  forja,
  linea,
  mercado,
  boveda,
  tienda,
};

/** Monta el diorama de una escena y lo deja en su sitio del mundo. */
export function construirDiorama(taller: Taller, escena: Escena): Diorama {
  const d = CONSTRUCTORES[escena.id](taller);
  d.grupo.position.set(escena.centro[0], escena.centro[1], escena.centro[2]);
  return d;
}
