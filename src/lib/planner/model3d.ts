import type { Product } from "@/data/products";
import { DOOR_H, WINDOW_H, WINDOW_SILL } from "./openings";
import type { Opening, PlacedItem } from "./types";

/**
 * Geometria 3D simples (caixas) dos móveis, em METROS. Sem dependências de three.js: fica testável e leve.
 * Origem de cada móvel: centro da base no chão; frente voltada para +z (para baixo na planta).
 */
/** role: main = cor do móvel; dark = pés e ferragens; soft = almofadas/estofado (um tom mais claro); accent = detalhes (puxadores). r = raio de arredondamento (m). */
export interface Part { size: [number, number, number]; pos: [number, number, number]; role?: "main" | "dark" | "soft" | "accent" | "light" | "fixed"; r?: number; dark?: boolean; /** cyl = cilindro vertical (size[0] = diâmetro); sphere = elipsoide inscrito na caixa */ shape?: "cyl" | "sphere"; /** cor própria (role "fixed"), p.ex. lombadas de livros */ color?: string }

type Shape = Pick<Product, "category" | "dims"> & Partial<Pick<Product, "name">>;
const m = (cm: number) => cm / 100;
const legs = (w: number, d: number, lh: number, t: number, inset = 0.04): Part[] =>
  ([[-1, -1], [1, -1], [-1, 1], [1, 1]] as const).map(([sx, sz]): Part => ({ size: [t, lh, t], pos: [sx * (w / 2 - inset), lh / 2, sz * (d / 2 - inset)], role: "dark", dark: true, shape: "cyl" }));

