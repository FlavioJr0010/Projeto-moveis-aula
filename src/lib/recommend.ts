import { ambientesList, products, type Ambiente, type Contexto, type Estilo, type Familia, type Material, type Product } from "@/data/products";
import { findFreeSpot, fitsRoom } from "./planner/geometry";
import type { Rect, Room } from "./planner/types";

/**
 * Recomendação por regras (sem IA): "o que completa este móvel" + "o quanto combina visualmente".
 * Tudo é transparente: cada sugestão volta com os motivos. Pesos e matrizes ficam neste arquivo,
 * fáceis de ajustar sem mexer no resto do sistema.
 */

// ---------- 1) PAPÉIS: o que completa o quê (por subcategoria) ----------
const SOFAS = ["sofa-2-lugares", "sofa-3-lugares"];
const COMPLEMENTS: Record<string, string[]> = {
  "escrivaninha": ["cadeira-ergonomica", "gaveteiro", "estante", "nicho", "suporte-monitor", "arquivo", "divisoria"],
  "mesa-escritorio": ["cadeira-ergonomica", "gaveteiro", "estante", "nicho", "suporte-monitor", "arquivo", "divisoria"],
  "mesa-corporativa": ["cadeira-corporativa", "cadeira-ergonomica", "gaveteiro", "arquivo", "armario-baixo", "estante", "divisoria"],
  "estacao-trabalho": ["cadeira-corporativa", "cadeira-ergonomica", "gaveteiro", "arquivo", "armario-baixo", "divisoria"],
  "mesa-reuniao": ["cadeira-corporativa", "armario-baixo", "estante", "divisoria"],
  "balcao-atendimento": ["cadeira-corporativa", "sofa-recepcao", "armario-baixo", "banqueta", "divisoria"],
  "sofa-recepcao": ["balcao-atendimento", "armario-baixo", "estante", "poltrona"],
  "cadeira-ergonomica": ["escrivaninha", "mesa-escritorio", "gaveteiro", "suporte-monitor"],
  "cadeira-corporativa": ["mesa-corporativa", "mesa-reuniao", "estacao-trabalho", "gaveteiro"],
  "cama-casal": ["criado-mudo", "guarda-roupa", "poltrona"],
  "cama-queen": ["criado-mudo", "guarda-roupa", "poltrona"],
  "criado-mudo": ["cama-casal", "cama-queen", "guarda-roupa"],
  "guarda-roupa": ["cama-casal", "cama-queen", "criado-mudo", "poltrona"],
  "sofa-2-lugares": ["poltrona", "rack", "aparador", "estante", "armario-nichos"],
  "sofa-3-lugares": ["poltrona", "rack", "aparador", "estante", "armario-nichos"],
  "poltrona": [...SOFAS, "rack", "estante", "criado-mudo"],
  "rack": [...SOFAS, "poltrona"],
  "mesa-jantar": ["cadeira-jantar", "banqueta", "aparador"],
  "cadeira-jantar": ["mesa-jantar", "aparador"],
  "banqueta": ["mesa-jantar", "balcao-atendimento"],
  "aparador": ["mesa-jantar", ...SOFAS, "cadeira-jantar"],
  "estante": ["escrivaninha", "mesa-escritorio", ...SOFAS, "poltrona"],
  "nicho": ["escrivaninha", "mesa-escritorio", "cadeira-ergonomica"],
  "armario-nichos": [...SOFAS, "poltrona", "cama-casal", "cama-queen"],
  "arquivo": ["mesa-corporativa", "mesa-escritorio", "cadeira-corporativa"],
  "armario-baixo": ["mesa-reuniao", "mesa-corporativa", "balcao-atendimento"],
  "gaveteiro": ["escrivaninha", "mesa-escritorio", "mesa-corporativa", "cadeira-ergonomica"],
  "suporte-monitor": ["escrivaninha", "mesa-escritorio", "cadeira-ergonomica"],
  "divisoria": ["estacao-trabalho", "mesa-corporativa", "escrivaninha"],
};

/** Móveis de vários lugares: só para eles faz sentido sugerir mais de uma cadeira. */
const MULTI_SEAT = ["mesa-reuniao", "mesa-jantar", "estacao-trabalho"];

// ---------- 2) COMPATIBILIDADE VISUAL (0 a 1) ----------
const ESTILO_VIZINHOS: [Estilo, Estilo][] = [
  ["moderno", "minimalista"], ["minimalista", "escandinavo"], ["moderno", "escandinavo"],
  ["industrial", "corporativo"], ["moderno", "corporativo"], ["minimalista", "corporativo"],
  ["industrial", "moderno"], ["rustico", "escandinavo"], ["rustico", "classico"], ["moderno", "classico"],
];
export function estiloCompat(a: Estilo[], b: Estilo[]): { v: number; shared?: Estilo; pair?: [Estilo, Estilo] } {
  const shared = a.find((x) => b.includes(x));
  if (shared) return { v: 1, shared };
  for (const x of a) for (const y of b) if (ESTILO_VIZINHOS.some(([p, q]) => (p === x && q === y) || (p === y && q === x))) return { v: 0.5, pair: [x, y] };
  return { v: 0 };
}

