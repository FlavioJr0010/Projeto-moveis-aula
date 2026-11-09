import { products, type Product } from "@/data/products";
import { priceInfo, type PriceInfo } from "./pricing";

export interface SearchParams {
  q?: string;
  categoria?: string;
  ambiente?: string;
  perfil?: string;
  min?: number;
  max?: number;
  w?: number; // largura livre do espaço (cm)
  d?: number; // profundidade livre (cm)
  h?: number; // altura livre (cm)
  eco?: boolean;
  ordem?: "relevancia" | "menor" | "maior" | "avaliacao" | "desconto";
}

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export type ProductWithPrice = Product & { info: PriceInfo };

export function searchProducts(p: SearchParams): ProductWithPrice[] {
  const q = p.q ? norm(p.q).split(/\s+/).filter(Boolean) : [];
  let list = products.filter((x) => {
    if (q.length) {
      const hay = norm(`${x.name} ${x.short} ${x.category} ${x.material} ${x.style} ${x.ambientes.join(" ")}`);
      if (!q.every((t) => hay.includes(t))) return false;
    }
    if (p.categoria && x.category !== p.categoria) return false;
    if (p.ambiente && !x.ambientes.includes(p.ambiente as never)) return false;
    if (p.perfil && !x.perfis.includes(p.perfil as never)) return false;
    if (p.min !== undefined && x.price < p.min) return false;
    if (p.max !== undefined && x.price > p.max) return false;
    if (p.w && x.dims.w > p.w) return false;
    if (p.d && x.dims.d > p.d) return false;
    if (p.h && x.dims.h > p.h) return false;
    if (p.eco && x.eco.recycledPct < 30) return false;
    return true;
  });
  const score = (x: Product) => x.reviews * x.rating;
  const sorters: Record<string, (a: Product, b: Product) => number> = {
    relevancia: (a, b) => score(b) - score(a),
    menor: (a, b) => a.price - b.price,
    maior: (a, b) => b.price - a.price,
    avaliacao: (a, b) => b.rating - a.rating || b.reviews - a.reviews,
    desconto: (a, b) => b.listPrice / b.price - a.listPrice / a.price,
  };
  list = [...list].sort(sorters[p.ordem ?? "relevancia"] ?? sorters.relevancia);
  return list.map((x) => ({ ...x, info: priceInfo(x) }));
}

const num = (v: string | null | undefined) => {
  if (v === null || v === undefined || v === "") return undefined;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

export function parseParams(get: (k: string) => string | null | undefined): SearchParams {
  return {
    q: get("q") || undefined,
    categoria: get("categoria") || undefined,
    ambiente: get("ambiente") || undefined,
    perfil: get("perfil") || undefined,
    min: num(get("min")), max: num(get("max")),
    w: num(get("w")), d: num(get("d")), h: num(get("h")),
    eco: get("eco") === "1",
    ordem: (get("ordem") as SearchParams["ordem"]) || undefined,
  };
}
