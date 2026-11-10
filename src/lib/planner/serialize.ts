import { bySlug, ambientesList } from "@/data/products";
import { ROOM_MAX, ROOM_MIN } from "./geometry";
import type { Plan, PlacedItem, Rot } from "./types";

const ROTS: Rot[] = [0, 90, 180, 270];
const num = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** Aceita só planos bem formados (o localStorage pode estar corrompido ou ser de versão antiga). */
export function sanitizePlan(raw: unknown): Plan | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const room = r.room as Record<string, unknown> | undefined;
  if (r.version !== 1 || typeof r.id !== "string" || !room) return null;
  if (!num(room.w) || !num(room.d) || room.w < ROOM_MIN || room.d < ROOM_MIN || room.w > ROOM_MAX || room.d > ROOM_MAX) return null;
  if (!ambientesList.some((a) => a.slug === room.tipo)) return null;
  const items: PlacedItem[] = (Array.isArray(r.items) ? r.items : []).flatMap((i: unknown) => {
    const it = i as Partial<PlacedItem> | null;
    if (!it || typeof it.id !== "string" || typeof it.slug !== "string" || !bySlug(it.slug)) return [];
    if (!num(it.x) || !num(it.y) || !ROTS.includes(it.rot as Rot)) return [];
    return [{ id: it.id, slug: it.slug, x: it.x, y: it.y, rot: it.rot as Rot }];
  });
  return {
    id: r.id, version: 1,
    nome: typeof r.nome === "string" ? r.nome.slice(0, 80) : "Meu ambiente",
    room: { tipo: room.tipo as Plan["room"]["tipo"], w: room.w, d: room.d, ...(num(room.h) ? { h: room.h } : {}) },
    items,
    createdAt: typeof r.createdAt === "string" ? r.createdAt : new Date().toISOString(),
    updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : new Date().toISOString(),
  };
}
