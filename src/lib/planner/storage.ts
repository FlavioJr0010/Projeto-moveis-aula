import { sanitizePlan } from "./serialize";
import type { Plan } from "./types";

const CURRENT = "casaraiz:planner:current:v1";
const PROJECTS = "casaraiz:planner:projects:v1";

const read = (k: string): unknown => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } };
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };

export const loadCurrent = (): Plan | null => sanitizePlan(read(CURRENT));
export const saveCurrent = (p: Plan | null) => { if (p) write(CURRENT, p); else { try { localStorage.removeItem(CURRENT); } catch { /* ignora */ } } };

export function listProjects(): Plan[] {
  const raw = read(PROJECTS);
  return (Array.isArray(raw) ? raw : []).flatMap((x) => { const p = sanitizePlan(x); return p ? [p] : []; })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
export function saveProject(p: Plan): boolean {
  const rest = listProjects().filter((x) => x.id !== p.id);
  return write(PROJECTS, [p, ...rest].slice(0, 30));
}
export function deleteProject(id: string) { write(PROJECTS, listProjects().filter((x) => x.id !== id)); }