const NEUTRAS: Familia[] = ["branco", "cinza", "preto", "bege"];
export function familiaCompat(a: Familia, b: Familia): number {
  if (a === b) return a === "colorido" ? 0.5 : 1;
  const pair = (x: Familia, y: Familia) => (a === x && b === y) || (a === y && b === x);
  if (pair("madeira-clara", "madeira-escura")) return 0.5;
  if (pair("preto", "madeira-escura")) return 0.7;
  if (pair("colorido", "madeira-clara") || pair("colorido", "madeira-escura")) return 0.6;
  if (NEUTRAS.includes(a) || NEUTRAS.includes(b)) return 0.85; // neutros combinam com quase tudo
  return 0.3;
}
export function paletaCompat(a: Familia[], b: Familia[]): { v: number; pair?: [Familia, Familia] } {
  let best = { v: 0, pair: undefined as [Familia, Familia] | undefined };
  for (const x of a) for (const y of b) { const v = familiaCompat(x, y); if (v > best.v) best = { v, pair: [x, y] }; }
  return best;
}

export function materialCompat(a: Material[], b: Material[]): { v: number; shared?: Material } {
  const shared = a.find((x) => b.includes(x));
  if (shared) return { v: 1, shared };
  const near = (x: Material, y: Material) => [["madeira", "mdf"], ["madeira", "bambu"], ["mdf", "laminado"], ["metal", "vidro"], ["madeira", "metal"], ["mdf", "metal"]]
    .some(([p, q]) => (p === x && q === y) || (p === y && q === x));
  return { v: a.some((x) => b.some((y) => near(x, y))) ? 0.7 : 0.3 };
}

const jaccard = (a: string[], b: string[]) => {
  const A = new Set(a), B = new Set(b);
  const inter = [...A].filter((x) => B.has(x));
  return { v: A.size + B.size - inter.length === 0 ? 0 : Math.min(1, (inter.length / (A.size + B.size - inter.length)) * 2.5), inter };
};

// ---------- 3) PESOS (somam 100) ----------
export const WEIGHTS = { estilo: 30, cor: 25, material: 15, tags: 15, acabamento: 5, ambiente: 10 } as const;
export const MIN_SCORE = 45;

const FAMILIA_LABEL: Record<Familia, string> = {
  branco: "branco", preto: "preto", cinza: "cinza", "madeira-clara": "madeira clara", "madeira-escura": "madeira escura", bege: "bege", colorido: "cor de destaque",
};
const label = (a: Ambiente) => ambientesList.find((x) => x.slug === a)?.label.toLowerCase() ?? a;

/** Contextos de uso aceitos para cada tipo de ambiente (o filtro duro de "residencial vs. empresa"). */
export function contextosDoAmbiente(tipo: Ambiente): Contexto[] {
  if (tipo === "home-office") return ["home-office", "residencial"];
  if (["escritorio", "recepcao", "loja", "sala-reuniao"].includes(tipo)) return ["comercial", "home-office"];
  return ["residencial"];
}

export interface Reco {
  product: Product;
  score: number; // 0 a 100
  kind: "completa" | "similar"; // "completa" = papel complementar; "similar" = "você também pode gostar"
  withName: string; // com qual móvel combina
  reasons: string[];
  rank: number; // prioridade do papel (0 = mais essencial, ex.: a cadeira para uma mesa)
}

export interface RecoInput {
  anchors: Product[]; // móveis já escolhidos/posicionados
  exclude?: Set<string>; // slugs já usados (não repetir)
  room?: Room; // se houver, filtra por tamanho e espaço livre
  occupied?: Rect[]; // retângulos já ocupados na planta
  ambiente?: Ambiente; // sem `room`: ambiente de referência
  limit?: number;
  maxPerRole?: number;
}

function pair(a: Product, c: Product, ambiente: Ambiente | undefined) {
  const e = estiloCompat(a.visual.estilos, c.visual.estilos);
  const p = paletaCompat(a.visual.paleta, c.visual.paleta);
  const m = materialCompat(a.visual.materiais, c.visual.materiais);
  const t = jaccard(a.visual.tags, c.visual.tags);
  const ac = a.visual.acabamento === c.visual.acabamento ? 1 : 0.5;
  const amb = ambiente ? (c.ambientes.includes(ambiente) ? 1 : 0.4) : 0.7;
  const score = e.v * WEIGHTS.estilo + p.v * WEIGHTS.cor + m.v * WEIGHTS.material + t.v * WEIGHTS.tags + ac * WEIGHTS.acabamento + amb * WEIGHTS.ambiente;
  return { score, e, p, m, t, amb };
}

