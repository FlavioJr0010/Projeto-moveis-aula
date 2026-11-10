import type { Dims, PlacedItem, Rect, Room, Rot } from "./types";

/** Tolerância (cm): móveis encostados (lado a lado ou na parede) NÃO contam como colisão. */
export const EPS = 0.01;

export const ROOM_MIN = 100;
export const ROOM_MAX = 3000;

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

/** Em 90° e 270° largura e profundidade trocam de eixo. */
export function footprint(dims: Dims, rot: Rot): { w: number; d: number } {
  return rot === 90 || rot === 270 ? { w: dims.d, d: dims.w } : { w: dims.w, d: dims.d };
}

export const rectOf = (item: Pick<PlacedItem, "x" | "y" | "rot">, dims: Dims): Rect => ({ x: item.x, y: item.y, ...footprint(dims, item.rot) });

export const overlaps = (a: Rect, b: Rect) =>
  Math.abs(a.x - b.x) < (a.w + b.w) / 2 - EPS && Math.abs(a.y - b.y) < (a.d + b.d) / 2 - EPS;

export const inside = (r: Rect, room: Room) =>
  r.x - r.w / 2 >= -EPS && r.y - r.d / 2 >= -EPS && r.x + r.w / 2 <= room.w + EPS && r.y + r.d / 2 <= room.d + EPS;

/** O móvel cabe no ambiente em alguma orientação (ignora outros móveis)? */
export const fitsRoom = (dims: Dims, room: Room) =>
  (dims.w <= room.w && dims.d <= room.d) || (dims.d <= room.w && dims.w <= room.d);

/** Mantém o móvel dentro das paredes. Se for maior que o ambiente, centraliza. */
export function clampCenter(r: Rect, room: Room): { x: number; y: number } {
  const x = r.w >= room.w ? room.w / 2 : clamp(r.x, r.w / 2, room.w - r.w / 2);
  const y = r.d >= room.d ? room.d / 2 : clamp(r.y, r.d / 2, room.d - r.d / 2);
  return { x, y };
}

export const snap = (v: number, step = 5) => Math.round(v / step) * step;

/** Gruda o móvel na parede quando ele está a até `threshold` cm dela. */
export function snapToWalls(r: Rect, room: Room, threshold = 12): { x: number; y: number } {
  let { x, y } = r;
  if (Math.abs(x - r.w / 2) <= threshold) x = r.w / 2;
  else if (Math.abs(room.w - (x + r.w / 2)) <= threshold) x = room.w - r.w / 2;
  if (Math.abs(y - r.d / 2) <= threshold) y = r.d / 2;
  else if (Math.abs(room.d - (y + r.d / 2)) <= threshold) y = room.d - r.d / 2;
  return { x, y };
}

/** Colide com algum retângulo da lista? */
export const collides = (r: Rect, others: Rect[]) => others.some((o) => overlaps(r, o));

/**
 * Procura uma posição livre para um móvel novo (tenta 0° e depois 90°).
 * Preferência: ENCOSTADO EM UMA PAREDE (como se mobilia de verdade, o que deixa o centro livre para circulação);
 * entre as posições encostadas, a mais próxima do centro da parede. Retorna null se não houver espaço
 * (é daí que sai o aviso "não cabe").
 */
export function findFreeSpot(dims: Dims, room: Room, others: Rect[], step = 10): { x: number; y: number; rot: Rot } | null {
  let best: { x: number; y: number; rot: Rot; cost: number } | null = null;
  const cx = room.w / 2, cy = room.d / 2;
  for (const rot of [0, 90] as Rot[]) {
    const f = footprint(dims, rot);
    if (f.w > room.w || f.d > room.d) continue;
    const xs = axis(f.w / 2, room.w - f.w / 2, step), ys = axis(f.d / 2, room.d - f.d / 2, step);
    for (const y of ys) for (const x of xs) {
      const wallGap = Math.min(x - f.w / 2, room.w - (x + f.w / 2), y - f.d / 2, room.d - (y + f.d / 2));
      const cost = wallGap * 10 + Math.hypot(x - cx, y - cy); // parede pesa mais que o centro
      if (best && cost >= best.cost) continue;
      if (!collides({ x, y, ...f }, others)) best = { x, y, rot, cost };
    }
  }
  return best && { x: best.x, y: best.y, rot: best.rot };
}

function axis(from: number, to: number, step: number): number[] {
  const out: number[] = [];
  for (let v = from; v < to; v += step) out.push(v);
  out.push(to); // garante o encosto na parede oposta
  return out;
}

export const nextRot = (r: Rot): Rot => ((r + 90) % 360) as Rot;

/** Valida medidas informadas pelo usuário (cm). */
export function validRoomSize(w: number, d: number): string | null {
  if (!Number.isFinite(w) || !Number.isFinite(d)) return "Informe largura e profundidade.";
  if (w < ROOM_MIN || d < ROOM_MIN) return `As medidas precisam ter pelo menos ${ROOM_MIN} cm.`;
  if (w > ROOM_MAX || d > ROOM_MAX) return `As medidas podem ter no máximo ${ROOM_MAX} cm (${ROOM_MAX / 100} m).`;
  return null;
}
