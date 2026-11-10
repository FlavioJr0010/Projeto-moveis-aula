import { describe, expect, it } from "vitest";
import { clampCenter, collides, findFreeSpot, fitsRoom, footprint, inside, nextRot, overlaps, rectOf, snapToWalls, validRoomSize } from "./geometry";
import { validatePlan } from "./validate";
import { planLines, planTotal } from "./totals";
import type { Plan, PlacedItem, Room } from "./types";
import { products } from "@/data/products";

const room: Room = { tipo: "sala", w: 400, d: 300 };
const mk = (id: string, slug: string, x: number, y: number, rot: 0 | 90 | 180 | 270 = 0): PlacedItem => ({ id, slug, x, y, rot });
const plan = (items: PlacedItem[], r: Room = room): Plan => ({ id: "p", version: 1, nome: "t", room: r, items, createdAt: "", updatedAt: "" });

describe("geometria", () => {
  it("troca largura e profundidade em 90° e 270°", () => {
    expect(footprint({ w: 200, d: 90 }, 0)).toEqual({ w: 200, d: 90 });
    expect(footprint({ w: 200, d: 90 }, 90)).toEqual({ w: 90, d: 200 });
    expect(footprint({ w: 200, d: 90 }, 270)).toEqual({ w: 90, d: 200 });
    expect(nextRot(270)).toBe(0);
  });
  it("encostados não colidem; sobrepostos colidem", () => {
    const a = { x: 50, y: 50, w: 100, d: 100 };
    expect(overlaps(a, { x: 150, y: 50, w: 100, d: 100 })).toBe(false);
    expect(overlaps(a, { x: 149, y: 50, w: 100, d: 100 })).toBe(true);
    expect(collides(a, [{ x: 500, y: 500, w: 10, d: 10 }])).toBe(false);
  });
  it("detecta móvel fora das paredes e aceita encostado", () => {
    expect(inside({ x: 50, y: 50, w: 100, d: 100 }, room)).toBe(true);
    expect(inside({ x: 40, y: 50, w: 100, d: 100 }, room)).toBe(false);
    expect(inside({ x: 350, y: 250, w: 100, d: 100 }, room)).toBe(true);
    expect(inside({ x: 351, y: 250, w: 100, d: 100 }, room)).toBe(false);
  });
  it("clampCenter mantém dentro; maior que o ambiente é centralizado", () => {
    expect(clampCenter({ x: -20, y: 999, w: 100, d: 100 }, room)).toEqual({ x: 50, y: 250 });
    expect(clampCenter({ x: 0, y: 0, w: 500, d: 100 }, room)).toEqual({ x: 200, y: 50 });
  });
  it("fitsRoom considera as duas orientações", () => {
    expect(fitsRoom({ w: 350, d: 90 }, room)).toBe(true);
    expect(fitsRoom({ w: 310, d: 350 }, room)).toBe(false);
    expect(fitsRoom({ w: 290, d: 380 }, room)).toBe(true); // girado cabe
  });
  it("snapToWalls gruda perto da parede e não mexe longe dela", () => {
    expect(snapToWalls({ x: 55, y: 150, w: 100, d: 60 }, room)).toEqual({ x: 50, y: 150 });
    expect(snapToWalls({ x: 200, y: 150, w: 100, d: 60 }, room)).toEqual({ x: 200, y: 150 });
  });
  it("findFreeSpot acha vaga, tenta girar e devolve null sem espaço", () => {
    const spot = findFreeSpot({ w: 100, d: 50 }, room, []);
    expect(spot).not.toBeNull();
    expect(inside(rectOf(spot!, { w: 100, d: 50 }), room)).toBe(true);
    const tall = findFreeSpot({ w: 100, d: 350 }, room, []); // só cabe a 90°
    expect(tall?.rot).toBe(90);
    expect(findFreeSpot({ w: 100, d: 100 }, room, [{ x: 200, y: 150, w: 400, d: 300 }])).toBeNull();
    expect(findFreeSpot({ w: 500, d: 500 }, room, [])).toBeNull();
  });
  it("findFreeSpot prefere encostar na parede e deixa o centro livre", () => {
    const spot = findFreeSpot({ w: 100, d: 60 }, room, [])!;
    const r = rectOf(spot, { w: 100, d: 60 });
    const gap = Math.min(r.x - r.w / 2, room.w - (r.x + r.w / 2), r.y - r.d / 2, room.d - (r.y + r.d / 2));
    expect(gap).toBe(0); // encostado em alguma parede
    expect(overlaps(r, { x: 200, y: 150, w: 60, d: 60 })).toBe(false); // e não bloqueia o centro
  });
  it("valida medidas do ambiente", () => {
    expect(validRoomSize(300, 400)).toBeNull();
    expect(validRoomSize(50, 400)).toMatch(/pelo menos/);
    expect(validRoomSize(5000, 400)).toMatch(/no máximo/);
    expect(validRoomSize(NaN, 400)).toMatch(/Informe/);
  });
});