export function recommend(input: RecoInput): Reco[] {
  const { anchors, room, occupied = [], limit = 6, maxPerRole = 2 } = input;
  const exclude = input.exclude ?? new Set(anchors.map((a) => a.slug));
  const ambiente = room?.tipo ?? input.ambiente ?? anchors[0]?.ambientes[0];
  const ctx = ambiente ? contextosDoAmbiente(ambiente) : anchors.flatMap((a) => a.contextos);
  if (!anchors.length) return [];

  const out: Reco[] = [];
  for (const c of products) {
    if (c.stock <= 0) continue;
    // não repete o que já está no ambiente; cadeiras podem repetir só ao redor de mesas de vários lugares
    if (exclude.has(c.slug) && !(c.category === "cadeiras" && anchors.some((a) => MULTI_SEAT.includes(a.subcategoria)))) continue;
    if (!c.contextos.some((x) => ctx.includes(x))) continue; // filtro duro: casa vs. empresa
    if (room) {
      if (!fitsRoom(c.dims, room)) continue;
      if (!findFreeSpot(c.dims, room, occupied)) continue; // só sugere o que cabe no espaço que sobrou
    }
    let best: { a: Product; r: ReturnType<typeof pair> } | null = null;
    let sum = 0, rank = Infinity;
    for (const a of anchors) {
      const r = pair(a, c, ambiente);
      sum += r.score;
      const i = (COMPLEMENTS[a.subcategoria] ?? []).indexOf(c.subcategoria);
      if (i >= 0) rank = Math.min(rank, i);
      if (!best || r.score > best.r.score) best = { a, r };
    }
    const complement = rank !== Infinity;
    // "você também pode gostar" não repete o mesmo tipo de móvel que já está no ambiente (exceto cadeiras)
    if (!complement && c.category !== "cadeiras" && anchors.some((a) => a.subcategoria === c.subcategoria)) continue;
    const score = Math.round(sum / anchors.length);
    if (score < MIN_SCORE || !best) continue;
    out.push({ product: c, score, kind: complement ? "completa" : "similar", withName: best.a.name, reasons: reasonsOf(best.a, c, best.r, ambiente), rank });
  }

  // 1) Complementos: um de cada papel (na ordem de importância do papel), depois o 2º melhor de cada, etc.
  //    Assim a cadeira da escrivaninha nunca fica de fora só porque outro item pontuou mais por estilo.
  const bestFirst = (a: Reco, b: Reco) => b.score - a.score || b.product.reviews * b.product.rating - a.product.reviews * a.product.rating;
  const roles = new Map<string, Reco[]>();
  for (const r of out.filter((x) => x.kind === "completa")) roles.set(r.product.subcategoria, [...(roles.get(r.product.subcategoria) ?? []), r]);
  const groups = [...roles.values()].map((g) => g.sort(bestFirst)).sort((a, b) => a[0].rank - b[0].rank || bestFirst(a[0], b[0]));
  const picked: Reco[] = [];
  for (let round = 0; round < maxPerRole && picked.length < limit; round++) {
    for (const g of groups) { if (g[round] && picked.length < limit) picked.push(g[round]); }
  }
  // 2) Se sobrou espaço na lista: "você também pode gostar", por melhor combinação.
  for (const r of out.filter((x) => x.kind === "similar").sort(bestFirst)) {
    if (picked.length >= limit) break;
    picked.push(r);
  }
  return picked;
}

function reasonsOf(a: Product, c: Product, r: ReturnType<typeof pair>, ambiente: Ambiente | undefined): string[] {
  const out: string[] = [];
  if (r.e.shared) out.push(`Mesmo estilo ${r.e.shared}`);
  else if (r.e.pair) out.push(`Estilos que combinam (${r.e.pair[0]} e ${r.e.pair[1]})`);
  if (r.p.pair && r.p.v >= 0.85) out.push(r.p.pair[0] === r.p.pair[1] ? `Mesma cor (${FAMILIA_LABEL[r.p.pair[0]]})` : `Cores que combinam (${FAMILIA_LABEL[r.p.pair[0]]} e ${FAMILIA_LABEL[r.p.pair[1]]})`);
  if (r.m.shared) out.push(`Mesmo material (${r.m.shared})`);
  if (r.t.inter.length) out.push(`Em comum: ${r.t.inter.slice(0, 2).join(", ").replace(/-/g, " ")}`);
  if (ambiente && c.ambientes.includes(ambiente)) out.push(`Feito para ${label(ambiente)}`);
  if (!out.length) out.push(`Combina com ${a.name}`);
  return out.slice(0, 3);
}
