import { products, type Ambiente, type Perfil, type Product } from "@/data/products";
import { techOf } from "@/data/tech";

/**
 * Conecta Sem Arrependimento (por regras, sem IA): recomendação explicável a partir de atributos
 * reais do catálogo. Cada sugestão traz motivos, ressalvas e dados ausentes; nunca inventa fato.
 */
export interface AdviceAnswers {
  perfil?: Perfil;
  ambiente?: Ambiente | "casa";
  style?: "moderno" | "classico" | "natural";
  budget?: number; // teto por peça = budget / 2 (mesma regra do quiz)
  pets?: "pets" | "criancas" | "ambos" | "nenhum";
  limpeza?: "prioridade" | "indiferente";
}

export interface Advice {
  product: Product;
  score: number;
  reasons: string[];
  caveats: string[];
  missing: string[];
  /** Alternativa da mesma categoria mais barata (mostrada só se existir). */
  cheaper?: Product;
}

const needsEasyClean = (a: AdviceAnswers) => a.limpeza === "prioridade" || (!!a.pets && a.pets !== "nenhum");
const isFabric = (p: Product) => p.visual.materiais.includes("tecido") || p.visual.materiais.includes("couro");
const isSoft = (p: Product) => p.category === "sofas" || p.category === "poltronas";

export function advise(a: AdviceAnswers, limit = 4): Advice[] {
  const budget = a.budget ?? 99999;
  const cap = budget / 2;
  const easy = needsEasyClean(a);
  const base = products.filter((p) => p.contextos.includes("residencial") && p.stock > 0);

  const list = base.map((p): Advice => {
    const reasons: string[] = [], caveats: string[] = [], missing: string[] = [];
    let score = p.rating / 10;
    if (a.perfil && p.perfis.includes(a.perfil)) { score += 3; reasons.push("indicado para o seu perfil de moradia"); }
    if (a.ambiente && (a.ambiente === "casa" || p.ambientes.includes(a.ambiente))) { score += 3; if (a.ambiente !== "casa") reasons.push("serve para o ambiente escolhido"); }
    if (a.style && p.style === a.style) { score += 2; reasons.push("combina com o estilo que você escolheu"); }
    if (p.price <= cap) { score += 1; reasons.push(`cabe no orçamento (${p.price <= cap / 2 ? "folgado" : "dentro do teto"})`); }
    else if (a.budget && a.budget < 99999) { score -= 2; caveats.push("pode ficar acima do orçamento que você informou"); }

    if (easy && isSoft(p) && isFabric(p)) {
      const l = techOf(p.slug).limpeza;
      if (!l) { missing.push("instruções de limpeza"); caveats.push("não temos dados sobre limpeza deste revestimento; confirme com o atendimento"); score -= 0.5; }
      else if (l.nivel === "facil") { score += 2; reasons.push(`${l.nota}${l.fonte === "demo" ? " (demo)" : ""}`); }
      else { score -= 2; caveats.push(`${l.nota} Exige cuidados específicos para a sua rotina${l.fonte === "demo" ? " (demo)" : ""}.`); }
    }
    if ((a.pets === "pets" || a.pets === "ambos") && isSoft(p) && /bouclé|boucle/i.test(p.material) && !caveats.length) caveats.push("o bouclé é texturizado e pode prender pelos e fios");
    const cheaper = products.filter((x) => x.category === p.category && x.price < p.price * 0.85 && x.stock > 0 && x.contextos.includes("residencial") && x.ambientes.some((am) => p.ambientes.includes(am))).sort((x, y) => y.rating - x.rating)[0];
    return { product: p, score, reasons, caveats, missing, cheaper };
  });

  return list.filter((x) => x.reasons.length > 0).sort((x, y) => y.score - x.score).slice(0, limit);
}
