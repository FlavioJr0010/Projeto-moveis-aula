import { bySlug, type Product } from "@/data/products";
import { clampCenter, collides, findFreeSpot, fitsRoom, inside, nextRot, rectOf, snap, snapToWalls } from "./geometry";
import { clampAt, DEFAULT_W, findOpeningSpot, openingFits, openingsClash, swingRect, wallFrame, WALL_LABEL } from "./openings";
import type { Opening, PlacedItem, Plan, Rect, Room, Wall } from "./types";

type Lookup = (slug: string) => Pick<Product, "name" | "dims"> & Partial<Pick<Product, "planner">> | undefined;
export interface OpResult { plan: Plan; error?: string }

const touch = (plan: Plan, items: PlacedItem[]): Plan => ({ ...plan, items, updatedAt: new Date().toISOString() });

function othersRects(plan: Plan, exceptId: string | null, lookup: Lookup): Rect[] {
  return plan.items.flatMap((it) => {
    if (it.id === exceptId) return [];
    const p = lookup(it.slug);
    return p ? [rectOf(it, p.dims)] : [];
  });
}

/** Adiciona na posição livre mais próxima do centro. Erra se não couber ou não houver espaço. */
export function addItem(plan: Plan, slug: string, id: string, lookup: Lookup = bySlug): OpResult {
  const p = lookup(slug);
  if (!p) return { plan, error: "Produto não encontrado." };
  if (!fitsRoom(p.dims, plan.room)) {
    return { plan, error: `${p.name} não cabe neste ambiente (${p.dims.w}×${p.dims.d} cm em ${plan.room.w}×${plan.room.d} cm).` };
  }
  const frente = p.planner?.clearance?.frente ?? 0;
  const doors = (plan.openings ?? []).filter((o) => o.kind === "porta").map((o) => swingRect(o, plan.room));
  const others = othersRects(plan, null, lookup);
  // primeiro tenta não invadir o giro das portas; se não houver jeito, aceita (o aviso de porta cobre depois)
  const spot = findFreeSpot(p.dims, plan.room, [...others, ...doors], 10, frente) ?? findFreeSpot(p.dims, plan.room, others, 10, frente);
  if (!spot) return { plan, error: `Não há espaço livre para ${p.name}. Mova ou remova algum móvel.` };
  return { plan: touch(plan, [...plan.items, { id, slug, ...spot }]) };
}

/** Move o centro para (x, y): mantém dentro das paredes, alinha na grade/parede e recusa sobreposição. */
export function moveItem(plan: Plan, id: string, x: number, y: number, lookup: Lookup = bySlug): OpResult {
  const it = plan.items.find((i) => i.id === id);
  const p = it && lookup(it.slug);
  if (!it || !p) return { plan };
  const base = rectOf({ x: snap(x), y: snap(y), rot: it.rot }, p.dims);
  const flush = snapToWalls(base, plan.room);
  const pos = clampCenter({ ...base, ...flush }, plan.room);
  const rect = { ...base, ...pos };
  if (collides(rect, othersRects(plan, id, lookup))) return { plan, error: "Esse espaço já está ocupado por outro móvel." };
  if (pos.x === it.x && pos.y === it.y) return { plan };
  return { plan: touch(plan, plan.items.map((i) => (i.id === id ? { ...i, ...pos } : i))) };
}

export const nudgeItem = (plan: Plan, id: string, dx: number, dy: number, lookup: Lookup = bySlug): OpResult => {
  const it = plan.items.find((i) => i.id === id);
  return it ? moveItem(plan, id, it.x + dx, it.y + dy, lookup) : { plan };
};

