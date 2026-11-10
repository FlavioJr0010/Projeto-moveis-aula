import type { Opening, Rect, Room, Wall } from "./types";

/** Medidas de referência (cm). */
export const DOOR_H = 210;
export const WINDOW_SILL = 100;
export const WINDOW_H = 120;
export const WALL_T = 12; // espessura desenhada das paredes (fora da área útil)
export const OPENING_MARGIN = 10; // distância mínima do vão até o canto
export const OPENING_GAP = 10; // distância mínima entre dois vãos na mesma parede

export const WIDTHS = { porta: [70, 80, 90, 120], janela: [80, 100, 120, 150, 200] } as const;
export const DEFAULT_W = { porta: 80, janela: 120 } as const;

export const WALL_LABEL: Record<Wall, string> = { n: "Parede de cima", s: "Parede de baixo", o: "Parede da esquerda", l: "Parede da direita" };
export const WALLS: Wall[] = ["n", "s", "o", "l"];

export interface WallFrame { origin: [number, number]; dir: [number, number]; inward: [number, number]; len: number }

/** Geometria de cada parede: canto de origem, direção ao longo dela e normal apontando para dentro. */
export function wallFrame(wall: Wall, room: Pick<Room, "w" | "d">): WallFrame {
  switch (wall) {
    case "n": return { origin: [0, 0], dir: [1, 0], inward: [0, 1], len: room.w };
    case "s": return { origin: [0, room.d], dir: [1, 0], inward: [0, -1], len: room.w };
    case "o": return { origin: [0, 0], dir: [0, 1], inward: [1, 0], len: room.d };
    case "l": return { origin: [room.w, 0], dir: [0, 1], inward: [-1, 0], len: room.d };
  }
}

/** Ponto sobre a linha da parede, `along` cm depois da origem. */
export function pointOn(f: WallFrame, along: number): [number, number] {
  return [f.origin[0] + f.dir[0] * along, f.origin[1] + f.dir[1] * along];
}

export const clampAt = (o: Pick<Opening, "w">, at: number, len: number) => {
  const lo = o.w / 2 + OPENING_MARGIN, hi = len - o.w / 2 - OPENING_MARGIN;
  return hi < lo ? len / 2 : Math.min(Math.max(at, lo), hi);
};

/** O vão cabe nesta parede (com margem nos cantos)? */
export const openingFits = (w: number, wall: Wall, room: Room) => w + 2 * OPENING_MARGIN <= wallFrame(wall, room).len;

/** Dois vãos da mesma parede se tocam (respeitando a folga mínima)? */
export const openingsClash = (a: Pick<Opening, "wall" | "at" | "w">, b: Pick<Opening, "wall" | "at" | "w">) =>
  a.wall === b.wall && Math.abs(a.at - b.at) < (a.w + b.w) / 2 + OPENING_GAP;

/** Retângulo (centrado) que vai de `from` a `to` ao longo da parede e `depth` cm para dentro do ambiente. */
function strip(wall: Wall, room: Room, from: number, to: number, depth: number): Rect {
  const f = wallFrame(wall, room);
  const a = pointOn(f, from), b = pointOn(f, to);
  const xs = [a[0], b[0], a[0] + f.inward[0] * depth, b[0] + f.inward[0] * depth];
  const ys = [a[1], b[1], a[1] + f.inward[1] * depth, b[1] + f.inward[1] * depth];
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: x1 - x0, d: y1 - y0 };
}

/** Área que a porta varre ao abrir (quadrado w × w junto ao vão). */
export const swingRect = (o: Opening, room: Room): Rect => strip(o.wall, room, o.at - o.w / 2, o.at + o.w / 2, o.w);

/** Faixa junto à janela (30 cm): móvel alto ali encobre a janela. */
export const windowStrip = (o: Opening, room: Room): Rect => strip(o.wall, room, o.at - o.w / 2, o.at + o.w / 2, 30);

export interface DoorGeometry {
  hinge: [number, number];
  closedEnd: [number, number]; // ponta da folha fechada (no vão)
  openEnd: [number, number];   // ponta da folha aberta a 90°
  /** arco em coordenadas de canvas (y para baixo) */
  startAngle: number; endAngle: number; anticlockwise: boolean;
}

/** Folha e arco de abertura da porta, para desenhar na planta. */
export function doorGeometry(o: Opening, room: Room): DoorGeometry {
  const f = wallFrame(o.wall, room);
  const a = pointOn(f, o.at - o.w / 2), b = pointOn(f, o.at + o.w / 2);
  const hinge = o.flip ? b : a, closedEnd = o.flip ? a : b;
  const openEnd: [number, number] = [hinge[0] + f.inward[0] * o.w, hinge[1] + f.inward[1] * o.w];
  const u = [closedEnd[0] - hinge[0], closedEnd[1] - hinge[1]], v = f.inward;
  const cross = u[0] * v[1] - u[1] * v[0];
  return { hinge, closedEnd, openEnd, startAngle: Math.atan2(u[1], u[0]), endAngle: Math.atan2(v[1], v[0]), anticlockwise: cross < 0 };
}

/** Escolhe a parede/posição livre mais próxima do meio. Portas preferem a base; janelas, o topo. */
export function findOpeningSpot(kind: Opening["kind"], w: number, room: Room, existing: Opening[]): { wall: Wall; at: number } | null {
  const order: Wall[] = kind === "porta" ? ["s", "o", "l", "n"] : ["n", "l", "o", "s"];
  for (const wall of order) {
    if (!openingFits(w, wall, room)) continue;
    const f = wallFrame(wall, room);
    const mid = f.len / 2;
    const cands: number[] = [];
    for (let at = w / 2 + OPENING_MARGIN; at <= f.len - w / 2 - OPENING_MARGIN; at += 10) cands.push(at);
    cands.sort((x, y) => Math.abs(x - mid) - Math.abs(y - mid));
    const at = cands.find((c) => !existing.some((e) => openingsClash({ wall, at: c, w }, e)));
    if (at !== undefined) return { wall, at };
  }
  return null;
}

/** Projeta um ponto da planta na parede mais próxima: usado ao arrastar porta/janela. */
export function nearestWall(x: number, y: number, room: Room): { wall: Wall; at: number } {
  const dists: [Wall, number][] = [["n", y], ["s", room.d - y], ["o", x], ["l", room.w - x]];
  const wall = dists.sort((p, q) => p[1] - q[1])[0][0];
  const f = wallFrame(wall, room);
  return { wall, at: (x - f.origin[0]) * f.dir[0] + (y - f.origin[1]) * f.dir[1] };
}
