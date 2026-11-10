import type { Plan } from "./types";

/** Histórico de desfazer/refazer (puro e testável). Guarda planos inteiros: são pequenos. */
export interface History { past: Plan[]; future: Plan[] }
export const LIMIT = 50;
export const emptyHistory = (): History => ({ past: [], future: [] });

/** Registra `prev` como estado anterior a uma mudança. Uma nova mudança invalida o "refazer". */
export const record = (h: History, prev: Plan): History => ({ past: [...h.past, prev].slice(-LIMIT), future: [] });

export function undo(h: History, current: Plan): { plan: Plan; history: History } | null {
  const prev = h.past[h.past.length - 1];
  return prev ? { plan: prev, history: { past: h.past.slice(0, -1), future: [current, ...h.future] } } : null;
}

export function redo(h: History, current: Plan): { plan: Plan; history: History } | null {
  const next = h.future[0];
  return next ? { plan: next, history: { past: [...h.past, current], future: h.future.slice(1) } } : null;
}