/** Gira 90°. Se o novo formato bater em algo ou passar das paredes, recusa. */
export function rotateItem(plan: Plan, id: string, lookup: Lookup = bySlug): OpResult {
  const it = plan.items.find((i) => i.id === id);
  const p = it && lookup(it.slug);
  if (!it || !p) return { plan };
  const rot = nextRot(it.rot);
  const rect0 = rectOf({ x: it.x, y: it.y, rot }, p.dims);
  const pos = clampCenter(rect0, plan.room);
  const rect = { ...rect0, ...pos };
  if (!inside(rect, plan.room)) return { plan, error: "Girado, o móvel não cabe nesta parede." };
  if (collides(rect, othersRects(plan, id, lookup))) return { plan, error: "Sem espaço para girar aqui. Afaste os móveis ao redor." };
  return { plan: touch(plan, plan.items.map((i) => (i.id === id ? { ...i, ...pos, rot } : i))) };
}

export const removeItem = (plan: Plan, id: string): Plan => touch(plan, plan.items.filter((i) => i.id !== id));

/** Porta e janela iniciais de um ambiente novo (a pessoa ajusta ou remove depois). */
export function defaultOpenings(room: Room, newId: () => string): Opening[] {
  const out: Opening[] = [];
  const door = findOpeningSpot("porta", DEFAULT_W.porta, room, out);
  if (door) out.push({ id: newId(), kind: "porta", w: DEFAULT_W.porta, ...door });
  const win = findOpeningSpot("janela", DEFAULT_W.janela, room, out);
  if (win) out.push({ id: newId(), kind: "janela", w: DEFAULT_W.janela, ...win });
  return out;
}

const withOpenings = (plan: Plan, openings: Opening[]): Plan => ({ ...plan, openings, updatedAt: new Date().toISOString() });

export function addOpening(plan: Plan, kind: Opening["kind"], id: string): OpResult {
  const list = plan.openings ?? [];
  const w = DEFAULT_W[kind];
  const spot = findOpeningSpot(kind, w, plan.room, list);
  if (!spot) return { plan, error: `Não há parede livre para ${kind === "porta" ? "mais uma porta" : "mais uma janela"}.` };
  return { plan: withOpenings(plan, [...list, { id, kind, w, ...spot }]) };
}

/** Move o vão para `wall`/`at`, mantendo-o dentro da parede e longe de outros vãos. */
export function moveOpening(plan: Plan, id: string, wall: Wall, at: number): OpResult {
  const list = plan.openings ?? [];
  const o = list.find((x) => x.id === id);
  if (!o) return { plan };
  if (!openingFits(o.w, wall, plan.room)) return { plan, error: `O vão de ${o.w} cm não cabe na ${WALL_LABEL[wall].toLowerCase()}.` };
  const moved = { ...o, wall, at: Math.round(clampAt(o, at, wallFrame(wall, plan.room).len)) };
  if (list.some((x) => x.id !== id && openingsClash(moved, x))) return { plan, error: "Já existe uma porta ou janela neste trecho da parede." };
  if (moved.wall === o.wall && moved.at === o.at) return { plan };
  return { plan: withOpenings(plan, list.map((x) => (x.id === id ? moved : x))) };
}

export function resizeOpening(plan: Plan, id: string, w: number): OpResult {
  const list = plan.openings ?? [];
  const o = list.find((x) => x.id === id);
  if (!o || o.w === w) return { plan };
  if (!openingFits(w, o.wall, plan.room)) return { plan, error: `${w} cm não cabe nesta parede.` };
  const resized = { ...o, w, at: Math.round(clampAt({ w }, o.at, wallFrame(o.wall, plan.room).len)) };
  if (list.some((x) => x.id !== id && openingsClash(resized, x))) return { plan, error: "Com essa largura o vão encosta em outro. Afaste-o primeiro." };
  return { plan: withOpenings(plan, list.map((x) => (x.id === id ? resized : x))) };
}

export const flipOpening = (plan: Plan, id: string): Plan =>
  withOpenings(plan, (plan.openings ?? []).map((x) => (x.id === id && x.kind === "porta" ? { ...x, flip: !x.flip } : x)));

export const removeOpening = (plan: Plan, id: string): Plan => withOpenings(plan, (plan.openings ?? []).filter((x) => x.id !== id));
