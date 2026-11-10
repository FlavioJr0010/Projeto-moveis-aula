"use client";
import { create } from "zustand";
import { addItem, moveItem, nudgeItem, removeItem, rotateItem, type OpResult } from "./ops";
import type { Plan, Room } from "./types";

const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2));

interface State {
  plan: Plan | null;
  selectedId: string | null;
  notice: string | null; // última mensagem de erro/aviso de uma ação
  newPlan: (room: Room, nome?: string) => void;
  load: (p: Plan) => void;
  close: () => void;
  rename: (nome: string) => void;
  add: (slug: string) => boolean;
  moveTo: (id: string, x: number, y: number) => boolean;
  nudge: (id: string, dx: number, dy: number) => void;
  rotate: (id: string) => void;
  remove: (id: string) => void;
  select: (id: string | null) => void;
  clearNotice: () => void;
}

export const usePlanner = create<State>((set, get) => {
  const apply = (fn: (p: Plan) => OpResult, selectId?: (p: Plan) => string | null): boolean => {
    const cur = get().plan;
    if (!cur) return false;
    const { plan, error } = fn(cur);
    set({ plan, notice: error ?? null, ...(selectId && !error ? { selectedId: selectId(plan) } : {}) });
    return !error;
  };
  return {
    plan: null, selectedId: null, notice: null,
    newPlan: (room, nome) => {
      const now = new Date().toISOString();
      set({ plan: { id: uid(), version: 1, nome: nome?.trim() || "Meu ambiente", room, items: [], createdAt: now, updatedAt: now }, selectedId: null, notice: null });
    },
    load: (p) => set({ plan: p, selectedId: null, notice: null }),
    close: () => set({ plan: null, selectedId: null, notice: null }),
    rename: (nome) => set((s) => (s.plan ? { plan: { ...s.plan, nome: nome.slice(0, 80) } } : s)),
    add: (slug) => { const id = uid(); return apply((p) => addItem(p, slug, id), () => id); },
    moveTo: (id, x, y) => apply((p) => moveItem(p, id, x, y)),
    nudge: (id, dx, dy) => { apply((p) => nudgeItem(p, id, dx, dy)); },
    rotate: (id) => { apply((p) => rotateItem(p, id)); },
    remove: (id) => set((s) => (s.plan ? { plan: removeItem(s.plan, id), selectedId: s.selectedId === id ? null : s.selectedId, notice: null } : s)),
    select: (id) => set({ selectedId: id }),
    clearNotice: () => set({ notice: null }),
  };
});