describe("validatePlan (produtos reais do catálogo)", () => {
  const sofa = "sofa-mata-3-lugares"; // 210x90
  it("plano válido não gera alertas", () => {
    expect(validatePlan(plan([mk("a", sofa, 105, 45)]))).toEqual([]);
  });
  it("móvel fora da parede", () => {
    const a = validatePlan(plan([mk("a", sofa, 20, 45)]));
    expect(a.map((x) => x.code)).toEqual(["fora"]);
  });
  it("sobreposição entre dois móveis", () => {
    const a = validatePlan(plan([mk("a", sofa, 105, 45), mk("b", "poltrona-sol", 120, 60)]));
    expect(a.some((x) => x.code === "colisao" && x.itemIds.includes("a") && x.itemIds.includes("b"))).toBe(true);
  });
  it("não cabe no ambiente", () => {
    const a = validatePlan(plan([mk("a", "cama-queen-aurora", 150, 150)], { tipo: "quarto", w: 150, d: 150 }));
    expect(a.map((x) => x.code)).toEqual(["nao-cabe"]);
  });
  it("altura maior que o pé-direito", () => {
    const a = validatePlan(plan([mk("a", "armario-nichos-carvalho", 45, 20)], { ...room, h: 180 }));
    expect(a.some((x) => x.code === "altura")).toBe(true);
  });
  it("aviso de estoque", () => {
    const p = products.find((x) => x.slug === "mesa-reuniao-8-lugares")!; // estoque 6
    const items = Array.from({ length: p.stock + 1 }, (_, i) => mk(`i${i}`, p.slug, 0, 0));
    expect(validatePlan(plan(items, { tipo: "sala-reuniao", w: 3000, d: 3000 })).some((x) => x.code === "estoque")).toBe(true);
  });
});

describe("totais", () => {
  it("agrupa por slug e usa o preço do carrinho", () => {
    const items = [mk("a", "criado-mudo-ipe", 0, 0), mk("b", "criado-mudo-ipe", 0, 0), mk("c", "poltrona-pluma", 0, 0)];
    expect(planLines(items)).toEqual([
      { slug: "criado-mudo-ipe", qty: 2, color: "Carvalho Claro", assembly: false },
      { slug: "poltrona-pluma", qty: 1, color: "Off-white", assembly: false },
    ]);
    expect(planTotal(items).merchandise).toBe(390 * 2 + 520);
    expect(planTotal([]).merchandise).toBe(0);
  });
  it("ignora slug desconhecido", () => {
    expect(planLines([mk("a", "nao-existe", 0, 0)])).toEqual([]);
  });
});

import { addItem, moveItem, removeItem, rotateItem } from "./ops";
import { sanitizePlan } from "./serialize";

