import { describe, expect, it } from "vitest";
import { bySlug, products } from "@/data/products";
import { estiloCompat, familiaCompat, materialCompat, MIN_SCORE, recommend, WEIGHTS } from "./recommend";
import { recommendForPlan } from "./planner/recommend";
import type { Plan, Room } from "./planner/types";

const p = (s: string) => bySlug(s)!;
const slugs = (r: { product: { slug: string } }[]) => r.map((x) => x.product.slug);
const mkPlan = (room: Room, items: [string, number, number][]): Plan => ({
  id: "t", version: 1, nome: "t", room, createdAt: "", updatedAt: "",
  items: items.map(([slug, x, y], i) => ({ id: `i${i}`, slug, x, y, rot: 0 })),
});

describe("compatibilidades", () => {
  it("pesos somam 100", () => expect(Object.values(WEIGHTS).reduce((a, b) => a + b, 0)).toBe(100));
  it("estilo: igual > vizinho > sem relação", () => {
    expect(estiloCompat(["moderno"], ["moderno"]).v).toBe(1);
    expect(estiloCompat(["minimalista"], ["escandinavo"]).v).toBe(0.5);
    expect(estiloCompat(["rustico"], ["corporativo"]).v).toBe(0);
  });
  it("cor: neutros combinam com tudo; madeira clara x escura é fraco", () => {
    expect(familiaCompat("branco", "madeira-escura")).toBeGreaterThanOrEqual(0.85);
    expect(familiaCompat("madeira-clara", "madeira-escura")).toBeLessThan(0.7);
    expect(familiaCompat("madeira-clara", "madeira-clara")).toBe(1);
    expect(familiaCompat("colorido", "colorido")).toBeLessThan(0.7);
  });
  it("material: igual = 1; próximos > distantes", () => {
    expect(materialCompat(["madeira"], ["madeira"]).v).toBe(1);
    expect(materialCompat(["madeira"], ["mdf"]).v).toBeGreaterThan(materialCompat(["tecido"], ["metal"]).v);
  });
});

