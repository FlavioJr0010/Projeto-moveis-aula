import { bySlug, products, type Product } from "@/data/products";
import { techOf } from "@/data/tech";

/**
 * Conecta Compatível: regras técnicas verificáveis (sem IA) para itens usados em conjunto.
 * MVP: mesa + assento. A diferença entre a altura do TAMPO e a do ASSENTO costuma ficar
 * entre 25 e 30 cm; é um sinal de triagem, não parecer ergonômico.
 */
export const DIFF_MIN = 25;
export const DIFF_MAX = 30;

export type CompatStatus = "ok" | "atencao" | "indeterminado";

export interface CompatItem { slug: string; bundle?: string }

export interface CompatResult {
  key: string;
  mesa: string;
  assento: string;
  status: CompatStatus;
  title: string;
  text: string;
  /** Dados que faltam para concluir (só em "indeterminado"). */
  missing: string[];
  /** Há evidência de uso conjunto (mesmo kit) ou o cliente precisa confirmar? */
  presumed: boolean;
  alternatives: string[];
}

const isMesa = (p: Product) => p.category === "mesas";
const isAssento = (p: Product) => p.category === "cadeiras" || p.subcategoria === "banqueta";

/** Altura do tampo = altura total de uma mesa (o tampo é o ponto mais alto). */
export const alturaTampo = (p: Product) => (isMesa(p) ? p.dims.h : undefined);

const shareAmbiente = (a: Product, b: Product) => a.ambientes.some((x) => b.ambientes.includes(x));

const fmtRange = ([a, b]: [number, number]) => (a === b ? `${a} cm` : `${a} a ${b} cm`);

/** Faixa possível de diferença tampo − assento. */
function diffRange(tampo: number, seat: [number, number]): [number, number] {
  return [tampo - seat[1], tampo - seat[0]];
}
const intersects = ([a, b]: [number, number]) => b >= DIFF_MIN && a <= DIFF_MAX;

/** Assentos do catálogo com altura conhecida e diferença dentro da faixa, para o mesmo contexto da mesa. */
export function alternativasPara(mesa: Product, excluir: string[] = []): string[] {
  const t = alturaTampo(mesa);
  if (t == null) return [];
  return products
    .filter((p) => isAssento(p) && !excluir.includes(p.slug) && p.stock > 0)
    .filter((p) => p.contextos.some((c) => mesa.contextos.includes(c)) && shareAmbiente(p, mesa))
    .filter((p) => { const t2 = techOf(p.slug); return t2.assento && (t2.uso?.para.includes("mesa") ?? true) && intersects(diffRange(t, t2.assento.range)); })
    .sort((a, b) => a.price - b.price)
    .slice(0, 3)
    .map((p) => p.slug);
}

export function evaluatePair(mesa: Product, seat: Product, presumed: boolean): CompatResult {
  const key = `${mesa.slug}+${seat.slug}`;
  const tampo = alturaTampo(mesa)!;
  const tech = techOf(seat.slug);
  const base = { key, mesa: mesa.slug, assento: seat.slug, presumed };
  const alternatives = alternativasPara(mesa, [seat.slug]);
  const soBalcao = tech.uso && !tech.uso.para.includes("mesa");

  if (!tech.assento) {
    const nota = soBalcao ? ` Além disso, a ficha indica esse item para bancada ou balcão, não para mesa.` : "";
    return {
      ...base, status: "indeterminado", alternatives, missing: ["altura do assento"],
      title: "Não foi possível verificar esta combinação",
      text: `A mesa “${mesa.name}” tem tampo a ${tampo} cm. Para “${seat.name}” o catálogo informa ${seat.dims.h} cm de altura total, mas não a altura do assento, e sem ela não dá para saber se a combinação é confortável.${nota} Consulte nosso atendimento antes de decidir.`,
    };
  }
  const r = diffRange(tampo, tech.assento.range);
  const rotulo = tech.assento.fonte === "demo" ? " (valor de demonstração)" : "";
  if (intersects(r)) {
    return {
      ...base, status: "ok", alternatives: [], missing: [],
      title: "Compatível segundo os critérios verificados",
      text: `Tampo a ${tampo} cm e assento a ${fmtRange(tech.assento.range)}${rotulo}: diferença de ${fmtRange(r)}, dentro da faixa usual de ${DIFF_MIN} a ${DIFF_MAX} cm. É uma triagem de altura, não um laudo de conforto.`,
    };
  }
  const efeito = r[0] > DIFF_MAX ? "o assento fica baixo em relação à mesa, deixando os braços elevados" : "o assento fica alto em relação à mesa, com pouco espaço para as pernas";
  return {
    ...base, status: "atencao", alternatives, missing: [],
    title: "Atenção: possível incompatibilidade de altura",
    text: `Tampo a ${tampo} cm e assento a ${fmtRange(tech.assento.range)}${rotulo}: diferença de ${fmtRange(r)}, fora da faixa usual de ${DIFF_MIN} a ${DIFF_MAX} cm. Na prática, ${efeito}. Se for usar assim mesmo, tudo bem; ${alternatives.length ? "veja também as alternativas abaixo." : "fale com o atendimento se tiver dúvida."}`,
  };
}

/**
 * Avalia só pares com relação funcional evidente (mesa + assento que compartilham ambiente).
 * `confirmed` = chaves de pares que o cliente disse que usará juntos.
 * Pares fora de um mesmo kit e não confirmados vêm com `presumed: false` (a UI pergunta antes).
 */
export function evaluateCompat(items: CompatItem[], confirmed: ReadonlySet<string> = new Set()): CompatResult[] {
  const seen = new Map<string, CompatItem>();
  for (const it of items) if (bySlug(it.slug) && !seen.has(it.slug + "|" + (it.bundle ?? ""))) seen.set(it.slug + "|" + (it.bundle ?? ""), it);
  const list = [...seen.values()].map((i) => ({ i, p: bySlug(i.slug)! }));
  const out = new Map<string, CompatResult>();
  for (const m of list.filter((x) => isMesa(x.p))) {
    for (const s of list.filter((x) => isAssento(x.p))) {
      if (!shareAmbiente(m.p, s.p)) continue;
      const key = `${m.p.slug}+${s.p.slug}`;
      if (out.has(key)) continue;
      const sameKit = !!m.i.bundle && m.i.bundle === s.i.bundle;
      out.set(key, evaluatePair(m.p, s.p, sameKit || confirmed.has(key)));
    }
  }
  return [...out.values()];
}