describe("operações do plano", () => {
  const empty = plan([]);
  it("adiciona na área livre e recusa quando não cabe", () => {
    const r = addItem(empty, "sofa-mata-3-lugares", "a");
    expect(r.error).toBeUndefined();
    expect(validatePlan(r.plan)).toEqual([]);
    const small = plan([], { tipo: "quarto", w: 150, d: 150 });
    expect(addItem(small, "cama-queen-aurora", "b").error).toMatch(/não cabe/);
  });
  it("avisa quando o ambiente está cheio", () => {
    let p = plan([], { tipo: "sala", w: 220, d: 100 });
    p = addItem(p, "sofa-mata-3-lugares", "a").plan; // 210x90 ocupa quase tudo
    expect(addItem(p, "sofa-mata-3-lugares", "b").error).toMatch(/espaço livre/);
  });
  it("move dentro das paredes, gruda e recusa sobreposição", () => {
    let p = addItem(empty, "poltrona-sol", "a").plan;
    p = addItem(p, "sofa-mata-3-lugares", "b").plan;
    const moved = moveItem(p, "a", -500, -500); // além da parede: vai para o canto
    expect(moved.error).toBeUndefined();
    const a = moved.plan.items.find((i) => i.id === "a")!;
    expect(a.x).toBeCloseTo(75 / 2); expect(a.y).toBeCloseTo(78 / 2);
    const b = p.items.find((i) => i.id === "b")!;
    const hit = moveItem(moved.plan, "a", b.x, b.y);
    expect(hit.error).toMatch(/ocupado/);
    expect(hit.plan).toBe(moved.plan);
    expect(validatePlan(moved.plan)).toEqual([]);
  });
  it("gira, e recusa girar quando bate na parede", () => {
    const p = plan([mk("a", "sofa-mata-3-lugares", 105, 45)], { tipo: "sala", w: 220, d: 100 });
    expect(rotateItem(p, "a").error).toMatch(/não cabe|espaço/); // 90x210 não cabe em 100 de profundidade
    const ok = rotateItem(plan([mk("a", "poltrona-sol", 200, 150)]), "a");
    expect(ok.error).toBeUndefined();
    expect(ok.plan.items[0].rot).toBe(90);
  });
  it("remove", () => {
    expect(removeItem(plan([mk("a", "poltrona-sol", 100, 100)]), "a").items).toEqual([]);
  });
});

describe("sanitizePlan", () => {
  const valid = plan([mk("a", "poltrona-sol", 100, 100)]);
  it("aceita plano válido", () => expect(sanitizePlan(JSON.parse(JSON.stringify(valid)))?.items).toHaveLength(1));
  it("descarta lixo, versão errada e medidas absurdas", () => {
    expect(sanitizePlan(null)).toBeNull();
    expect(sanitizePlan({ ...valid, version: 2 })).toBeNull();
    expect(sanitizePlan({ ...valid, room: { ...valid.room, w: 99999 } })).toBeNull();
    expect(sanitizePlan({ ...valid, room: { ...valid.room, tipo: "garagem" } })).toBeNull();
  });
  it("remove itens com slug desconhecido ou rotação inválida", () => {
    const dirty = { ...valid, items: [...valid.items, mk("b", "nao-existe", 1, 1), { ...mk("c", "poltrona-sol", 1, 1), rot: 45 }] };
    expect(sanitizePlan(dirty)?.items.map((i) => i.id)).toEqual(["a"]);
  });
});

import { emptyHistory, LIMIT, record, redo, undo } from "./history";

describe("histórico (desfazer/refazer)", () => {
  const A = plan([]), B = plan([mk("a", "poltrona-sol", 100, 100)]), C = plan([mk("a", "poltrona-sol", 100, 100), mk("b", "criado-mudo-ipe", 200, 200)]);
  it("desfaz e refaz na ordem certa", () => {
    let h = record(record(emptyHistory(), A), B); // A -> B -> C (atual = C)
    const u1 = undo(h, C)!; expect(u1.plan).toBe(B);
    const u2 = undo(u1.history, u1.plan)!; expect(u2.plan).toBe(A);
    expect(undo(u2.history, u2.plan)).toBeNull();
    const r1 = redo(u2.history, u2.plan)!; expect(r1.plan).toBe(B);
    const r2 = redo(r1.history, r1.plan)!; expect(r2.plan).toBe(C);
    expect(redo(r2.history, r2.plan)).toBeNull();
  });
  it("uma nova mudança apaga o 'refazer'", () => {
    const u = undo(record(emptyHistory(), A), B)!;
    expect(u.history.future).toHaveLength(1);
    expect(record(u.history, A).future).toEqual([]);
  });
  it("limita o tamanho", () => {
    let h = emptyHistory();
    for (let i = 0; i < LIMIT + 20; i++) h = record(h, A);
    expect(h.past).toHaveLength(LIMIT);
  });
});

