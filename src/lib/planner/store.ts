"use client";
import { create } from "zustand";
import { newId } from "./ids";
import { emptyHistory, record, redo as redoH, undo as undoH, type History } from "./history";
import { addItem, addOpening, defaultOpenings, flipOpening, moveItem, moveOpening, nudgeItem, removeItem, removeOpening, resizeOpening, rotateItem, type OpResult } from "./ops";
import type { Plan, Room, Wall } from "./types";

const uid = newId;

interface State {
  history: History;
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
  addOpening: (kind: "porta" | "janela") => boolean;
  moveOpening: (id: string, wall: Wall, at: number) => boolean;
  resizeOpening: (id: string, w: number) => boolean;
  flipOpening: (id: string) => void;
  removeOpening: (id: string) => void;
  select: (id: string | null) => void;
  clearNotice: () => void;
  undo: () => void;
  redo: () => void;
}

export const usePlanner = create<State>((set, get) => {
  const apply = (fn: (p: Plan) => OpResult, selectId?: (p: Plan) => string | null): boolean => {
    const cur = get().plan;
    if (!cur) return false;
    const { plan, error } = fn(cur);
    set((s) => ({
      plan, notice: error ?? null,
      history: plan !== cur ? record(s.history, cur) : s.history, // só entra no histórico o que realmente mudou
      ...(selectId && !error ? { selectedId: selectId(plan) } : {}),
    }));
    return !error;
  };
  return {
    history: emptyHistory(), plan: null, selectedId: null, notice: null,
    newPlan: (room, nome) => {
      const now = new Date().toISOString();
      set({ plan: { id: uid(), version: 1, nome: nome?.trim() || "Meu ambiente", room, items: [], openings: defaultOpenings(room, uid), createdAt: now, updatedAt: now }, selectedId: null, notice: null, history: emptyHistory() });
    },
    load: (p) => set({ plan: p, selectedId: null, notice: null, history: emptyHistory() }),
    close: () => set({ plan: null, selectedId: null, notice: null, history: emptyHistory() }),
    rename: (nome) => set((s) => (s.plan ? { plan: { ...s.plan, nome: nome.slice(0, 80) } } : s)),
    add: (slug) => { const id = uid(); return apply((p) => addItem(p, slug, id), () => id); },
    moveTo: (id, x, y) => apply((p) => moveItem(p, id, x, y)),
    nudge: (id, dx, dy) => { apply((p) => nudgeItem(p, id, dx, dy)); },
    rotate: (id) => { apply((p) => rotateItem(p, id)); },
    remove: (id) => set((s) => (s.plan ? { plan: removeItem(s.plan, id), history: record(s.history, s.plan), selectedId: s.selectedId === id ? null : s.selectedId, notice: null } : s)),
    addOpening: (kind) => { const id = uid(); return apply((p) => addOpening(p, kind, id)); },
    moveOpening: (id, wall, at) => apply((p) => moveOpening(p, id, wall, at)),
    resizeOpening: (id, w) => apply((p) => resizeOpening(p, id, w)),
    flipOpening: (id) => { apply((p) => ({ plan: flipOpening(p, id) })); },
    removeOpening: (id) => { apply((p) => ({ plan: removeOpening(p, id) })); },
    select: (id) => set({ selectedId: id }),
    clearNotice: () => set({ notice: null }),
    undo: () => set((s) => {
      const r = s.plan && undoH(s.history, s.plan);
      return r ? { plan: r.plan, history: r.history, notice: null, selectedId: r.plan.items.some((i) => i.id === s.selectedId) ? s.selectedId : null } : s;
    }),
    redo: () => set((s) => {
      const r = s.plan && redoH(s.history, s.plan);
      return r ? { plan: r.plan, history: r.history, notice: null, selectedId: r.plan.items.some((i) => i.id === s.selectedId) ? s.selectedId : null } : s;
    }),
  };
});