export function partsFor(p: Shape): Part[] {
  const w = m(p.dims.w), h = m(p.dims.h), d = m(p.dims.d);

  if (p.category === "mesas") {
    const top = Math.min(0.04, h / 3), lh = h - top, redonda = /redond/i.test(p.name ?? "");
    const parts: Part[] = [{ size: [w, top, d], pos: [0, h - top / 2, 0], r: redonda ? Math.min(w, d) / 2 - 1e-3 : 0.01 }];
    if (redonda) return [...parts, { size: [0.09, lh, 0.09], pos: [0, lh / 2, 0], role: "dark", dark: true }, { size: [w * 0.55, 0.03, d * 0.55], pos: [0, 0.015, 0], role: "dark", dark: true, r: 0.014 }];
    return [...parts, ...legs(w, d, lh, 0.055)];
  }
  if (p.category === "cadeiras") {
    const seat = Math.min(0.46, h * 0.5), t = 0.07;
    const back = h - seat - t / 2;
    return [
      { size: [w, t, d * 0.9], pos: [0, seat, d * 0.05], role: "soft", r: 0.02 },
      { size: [w * 0.9, back, 0.05], pos: [0, seat + t / 2 + back / 2, -d / 2 + 0.04], r: 0.02 },
      ...legs(w, d, seat - t / 2, 0.04),
    ];
  }
  if (p.category === "sofas" || p.category === "poltronas") {
    const lugares = p.category === "sofas" ? Math.max(2, Math.round(w / 0.7)) : 1;
    const baseH = h * 0.32, arm = Math.max(w * 0.08, 0.1), seatH = h * 0.2, backT = d * 0.24, foot = 0.07;
    const inner = w - 2 * arm, cw = inner / lugares;
    const cushions: Part[] = Array.from({ length: lugares }, (_, i): Part => ({
      size: [cw - 0.01, seatH, d - backT - 0.02], pos: [-inner / 2 + cw * (i + 0.5), foot + baseH + seatH / 2 - 0.02, backT / 2 + 0.005], role: "soft", r: 0.04,
    }));
    const backs: Part[] = Array.from({ length: lugares }, (_, i): Part => ({
      size: [cw - 0.02, h - foot - baseH - 0.02, backT * 0.7], pos: [-inner / 2 + cw * (i + 0.5), foot + baseH + (h - foot - baseH - 0.02) / 2 + 0.01, -d / 2 + backT * 0.7 / 2 + 0.02], role: "soft", r: 0.05,
    }));
    const py0 = foot + baseH + seatH - 0.02, ph = Math.max(0.12, Math.min(0.34, h - 0.03 - py0)), pw = Math.min(0.42, cw * 0.55);
    const pillow = (sx: number): Part => ({ size: [pw, ph, 0.13], pos: [sx * (inner / 2 - pw / 2 - 0.03), py0 + ph / 2, -d / 2 + backT + 0.09], role: "light", r: 0.06 });
    const pillows: Part[] = lugares >= 2 ? [pillow(-1), pillow(1)] : [];
    return [
      { size: [w, baseH, d], pos: [0, foot + baseH / 2, 0], r: 0.03 },
      { size: [arm, h * 0.62 - foot, d], pos: [-(w / 2 - arm / 2), foot + (h * 0.62 - foot) / 2, 0], r: 0.045 },
      { size: [arm, h * 0.62 - foot, d], pos: [w / 2 - arm / 2, foot + (h * 0.62 - foot) / 2, 0], r: 0.045 },
      { size: [inner, h - foot, backT * 0.3], pos: [0, foot + (h - foot) / 2, -d / 2 + backT * 0.15], r: 0.03 },
      ...cushions, ...backs, ...pillows,
      ...legs(w, d, foot, 0.05, 0.08),
    ];
  }
  if (p.category === "camas") {
    const base = Math.min(0.32, h * 0.3), mat = 0.2, head = h, foot = 0.1;
    const pw = (w - 0.12) / 2;
    return [
      { size: [w, base - foot, d], pos: [0, foot + (base - foot) / 2, 0], r: 0.02 },
      { size: [w, head - foot, 0.09], pos: [0, foot + (head - foot) / 2, -d / 2 + 0.045], r: 0.03 },
      { size: [w - 0.1, mat, d - 0.12], pos: [0, base + mat / 2, 0.04], role: "soft", r: 0.05 },
      { size: [pw, 0.12, 0.38], pos: [-(pw / 2 + 0.03), base + mat + 0.06, -d / 2 + 0.34], role: "soft", r: 0.05 },
      { size: [pw, 0.12, 0.38], pos: [pw / 2 + 0.03, base + mat + 0.06, -d / 2 + 0.34], role: "soft", r: 0.05 },
      { size: [w - 0.06, 0.05, d * 0.42], pos: [0, base + mat + 0.025, d / 2 - d * 0.21 - 0.02], role: "light", r: 0.025 },
      ...legs(w, d, foot, 0.06, 0.05),
    ];
  }
  if (p.category === "armarios") {
    const baixo = h < 1.2;
    const foot = baixo ? 0.04 : 0, body = h - foot, n = Math.max(1, Math.round(w / 0.5)), dw = w / n;
    const doors: Part[] = Array.from({ length: n }, (_, i): Part => ({ size: [dw - 0.006, body - 0.02, 0.012], pos: [-w / 2 + dw * (i + 0.5), foot + body / 2, d / 2 - 0.016], r: 0.004 }));
    const handles: Part[] = Array.from({ length: n }, (_, i): Part => ({
      size: [0.012, Math.min(0.18, body * 0.25), 0.01], pos: [-w / 2 + dw * (i + 0.5) + (i % 2 === 0 ? dw * 0.38 : -dw * 0.38), foot + body * (baixo ? 0.7 : 0.5), d / 2 - 0.005], role: "accent",
    }));
    return [{ size: [w, body, d - 0.018], pos: [0, foot + body / 2, -0.009], role: "dark", r: 0.005 }, ...doors, ...handles, ...(foot ? legs(w, d, foot, 0.04, 0.03) : [])];
  }
  if (p.category === "estantes") {
    const t = 0.025, n = Math.max(3, Math.round(h / 0.38));
    const side = (sx: number): Part => ({ size: [t, h, d], pos: [sx * (w / 2 - t / 2), h / 2, 0] });
    const shelves: Part[] = Array.from({ length: n + 1 }, (_, i): Part => ({ size: [w - 2 * t, t, d], pos: [0, i === n ? h - t / 2 : t / 2 + (i * (h - t)) / n, 0] }));
    const books: Part[] = [];
    const palette = ["#8c3b2f", "#2f5d62", "#d1a54a", "#3c4a6b", "#e8e1d0", "#6b7d4f", "#b0603a"];
    const bay = (h - t) / n;
    for (let i = 0; i < n; i++) {
      if (i % 2 === 1) continue; // prateleiras alternadas ficam com livros; as outras, vazias
      let x = -w / 2 + t + 0.02;
      for (let k = 0; x < w / 2 - t - 0.06; k++) {
        const bw = 0.025 + ((i * 7 + k * 5) % 4) * 0.008, bh = Math.min(bay - 0.06, 0.18 + ((i + k * 3) % 5) * 0.03);
        if (x + bw > w / 2 - t - 0.02) break;
        books.push({ size: [bw, bh, Math.min(d - 0.06, 0.2)], pos: [x + bw / 2, t + i * ((h - t) / n) + t / 2 + bh / 2, 0.01], role: "fixed", color: palette[(i * 3 + k) % palette.length] });
        x += bw + 0.004;
        if (k % 6 === 5) x += 0.09;
      }
    }
    return [side(-1), side(1), { size: [w - 2 * t, h - t, 0.01], pos: [0, (h - t) / 2 + t / 2, -d / 2 + 0.005], role: "dark" }, ...shelves, ...books];
  }
  if (p.category === "balcoes") {
    const top = 0.04;
    return [{ size: [w - 0.02, h - top, d - 0.04], pos: [0, (h - top) / 2, -0.02], r: 0.01 }, { size: [w, top, d], pos: [0, h - top / 2, 0], role: "soft", r: 0.01 }];
  }
  if (/divis/i.test(p.name ?? "")) return [{ size: [w, h - 0.05, d], pos: [0, 0.05 + (h - 0.05) / 2, 0], role: "soft", r: 0.01 }, ...[-1, 1].map((sx): Part => ({ size: [0.04, 0.05, d], pos: [sx * (w / 2 - 0.1), 0.025, 0], role: "dark", dark: true }))];
  return [{ size: [w, h, d], pos: [0, h / 2, 0], r: Math.min(0.015, Math.min(w, d, h) / 3) }];
}

