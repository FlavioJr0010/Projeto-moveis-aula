import { bySlug, type Product } from "@/data/products";
import { fitsRoom, inside, overlaps, rectOf } from "./geometry";
import type { Plan } from "./types";

export type AlertCode = "nao-cabe" | "fora" | "colisao" | "altura" | "estoque";
export interface PlanAlert { level: "erro" | "aviso"; code: AlertCode; itemIds: string[]; message: string }

type Lookup = (slug: string) => Pick<Product, "name" | "dims" | "stock"> | undefined;

/** Regras do planejador: não cabe, fora das paredes, sobreposição, altura e estoque. */
export function validatePlan(plan: Plan, lookup: Lookup = bySlug): PlanAlert[] {
  const alerts: PlanAlert[] = [];
  const known = plan.items.flatMap((it) => { const p = lookup(it.slug); return p ? [{ it, p, rect: rectOf(it, p.dims) }] : []; });

  for (const { it, p, rect } of known) {
    if (!fitsRoom(p.dims, plan.room)) {
      alerts.push({ level: "erro", code: "nao-cabe", itemIds: [it.id], message: `${p.name} não cabe neste ambiente (${p.dims.w}×${p.dims.d} cm em ${plan.room.w}×${plan.room.d} cm).` });
    } else if (!inside(rect, plan.room)) {
      alerts.push({ level: "erro", code: "fora", itemIds: [it.id], message: `${p.name} ultrapassa as paredes.` });
    }
    if (plan.room.h && p.dims.h > plan.room.h) {
      alerts.push({ level: "erro", code: "altura", itemIds: [it.id], message: `${p.name} é mais alto (${p.dims.h} cm) que o pé-direito (${plan.room.h} cm).` });
    }
  }
  for (let i = 0; i < known.length; i++) for (let j = i + 1; j < known.length; j++) {
    if (overlaps(known[i].rect, known[j].rect)) {
      alerts.push({ level: "erro", code: "colisao", itemIds: [known[i].it.id, known[j].it.id], message: `${known[i].p.name} está sobre ${known[j].p.name}.` });
    }
  }
  const qty = new Map<string, number>();
  for (const { it } of known) qty.set(it.slug, (qty.get(it.slug) ?? 0) + 1);
  for (const [slug, n] of qty) {
    const p = lookup(slug)!;
    if (n > p.stock) alerts.push({ level: "aviso", code: "estoque", itemIds: plan.items.filter((x) => x.slug === slug).map((x) => x.id), message: `Só temos ${p.stock} un. de ${p.name} em estoque (você usou ${n}).` });
  }
  return alerts;
}

/** Ids de itens com algum erro, para pintar de vermelho na planta. */
export const itemsWithError = (alerts: PlanAlert[]) => new Set(alerts.filter((a) => a.level === "erro").flatMap((a) => a.itemIds));
