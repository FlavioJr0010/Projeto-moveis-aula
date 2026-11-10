import { bySlug, type Product } from "@/data/products";
import { isExpectedInFront } from "./clearance";
import { clearanceRect, fitsRoom, inside, overlaps, rectOf } from "./geometry";
import type { Plan } from "./types";

export type AlertCode = "nao-cabe" | "fora" | "colisao" | "altura" | "estoque" | "folga";
export interface PlanAlert { level: "erro" | "aviso"; code: AlertCode; itemIds: string[]; message: string }

type Lookup = (slug: string) => Pick<Product, "name" | "dims" | "stock" | "category" | "planner"> | undefined;

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
  // folga de uso (aviso, não erro): a frente do móvel precisa estar livre
  for (const { it, p, rect } of known) {
    const frente = p.planner?.clearance?.frente;
    if (!frente || !inside(rect, plan.room)) continue; // se já está fora, o erro "fora" já explica
    const zone = clearanceRect(it, p.dims, frente);
    if (!inside(zone, plan.room)) {
      alerts.push({ level: "aviso", code: "folga", itemIds: [it.id], message: `A frente de ${p.name} está voltada para a parede: deixe ${frente} cm livres para usar. Gire o móvel ou afaste-o.` });
      continue;
    }
    const blocker = known.find((o) => o.it.id !== it.id && !isExpectedInFront(p.category, o.p.category) && overlaps(zone, o.rect));
    if (blocker) alerts.push({ level: "aviso", code: "folga", itemIds: [it.id, blocker.it.id], message: `Pouco espaço na frente de ${p.name}: ${blocker.p.name} ocupa os ${frente} cm de uso.` });
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
