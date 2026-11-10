import { techOf } from "@/data/tech";

/**
 * Conecta Rota: triagem OPCIONAL de acesso para entrega. Conservadora por desenho:
 * nunca garante passagem; sem medida da embalagem ou da passagem, diz que faltam dados.
 */
export type AccessStatus = "favoravel" | "atencao" | "insuficiente" | "invalido";
export type Stairs = "nao" | "sim" | "nao-sei";

export const MARGEM_CM = 5; // folga mínima entre a menor medida do volume e a passagem
export const MAX_CM = 400;

export interface AccessInput {
  /** Largura livre da passagem mais estreita (cm). `undefined` = não informada. */
  passagemCm?: number;
  stairs?: Stairs;
}

export interface AccessResult {
  status: AccessStatus;
  title: string;
  text: string;
  /** Medidas efetivamente usadas na triagem. */
  used: string[];
  missing: string[];
}

export const validCm = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && n > 0 && n <= MAX_CM;

export function checkAccess(slug: string, input: AccessInput): AccessResult {
  const t = techOf(slug);
  const missing: string[] = [];
  if (input.passagemCm !== undefined && !validCm(input.passagemCm)) {
    return { status: "invalido", title: "Confira a medida", text: `Informe a largura da passagem em centímetros, entre 1 e ${MAX_CM}.`, used: [], missing: [] };
  }
  if (!t.embalagem) missing.push("dimensões da embalagem");
  if (input.passagemCm === undefined) missing.push("largura da passagem mais estreita");
  if (missing.length) {
    return {
      status: "insuficiente", title: "Dados insuficientes", missing, used: [],
      text: t.embalagem ? "Informe a largura da passagem mais estreita (porta, corredor ou elevador) para a triagem inicial."
        : `Ainda não temos as medidas da embalagem deste produto, então não dá para estimar a passagem. Confirme com nosso atendimento antes da entrega.${t.desmontavel?.valor ? " A ficha indica que ele chega desmontado." : ""}`,
    };
  }
  const e = t.embalagem!;
  const menor = Math.min(e.w, e.h, e.d);
  const passagem = input.passagemCm!;
  const demo = e.fonte === "demo" ? " (medida de demonstração)" : "";
  const used = [`menor medida do volume embalado: ${menor} cm${demo}`, `passagem informada: ${passagem} cm`, `${e.volumes} volume${e.volumes > 1 ? "s" : ""} (cada um considerado separadamente)`];

  if (menor > passagem) {
    return { status: "atencao", title: "Atenção: passagem estreita", used, missing: [], text: `O menor lado do volume embalado (${menor} cm) é maior que a passagem informada (${passagem} cm). Fale com a equipe de entrega para avaliar outra rota ou içamento.` };
  }
  if (passagem - menor < MARGEM_CM) {
    return { status: "atencao", title: "Atenção: passagem apertada", used, missing: [], text: `A folga é de apenas ${passagem - menor} cm (menor lado ${menor} cm, passagem ${passagem} cm). Qualquer curva ou batente pode impedir; confirme com a equipe de entrega.` };
  }
  if (input.stairs !== "nao") {
    return { status: "insuficiente", title: "Falta confirmar escadas e curvas", used, missing: ["escadas, curvas ou elevador no trajeto"], text: `Pela largura, não vimos impedimento, mas ${input.stairs === "sim" ? "escadas, curvas ou elevador" : "o trajeto (escadas, curvas, elevador)"} também importam${input.stairs === "sim" ? " e precisam de conferência com a equipe" : ": responda ou fale com nosso atendimento"}.` };
  }
  return { status: "favoravel", title: "Sem impedimento nesta triagem inicial", used, missing: [], text: "Pelas medidas informadas, não identificamos impedimento nesta verificação inicial. A passagem final depende da geometria do local e da movimentação do volume; não é garantia de entrega." };
}
