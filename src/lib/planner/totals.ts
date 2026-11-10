import { bySlug } from "@/data/products";
import { priceCart, type CartLine } from "@/lib/pricing";
import type { PlacedItem } from "./types";

/** Agrupa os itens da planta em linhas de carrinho (cor padrão do produto, sem montagem). */
export function planLines(items: PlacedItem[]): CartLine[] {
  const qty = new Map<string, number>();
  for (const it of items) qty.set(it.slug, (qty.get(it.slug) ?? 0) + 1);
  return [...qty].flatMap(([slug, n]) => {
    const p = bySlug(slug);
    return p ? [{ slug, qty: n, color: p.colors[0].name, assembly: false }] : [];
  });
}

/** Total usando as MESMAS contas do carrinho (priceCart), então nunca diverge. */
export function planTotal(items: PlacedItem[]) {
  const c = priceCart(planLines(items));
  return { merchandise: c.merchandise, count: c.count, lines: c.lines };
}
