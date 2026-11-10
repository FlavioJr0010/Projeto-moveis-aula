import { bySlug, type Product } from "@/data/products";
import { recommend, type Reco } from "@/lib/recommend";
import { rectOf } from "./geometry";
import type { Plan } from "./types";

/** Sugestões para a planta atual: considera o que já está nela, o tipo de ambiente e o espaço que sobrou. */
export function recommendForPlan(plan: Plan, selectedSlug?: string | null, limit = 6): Reco[] {
  const placed = plan.items.flatMap((it) => { const p = bySlug(it.slug); return p ? [{ it, p }] : []; });
  const distinct = [...new Map(placed.map(({ p }) => [p.slug, p])).values()] as Product[];
  const selected = selectedSlug ? bySlug(selectedSlug) : undefined;
  // com um móvel selecionado, as sugestões giram em torno dele; senão, em torno de tudo que está na planta
  const anchors = selected ? [selected] : distinct;
  return recommend({
    anchors, room: plan.room, limit,
    exclude: new Set(distinct.map((p) => p.slug)),
    occupied: placed.map(({ it, p }) => rectOf(it, p.dims)),
  });
}
