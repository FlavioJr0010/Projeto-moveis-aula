import { describe, expect, it } from "vitest";
import { bundles, bySlug } from "@/data/products";
import { alternativasPara, evaluateCompat, evaluatePair } from "./compat";
import { checkAccess } from "./access";
import { advise } from "./advisor";
import { productQuestion, whatsappLink } from "./whatsapp";

const p = (s: string) => bySlug(s)!;

describe("Conecta Compatível", () => {
  it("Kit primeira casa: mesa 75 + banqueta de altura total 65 → não foi possível verificar", () => {
    const kit = bundles.find((b) => b.slug === "primeira-casa")!;
    const r = evaluateCompat(kit.items.map((i) => ({ slug: i.slug, bundle: kit.slug })));
    expect(r).toHaveLength(1);
    expect(r[0].status).toBe("indeterminado");
    expect(r[0].missing).toContain("altura do assento");
    expect(r[0].presumed).toBe(true);
    expect(r[0].text).toMatch(/65 cm de altura total/);
  });
  it("par compatível: mesa jantar 76 + cadeira 46 (dif. 30)", () => {
    expect(evaluatePair(p("mesa-jantar-ipe-6"), p("cadeira-jantar-fresta"), true).status).toBe("ok");
  });
  it("par incompatível: diferença fora da faixa gera atenção, com explicação", () => {
    const alta = { ...p("mesa-jantar-ipe-6"), dims: { ...p("mesa-jantar-ipe-6").dims, h: 90 } }; // 90-46 = 44
    const r = evaluatePair(alta, p("cadeira-jantar-fresta"), true);
    expect(r.status).toBe("atencao");
    expect(r.text).toMatch(/44 cm/);
    expect(r.text).toMatch(/assento fica baixo/);
  });
  it("assento regulável: compatível se a faixa possível intersecta 25–30 cm", () => {
    expect(evaluatePair(p("escrivaninha-clara-120"), p("cadeira-ergonomica-ergo"), true).status).toBe("ok");
  });
  it("sem relação funcional: sofá + cama não geram resultado; mesa e cadeira sem ambiente em comum também não", () => {
    expect(evaluateCompat([{ slug: "sofa-mata-3-lugares" }, { slug: "cama-queen-aurora" }])).toEqual([]);
    expect(evaluateCompat([{ slug: "mesa-jantar-ipe-6" }, { slug: "cadeira-ergonomica-ergo" }])).toEqual([]);
  });
  it("fora de kit e sem confirmação: presumed=false; confirmado: true", () => {
    const items = [{ slug: "mesa-redonda-lua" }, { slug: "banqueta-carvalho" }];
    expect(evaluateCompat(items)[0].presumed).toBe(false);
    expect(evaluateCompat(items, new Set(["mesa-redonda-lua+banqueta-carvalho"]))[0].presumed).toBe(true);
  });
  it("falta de dado nunca é sinal verde", () => {
    for (const r of evaluateCompat([{ slug: "mesa-redonda-lua" }, { slug: "banqueta-carvalho" }])) expect(r.status).not.toBe("ok");
  });
  it("alternativas vêm do catálogo com altura de assento conhecida", () => {
    const alt = alternativasPara(p("mesa-redonda-lua"), ["banqueta-carvalho"]);
    expect(alt).toContain("cadeira-jantar-fresta");
    expect(alt).not.toContain("banqueta-carvalho");
  });
  it("produto inexistente é ignorado", () => expect(evaluateCompat([{ slug: "nao-existe" }])).toEqual([]));
});

describe("Conecta Rota", () => {
  it("sem embalagem cadastrada: dados insuficientes, nunca favorável", () => {
    const r = checkAccess("poltrona-sol", { passagemCm: 200, stairs: "nao" });
    expect(r.status).toBe("insuficiente");
    expect(r.missing).toContain("dimensões da embalagem");
  });
  it("sem passagem informada: insuficiente", () => expect(checkAccess("mesa-jantar-ipe-6", {}).status).toBe("insuficiente"));
  it("passagem claramente estreita → atenção", () => expect(checkAccess("sofa-mata-3-lugares", { passagemCm: 50, stairs: "nao" }).status).toBe("atencao"));
  it("folga pequena → atenção", () => expect(checkAccess("sofa-mata-3-lugares", { passagemCm: 57, stairs: "nao" }).status).toBe("atencao"));
  it("medidas plausíveis e sem escadas → favorável com ressalva", () => {
    const r = checkAccess("sofa-mata-3-lugares", { passagemCm: 80, stairs: "nao" });
    expect(r.status).toBe("favoravel");
    expect(r.text).toMatch(/não é garantia/);
    expect(r.used.join(" ")).toMatch(/volume/);
  });
  it("escadas sim ou não sei não dão sinal verde", () => {
    expect(checkAccess("sofa-mata-3-lugares", { passagemCm: 80, stairs: "sim" }).status).toBe("insuficiente");
    expect(checkAccess("sofa-mata-3-lugares", { passagemCm: 80 }).status).toBe("insuficiente");
  });
  it("múltiplos volumes aparecem na justificativa", () => expect(checkAccess("guarda-roupa-3-portas", { passagemCm: 90, stairs: "nao" }).used.join()).toMatch(/4 volumes/));
  it("valores inválidos", () => {
    for (const v of [0, -5, NaN, 9999]) expect(checkAccess("sofa-mata-3-lugares", { passagemCm: v }).status).toBe("invalido");
  });
});

describe("Conecta Sem Arrependimento", () => {
  it("pets + limpeza fácil: sofá de limpeza fácil sobe; linho que exige cuidado recebe ressalva", () => {
    const r = advise({ ambiente: "sala", pets: "pets", limpeza: "prioridade" }, 20);
    const nuvem = r.find((x) => x.product.slug === "sofa-nuvem-2-lugares");
    if (nuvem) expect(nuvem.caveats.join()).toMatch(/cuidados/);
    const idx = (s: string) => r.findIndex((x) => x.product.slug === s);
    expect(idx("sofa-brisa-2-lugares")).toBeGreaterThanOrEqual(0);
    if (nuvem) expect(idx("sofa-brisa-2-lugares")).toBeLessThan(idx("sofa-nuvem-2-lugares"));
  });
  it("sem dado de limpeza: marca informação ausente em vez de assumir", () => {
    const r = advise({ ambiente: "sala", limpeza: "prioridade" }, 40);
    const semDado = r.find((x) => x.missing.includes("instruções de limpeza"));
    expect(semDado?.caveats.join()).toMatch(/não temos dados/);
  });
  it("orçamento baixo gera ressalva e toda sugestão tem motivo", () => {
    const r = advise({ perfil: "familia", budget: 500 }, 40);
    expect(r.every((x) => x.reasons.length > 0)).toBe(true);
    expect(r.some((x) => x.caveats.join().includes("orçamento"))).toBe(true);
  });
  it("só recomenda produtos em estoque do catálogo", () => expect(advise({ ambiente: "sala" }, 50).every((x) => x.product.stock > 0)).toBe(true));
});

describe("WhatsApp", () => {
  it("codifica o texto e usa só dados públicos", () => {
    const l = whatsappLink(productQuestion("Sofá & Cia", "Verde"));
    expect(l).toContain("wa.me/");
    expect(l).toContain(encodeURIComponent("Sofá & Cia"));
    expect(l).not.toContain("&Cia");
  });
});
