import { bySlug, type Product } from "@/data/products";
import { clampCenter, collides, findFreeSpot, fitsRoom, inside, nextRot, rectOf, snap, snapToWalls } from "./geometry";
import type { PlacedItem, Plan, Rect } from "./types";

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
  const spot = findFreeSpot(p.dims, plan.room, othersRects(plan, null, lookup), 10, p.planner?.clearance?.frente ?? 0);
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