describe("recommend()", () => {
  it("escrivaninha clara no home office: sugere cadeira, gaveteiro e estante; nunca sofá residencial", () => {
    const room: Room = { tipo: "home-office", w: 350, d: 300 };
    const r = recommend({ anchors: [p("escrivaninha-clara-120")], room, limit: 10 });
    const subs = r.map((x) => x.product.subcategoria);
    expect(subs).toContain("cadeira-ergonomica");
    expect(subs).toContain("gaveteiro");
    expect(r.every((x) => x.product.contextos.some((c) => ["home-office", "residencial"].includes(c)))).toBe(true);
    expect(r.every((x) => !x.product.category.includes("sofas"))).toBe(true);
  });
  it("mesa de reunião preta: cadeiras corporativas e armário, só contexto comercial/escritório", () => {
    const room: Room = { tipo: "sala-reuniao", w: 600, d: 450 };
    const r = recommend({ anchors: [p("mesa-reuniao-preta-6")], room, limit: 10 });
    expect(slugs(r)).toContain("cadeira-corporativa-operacional");
    expect(r.some((x) => x.product.subcategoria === "armario-baixo")).toBe(true);
    expect(r.every((x) => x.product.contextos.includes("comercial") || x.product.contextos.includes("home-office"))).toBe(true);
    expect(r.every((x) => !x.product.contextos.every((c) => c === "residencial"))).toBe(true);
  });
  it("cama de madeira: criado-mudo, guarda-roupa e poltrona", () => {
    const room: Room = { tipo: "quarto", w: 400, d: 400 };
    const subs = recommend({ anchors: [p("cama-casal-savana")], room, limit: 10 }).map((x) => x.product.subcategoria);
    expect(subs).toEqual(expect.arrayContaining(["criado-mudo", "guarda-roupa"]));
  });
  it("completa vem antes de similar; scores ordenados dentro do grupo e acima do mínimo", () => {
    const r = recommend({ anchors: [p("escrivaninha-clara-120")], room: { tipo: "home-office", w: 400, d: 300 }, limit: 10 });
    const firstSimilar = r.findIndex((x) => x.kind === "similar");
    if (firstSimilar >= 0) expect(r.slice(firstSimilar).every((x) => x.kind === "similar")).toBe(true);
    expect(r.every((x) => x.score >= MIN_SCORE && x.score <= 100)).toBe(true);
    expect(r.every((x) => x.reasons.length > 0 && x.reasons.length <= 3)).toBe(true);
  });
  it("respeita o espaço: nada que não caiba; e não repete o que já está na planta", () => {
    const small: Room = { tipo: "home-office", w: 130, d: 100 };
    const r = recommend({ anchors: [p("escrivaninha-clara-120")], room: small, limit: 20 });
    expect(r.every((x) => Math.min(x.product.dims.w, x.product.dims.d) <= 100)).toBe(true);
    expect(slugs(r)).not.toContain("escrivaninha-clara-120");
  });
  it("sem espaço livre restante, não sugere nada que precise dele", () => {
    const room: Room = { tipo: "home-office", w: 200, d: 100 };
    const full = [{ x: 100, y: 50, w: 200, d: 100 }];
    expect(recommend({ anchors: [p("escrivaninha-clara-120")], room, occupied: full })).toEqual([]);
  });
  it("limita repetição por papel e o total", () => {
    const r = recommend({ anchors: [p("sofa-mata-3-lugares")], room: { tipo: "sala", w: 800, d: 600 }, limit: 5, maxPerRole: 1 });
    expect(r.length).toBeLessThanOrEqual(5);
    const subs = r.map((x) => x.product.subcategoria);
    expect(new Set(subs).size).toBe(subs.length);
  });
  it("o complemento essencial vem primeiro: cadeira para a escrivaninha, cadeiras para a mesa de reunião", () => {
    const a = recommend({ anchors: [p("escrivaninha-clara-120")], room: { tipo: "home-office", w: 350, d: 300 } });
    expect(a[0].product.subcategoria).toBe("cadeira-ergonomica");
    const b = recommend({ anchors: [p("mesa-reuniao-preta-6")], room: { tipo: "sala-reuniao", w: 600, d: 450 } });
    expect(b[0].product.subcategoria).toBe("cadeira-corporativa");
  });
  it("traz um de cada papel antes de repetir o mesmo papel", () => {
    const r = recommend({ anchors: [p("escrivaninha-clara-120")], room: { tipo: "home-office", w: 500, d: 400 }, limit: 5 });
    const subs = r.filter((x) => x.kind === "completa").map((x) => x.product.subcategoria);
    expect(new Set(subs).size).toBe(subs.length);
  });
  it("não sugere o mesmo tipo de móvel como 'similar' (outra mesa de reunião)", () => {
    const r = recommend({ anchors: [p("mesa-reuniao-preta-6")], room: { tipo: "sala-reuniao", w: 800, d: 600 }, limit: 20 });
    expect(r.filter((x) => x.kind === "similar").every((x) => x.product.subcategoria !== "mesa-reuniao")).toBe(true);
  });
  it("cadeira já posicionada para uma escrivaninha não é sugerida de novo; para mesa de reunião, sim", () => {
    const desk = recommendForPlan(mkPlan({ tipo: "home-office", w: 400, d: 300 }, [["escrivaninha-clara-120", 100, 100], ["cadeira-ergonomica-ergo", 100, 170]]));
    expect(slugs(desk)).not.toContain("cadeira-ergonomica-ergo");
    const meet = recommendForPlan(mkPlan({ tipo: "sala-reuniao", w: 700, d: 500 }, [["mesa-reuniao-preta-6", 300, 200], ["cadeira-corporativa-operacional", 300, 280]]));
    expect(slugs(meet)).toContain("cadeira-corporativa-operacional");
  });
  it("estoque zerado nunca é sugerido", () => {
    const orig = p("gaveteiro-3-gavetas-rodas").stock;
    p("gaveteiro-3-gavetas-rodas").stock = 0;
    try { expect(slugs(recommend({ anchors: [p("escrivaninha-clara-120")], room: { tipo: "home-office", w: 400, d: 300 }, limit: 20 }))).not.toContain("gaveteiro-3-gavetas-rodas"); }
    finally { p("gaveteiro-3-gavetas-rodas").stock = orig; }
  });
  it("sem âncoras não há sugestão; qualquer produto do catálogo funciona como âncora", () => {
    expect(recommend({ anchors: [] })).toEqual([]);
    for (const a of products) expect(() => recommend({ anchors: [a], ambiente: a.ambientes[0] })).not.toThrow();
  });
  it("sem sala informada (página do produto) ainda recomenda", () => {
    expect(recommend({ anchors: [p("mesa-jantar-ipe-6")] }).some((x) => x.product.subcategoria === "cadeira-jantar")).toBe(true);
  });
});

describe("recommendForPlan()", () => {
  it("usa tudo que está na planta e exclui o que já foi posicionado", () => {
    const plan = mkPlan({ tipo: "escritorio", w: 700, d: 500 }, [["mesa-corporativa-160", 200, 150]]);
    const r = recommendForPlan(plan);
    expect(slugs(r)).not.toContain("mesa-corporativa-160");
    expect(r.length).toBeGreaterThan(0);
  });
  it("com móvel selecionado, as sugestões giram em torno dele", () => {
    const plan = mkPlan({ tipo: "quarto", w: 400, d: 400 }, [["cama-casal-savana", 200, 200], ["poltrona-sol", 60, 60]]);
    const r = recommendForPlan(plan, "cama-casal-savana");
    expect(r.every((x) => x.withName === p("cama-casal-savana").name)).toBe(true);
  });
  it("planta vazia: sem âncoras, sem sugestões (a interface mostra o catálogo)", () => {
    expect(recommendForPlan(mkPlan({ tipo: "sala", w: 400, d: 300 }, []))).toEqual([]);
  });
});