export interface WallPiece { from: number; to: number; y0: number; y1: number }

/**
 * Recortes de uma parede (cm → m): trechos cheios entre os vãos, verga acima de cada vão e peitoril abaixo das janelas.
 * `from`/`to` são distâncias ao longo da parede; y em metros.
 */
export function wallPieces(len: number, height: number, openings: Pick<Opening, "kind" | "at" | "w">[]): WallPiece[] {
  const H = height / 100, L = len / 100;
  const ops = [...openings].sort((a, b) => a.at - b.at).map((o) => {
    const top = Math.min(o.kind === "porta" ? DOOR_H / 100 : (WINDOW_SILL + WINDOW_H) / 100, H);
    return { a: (o.at - o.w / 2) / 100, b: (o.at + o.w / 2) / 100, y0: o.kind === "porta" ? 0 : WINDOW_SILL / 100, y1: top };
  });
  const out: WallPiece[] = [];
  let cur = 0;
  for (const o of ops) {
    if (o.a > cur + 1e-6) out.push({ from: cur, to: o.a, y0: 0, y1: H });
    if (o.y0 > 1e-6) out.push({ from: o.a, to: o.b, y0: 0, y1: o.y0 });
    if (o.y1 < H - 1e-6) out.push({ from: o.a, to: o.b, y0: o.y1, y1: H });
    cur = o.b;
  }
  if (cur < L - 1e-6) out.push({ from: cur, to: L, y0: 0, y1: H });
  return out;
}

/** Posição e giro no mundo 3D. Planta (x, y) vira (x, z); o giro da planta é horário, o do three é anti-horário. */
export function worldPose(it: Pick<PlacedItem, "x" | "y" | "rot">): { position: [number, number, number]; rotationY: number } {
  return { position: [m(it.x), 0, m(it.y)], rotationY: (-it.rot * Math.PI) / 180 };
}

/** Escurece uma cor #rrggbb (fator 0 a 1) para pés e detalhes. */
export function shade(hex: string, amount = 0.4): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.round(v * (1 - amount)).toString(16).padStart(2, "0");
  return `#${f((n >> 16) & 255)}${f((n >> 8) & 255)}${f(n & 255)}`;
}

export const WALL_COLORS = { branco: "#f4f1ea", palha: "#d9c9a3" } as const;
export type WallColor = keyof typeof WALL_COLORS;

/** Clareia uma cor #rrggbb (fator 0 a 1) para estofados e almofadas. */
export function tint(hex: string, amount = 0.15): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.round(v + (255 - v) * amount).toString(16).padStart(2, "0");
  return `#${f((n >> 16) & 255)}${f((n >> 8) & 255)}${f(n & 255)}`;
}
