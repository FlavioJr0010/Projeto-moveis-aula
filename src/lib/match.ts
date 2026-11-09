import { bundles, bySlug, type Product } from "@/data/products";

/** Motor de compatibilidade: diz se um produto combina com o que já está no carrinho. */
export type Level = "ok" | "warn" | "bad";
export interface Reason { level: Level; text: string }
export interface MatchResult { score: number; level: Level; label: string; reasons: Reason[] }
export interface CartItem { slug: string; color: string }

const onlyHome = (p: Product) => p.contextos.length === 1 && p.contextos[0] === "residencial";
const SINGLE_USE: Record<string, string> = { sofas: "um sofá", camas: "uma cama", mesas: "uma mesa" };
const hexOf = (p: Product, color: string) => (p.colors.find((c) => c.name === color) ?? p.colors[0]).hex;

function hsl(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  let h = 0;
  if (d) {
    h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { h, s, l };
}
const isNeutral = (c: { s: number; l: number }) => c.s < 0.2 || c.l > 0.85 || c.l < 0.18;

function colorHarmony(a: string, b: string): { pts: number; kind: "neutro" | "analoga" | "complementar" | "choque" | "neutra" } {
  const x = hsl(a), y = hsl(b);
  if (isNeutral(x) || isNeutral(y)) return { pts: 10, kind: "neutro" };
  const dh = Math.min(Math.abs(x.h - y.h), 360 - Math.abs(x.h - y.h));
  if (dh <= 40) return { pts: 10, kind: "analoga" };
  if (dh >= 130) return { pts: 6, kind: "complementar" };
  if (dh >= 80 && Math.min(x.s, y.s) > 0.35) return { pts: -14, kind: "choque" };
  return { pts: 0, kind: "neutra" };
}

const STYLE_PT = { moderno: "moderno", classico: "clássico", natural: "natural" } as const;
const short = (p: Product) => p.name.split(" ").slice(0, 3).join(" ");

export function evaluateMatch(slug: string, color: string, cart: CartItem[]): MatchResult | null {
  const p = bySlug(slug);
  if (!p || cart.length === 0) return null;
  const hex = hexOf(p, color);
  const others = cart.map((c) => ({ c, p: bySlug(c.slug) })).filter((x): x is { c: CartItem; p: Product } => !!x.p);
  if (!others.length) return null;
  const distinct = others.filter((o) => o.p.slug !== p.slug);

  const reasons: Reason[] = [];
  let score = 65;

  // 1) repetição de peça de uso único (2 sofás, 2 camas...)
  const dup = others.find((o) => o.p.category === p.category && SINGLE_USE[p.category] && onlyHome(p) && onlyHome(o.p));
  if (dup) { score -= 30; reasons.push({ level: "bad", text: `Você já tem ${SINGLE_USE[p.category]} no carrinho (${short(dup.p)}).` }); }

  if (distinct.length) {
    // 2) estilo
    let style = 0; const clash: Product[] = []; const same: Product[] = [];
    for (const o of distinct) {
      if (o.p.style === p.style) { style += 10; same.push(o.p); }
      else if (o.p.style === "natural" || p.style === "natural") style += 4;
      else { style -= 15; clash.push(o.p); }
    }
    score += Math.max(-20, Math.min(20, style / distinct.length * (distinct.length > 1 ? 1.5 : 1)));
    if (same.length) reasons.push({ level: "ok", text: `Mesmo estilo ${STYLE_PT[p.style]} de ${short(same[0])}.` });
    if (clash.length) reasons.push({ level: "warn", text: `Estilo ${STYLE_PT[p.style]} destoa do ${STYLE_PT[clash[0].style]} de ${short(clash[0])}.` });
    if (!same.length && !clash.length) reasons.push({ level: "ok", text: "O estilo natural combina com os outros estilos." });

    // 3) cores
    const hs = distinct.map((o) => ({ o, h: colorHarmony(hex, hexOf(o.p, o.c.color)) }));
    const avg = hs.reduce((s, x) => s + x.h.pts, 0) / hs.length;
    score += Math.max(-20, Math.min(15, avg));
    const bad = hs.find((x) => x.h.kind === "choque");
    if (bad) reasons.push({ level: "warn", text: `${color} e ${bad.o.c.color} (${short(bad.o.p)}) são cores fortes que competem. Teste outra cor.` });
    else if (hs.every((x) => x.h.kind === "neutro")) reasons.push({ level: "ok", text: isNeutral(hsl(hex)) ? `${color} é um tom neutro: combina com as cores do carrinho.` : `${color} fica bem com os tons neutros do carrinho.` });
    else reasons.push({ level: "ok", text: `${color} harmoniza com as cores do carrinho.` });

    // 4) ambiente: complementa ou não
    const comp = distinct.find((o) => o.p.category !== p.category && o.p.ambientes.some((a) => p.ambientes.includes(a)));
    if (comp) { score += 10; reasons.push({ level: "ok", text: `Complementa ${short(comp.p)} no mesmo ambiente.` }); }

    // 5) espaço: peça grande junto de peças para apartamento pequeno
    const small = distinct.filter((o) => o.p.perfis.includes("apartamento-pequeno") && o.p.ambientes.some((a) => p.ambientes.includes(a)));
    if (small.length >= 2 && !p.perfis.includes("apartamento-pequeno")) { score -= 12; reasons.push({ level: "warn", text: "Pode ficar apertado: as outras peças do ambiente são para espaços compactos." }); }
  } else if (!dup) {
    reasons.push({ level: "ok", text: "Mesmo modelo que já está no carrinho." });
  }

  // 6) completa ambiente pronto
  for (const b of bundles) {
    if (!b.items.some((i) => i.slug === p.slug)) continue;
    const present = b.items.filter((i) => i.slug !== p.slug && cart.some((c) => c.slug === i.slug)).length;
    if (present > 0) {
      score += 15;
      reasons.push({ level: "ok", text: `Completa o ambiente “${b.name}” (${present + 1} de ${b.items.length} peças). O kit tem ${b.discountPct}% de desconto.` });
      break;
    }
  }

  // coerência: avisos limitam a nota e o selo; peça de uso único repetida é sempre "não combina"
  if (reasons.some((r) => r.level === "warn")) score = Math.min(score, 74);
  if (dup) score = Math.min(score, 40);
  score = Math.round(Math.max(0, Math.min(100, score)));
  let level: Level = score >= 68 ? "ok" : score >= 45 ? "warn" : "bad";
  if (dup) level = "bad";
  else if (level === "ok" && reasons.some((r) => r.level === "warn")) level = "warn";
  const label = level === "ok" ? "Combina com o seu carrinho" : level === "warn" ? "Combina com ressalvas" : "Não combina bem";
  const order = { bad: 0, warn: 1, ok: 2 } as const;
  reasons.sort((a, b) => order[a.level] - order[b.level]);
  return { score, level, label, reasons };
}

/** Melhor cor do produto para o carrinho atual. */
export function bestColor(slug: string, cart: CartItem[]) {
  const p = bySlug(slug);
  if (!p) return null;
  let best: { color: string; r: MatchResult } | null = null;
  for (const c of p.colors) {
    const r = evaluateMatch(slug, c.name, cart);
    if (r && (!best || r.score > best.r.score)) best = { color: c.name, r };
  }
  return best;
}
