/**
 * Dados técnicos complementares ao catálogo (altura do assento, embalagem, limpeza...).
 *
 * Regra de ouro: campo ausente = "informação não disponível". Nada aqui é estimado por
 * aproximação a partir de outra medida (ex.: altura total NÃO vira altura do assento).
 * `fonte: "ficha"` = consta no texto do próprio catálogo; `fonte: "demo"` = valor fictício
 * de demonstração, que a interface precisa rotular como tal.
 */
export type Fonte = "ficha" | "demo";

export interface Tech {
  /** Altura do assento (cm). Faixa [mín, máx]; assento fixo = [x, x]. */
  assento?: { range: [number, number]; fonte: Fonte };
  /** Para que o assento é indicado, segundo a descrição do produto. */
  uso?: { para: ("mesa" | "balcao")[]; fonte: Fonte };
  /** Maior volume embalado (cm) e quantidade de volumes. */
  embalagem?: { w: number; h: number; d: number; volumes: number; fonte: Fonte };
  /** Só `true` quando a ficha diz que chega desmontado / pode ser desmontado. */
  desmontavel?: { valor: boolean; fonte: Fonte };
  limpeza?: { nivel: "facil" | "media" | "cuidado"; nota: string; fonte: Fonte };
}

export const techBySlug: Record<string, Tech> = {
  // Assentos
  "banqueta-carvalho": { uso: { para: ["balcao"], fonte: "ficha" } }, // 65 cm é altura TOTAL; assento não informado
  "cadeira-jantar-fresta": { assento: { range: [46, 46], fonte: "demo" }, uso: { para: ["mesa"], fonte: "demo" }, limpeza: { nivel: "facil", nota: "Madeira maciça: pano levemente úmido.", fonte: "demo" } },
  "cadeira-ergonomica-ergo": { assento: { range: [42, 52], fonte: "demo" }, uso: { para: ["mesa"], fonte: "ficha" } }, // ficha: "regulagem de altura"
  "cadeira-corporativa-operacional": { assento: { range: [43, 53], fonte: "demo" }, uso: { para: ["mesa"], fonte: "ficha" } },

  // Estofados: limpeza
  "sofa-mata-3-lugares": { limpeza: { nivel: "facil", nota: "Veludo de fácil limpeza, segundo a ficha.", fonte: "ficha" }, embalagem: { w: 215, h: 55, d: 95, volumes: 1, fonte: "demo" }, desmontavel: { valor: false, fonte: "demo" } },
  "sofa-brisa-2-lugares": { limpeza: { nivel: "facil", nota: "Fácil de limpar, segundo a ficha.", fonte: "ficha" } },
  "sofa-recepcao-3-lugares": { limpeza: { nivel: "facil", nota: "Couro sintético, fácil de limpar, segundo a ficha.", fonte: "ficha" } },
  "sofa-nuvem-2-lugares": { limpeza: { nivel: "cuidado", nota: "Linho: limpeza a seco recomendada.", fonte: "demo" }, embalagem: { w: 165, h: 45, d: 75, volumes: 2, fonte: "demo" }, desmontavel: { valor: true, fonte: "ficha" } }, // ficha: "chega desmontado (pés e encosto)"
  "poltrona-pluma": { limpeza: { nivel: "cuidado", nota: "Tecido bouclé prende fios e pelos; evite atrito.", fonte: "demo" } },

  // Volumosos (para o Conecta Rota)
  "mesa-jantar-ipe-6": { embalagem: { w: 185, h: 12, d: 95, volumes: 2, fonte: "demo" }, desmontavel: { valor: true, fonte: "demo" } },
  "cama-casal-savana": { embalagem: { w: 205, h: 30, d: 155, volumes: 3, fonte: "demo" }, desmontavel: { valor: true, fonte: "demo" } },
  "guarda-roupa-3-portas": { embalagem: { w: 235, h: 25, d: 55, volumes: 4, fonte: "demo" }, desmontavel: { valor: true, fonte: "demo" } },
};

export const techOf = (slug: string): Tech => techBySlug[slug] ?? {};
