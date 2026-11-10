import { bySlug } from "@/data/products";
import { rectOf, collides } from "./geometry";
import type { Plan, Rect } from "./types";

/**
 * Decoração automática (tapete e plantas), calculada só a partir da planta.
 * É a mesma para o 2D e para o 3D, para os dois mostrarem o mesmo ambiente. Não conta no orçamento nem na validação.
 */
export interface Rug { x: number; y: number; w: number; d: number; color: string }
export interface Plant { x: number; y: number; r: number; h: number }
export interface Decor { rug: Rug | null; plants: Plant[] }

const RUG_COLOR: Record<string, string> = { sala: "#b8a58a", quarto: "#c9bfae", jantar: "#a99880", "home-office": "#9aa3a0", escritorio: "#9aa3a0", recepcao: "#a8a29a", "sala-reuniao": "#9aa3a0" };

export function decorFor(plan: Pick<Plan, "room" | "items" | "openings">): Decor {
  const { room } = plan;
  const placed = plan.items.flatMap((it) => { const p = bySlug(it.slug); return p ? [{ it, p, r: rectOf(it, p.dims) }] : []; });

  // tapete: sob o conjunto de sofás/camas/mesas de jantar (o maior grupo), com uma margem
  let rug: Rug | null = null;
  const anchors = placed.filter(({ p }) => p.category === "sofas" || p.category === "camas" || (p.category === "mesas" && p.dims.w >= 100 && p.dims.h > 60));
  if (anchors.length && room.tipo !== "cozinha" && room.tipo !== "loja") {
    const main = anchors.reduce((a, b) => (b.r.w * b.r.d > a.r.w * a.r.d ? b : a));
    const bed = main.p.category === "camas", tbl = main.p.category === "mesas";
    const near = placed.filter(({ p, r }) => (p.category === "poltronas" || p.category === "cadeiras" || p.category === "mesas" || p === main.p) && Math.hypot(r.x - main.r.x, r.y - main.r.y) < 260);
    const xs = near.flatMap(({ r }) => [r.x - r.w / 2, r.x + r.w / 2]), ys = near.flatMap(({ r }) => [r.y - r.d / 2, r.y + r.d / 2]);
    const pad = tbl ? 20 : bed ? 45 : 25;
    let x0 = Math.min(...xs) - pad, x1 = Math.max(...xs) + pad, y0 = Math.min(...ys) - pad, y1 = Math.max(...ys) + pad;
    if (bed) { x0 = main.r.x - main.r.w / 2 - 50; x1 = main.r.x + main.r.w / 2 + 50; y0 = main.r.y - main.r.d / 2 + 60; y1 = main.r.y + main.r.d / 2 + 55; }
    x0 = Math.max(x0, 8); y0 = Math.max(y0, 8); x1 = Math.min(x1, room.w - 8); y1 = Math.min(y1, room.d - 8);
    if (x1 - x0 >= 90 && y1 - y0 >= 90) rug = { x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: x1 - x0, d: y1 - y0, color: RUG_COLOR[room.tipo] ?? "#b8a58a" };
  }

  // plantas: em cantos livres, longe de móveis e de portas
  const plants: Plant[] = [];
  if (room.w >= 220 && room.d >= 220) {
    const r = 22, margin = 6;
    const spots: [number, number][] = [[room.w - r - margin, room.d - r - margin], [r + margin, room.d - r - margin], [room.w - r - margin, r + margin], [r + margin, r + margin]];
    const blockers: Rect[] = placed.map(({ r: q }) => ({ ...q, w: q.w + 30, d: q.d + 30 }));
    for (const o of plan.openings ?? []) {
      const horiz = o.wall === "n" || o.wall === "s";
      const c = horiz ? [o.at, o.wall === "n" ? 0 : room.d] : [o.wall === "o" ? 0 : room.w, o.at];
      const reach = o.kind === "porta" ? o.w + 20 : 10;
      blockers.push({ x: c[0], y: c[1], w: horiz ? o.w + 20 : reach * 2, d: horiz ? reach * 2 : o.w + 20 });
    }
    for (const [x, y] of spots) {
      if (plants.length >= (room.w * room.d > 120000 ? 2 : 1)) break;
      if (!collides({ x, y, w: r * 2, d: r * 2 }, blockers)) plants.push({ x, y, r, h: 90 + ((x + y) % 25) });
    }
  }
  return { rug, plants };
}