describe("store: histórico integrado", () => {
  it("add → undo → redo; operação recusada não entra no histórico", async () => {
    const { usePlanner } = await import("./store");
    const s = () => usePlanner.getState();
    s().newPlan({ tipo: "sala", w: 220, d: 200 });
    expect(s().history.past).toHaveLength(0);
    expect(s().add("poltrona-sol")).toBe(true);
    expect(s().plan!.items).toHaveLength(1);
    expect(s().history.past).toHaveLength(1);
    expect(s().add("criado-mudo-ipe")).toBe(true);
    expect(s().plan!.items).toHaveLength(2);
    const before = s().history.past.length;
    expect(s().add("mesa-reuniao-8-lugares")).toBe(false); // 240x110 não cabe em 220x200
    expect(s().history.past).toHaveLength(before);
    s().undo(); expect(s().plan!.items).toHaveLength(1);
    s().undo(); expect(s().plan!.items).toHaveLength(0);
    s().undo(); expect(s().plan!.items).toHaveLength(0); // sem passado: não quebra
    s().redo(); s().redo(); expect(s().plan!.items).toHaveLength(2);
    s().remove(s().plan!.items[0].id); expect(s().plan!.items).toHaveLength(1);
    s().undo(); expect(s().plan!.items).toHaveLength(2);
    s().close(); expect(s().history.past).toHaveLength(0);
  });
});

import { newId, UUID_RE } from "./ids";

describe("ids", () => {
  it("gera UUID v4 válido e único", () => {
    const a = newId(), b = newId();
    expect(a).toMatch(UUID_RE); expect(a).not.toBe(b);
    expect(a[14]).toBe("4");
  });
  it("funciona sem crypto.randomUUID (páginas http fora do localhost)", async () => {
    const orig = Object.getOwnPropertyDescriptor(globalThis, "crypto")!;
    Object.defineProperty(globalThis, "crypto", { value: { getRandomValues: (a: Uint8Array) => { for (let i = 0; i < a.length; i++) a[i] = (i * 37 + 11) & 255; return a; } }, configurable: true });
    try { expect(newId()).toMatch(UUID_RE); } finally { Object.defineProperty(globalThis, "crypto", orig); }
  });
});

import { partsFor, shade, worldPose } from "./model3d";

describe("modelo 3D", () => {
  it("todas as peças de todos os produtos ficam dentro das medidas reais", () => {
    for (const p of products) {
      const w = p.dims.w / 100, h = p.dims.h / 100, d = p.dims.d / 100, e = 1e-6;
      const parts = partsFor(p);
      expect(parts.length, p.slug).toBeGreaterThan(0);
      for (const { size, pos } of parts) {
        for (const v of [...size, ...pos]) expect(Number.isFinite(v), p.slug).toBe(true);
        expect(pos[0] - size[0] / 2, p.slug).toBeGreaterThanOrEqual(-w / 2 - e); expect(pos[0] + size[0] / 2, p.slug).toBeLessThanOrEqual(w / 2 + e);
        expect(pos[2] - size[2] / 2, p.slug).toBeGreaterThanOrEqual(-d / 2 - e); expect(pos[2] + size[2] / 2, p.slug).toBeLessThanOrEqual(d / 2 + e);
        expect(pos[1] - size[1] / 2, p.slug).toBeGreaterThanOrEqual(-e); expect(pos[1] + size[1] / 2, p.slug).toBeLessThanOrEqual(h + e);
      }
    }
  });
  it("a altura total do móvel é a altura do cadastro", () => {
    for (const p of products) {
      const top = Math.max(...partsFor(p).map((x) => x.pos[1] + x.size[1] / 2));
      expect(top, p.slug).toBeCloseTo(p.dims.h / 100, 5);
    }
  });
  it("planta (x,y) vira mundo (x,z) em metros; giro horário vira anti-horário", () => {
    expect(worldPose({ x: 250, y: 100, rot: 0 })).toEqual({ position: [2.5, 0, 1], rotationY: -0 });
    expect(worldPose({ x: 0, y: 0, rot: 90 }).rotationY).toBeCloseTo(-Math.PI / 2);
  });
  it("shade escurece sem estourar", () => {
    expect(shade("#ffffff", 0.5)).toBe("#808080");
    expect(shade("#000000")).toBe("#000000");
  });
});
