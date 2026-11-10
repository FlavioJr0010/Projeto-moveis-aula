import type { Product } from "@/data/products";
import type { PlacedItem } from "./types";

/**
 * Geometria 3D simples (caixas) dos móveis, em METROS. Sem dependências de three.js: fica testável e leve.
 * Origem de cada móvel: centro da base no chão; frente voltada para +z (para baixo na planta).
 */
export interface Part { size: [number, number, number]; pos: [number, number, number]; dark?: boolean }

type Shape = Pick<Product, "category" | "dims">;
const m = (cm: number) => cm / 100;

export function partsFor(p: Shape): Part[] {
  const w = m(p.dims.w), h = m(p.dims.h), d = m(p.dims.d);

  if (p.category === "mesas") {
    const top = Math.min(0.04, h / 3), leg = 0.05, lh = h - top, dx = w / 2 - 0.04, dz = d / 2 - 0.04;
    return [
      { size: [w, top, d], pos: [0, h - top / 2, 0] },
      ...([[-1, -1], [1, -1], [-1, 1], [1, 1]] as const).map(([sx, sz]): Part => ({ size: [leg, lh, leg], pos: [sx * dx, lh / 2, sz * dz], dark: true })),
    ];
  }
  if (p.category === "cadeiras") {
    const seat = Math.min(0.46, h * 0.5), t = 0.07, dx = w / 2 - 0.04, dz = d / 2 - 0.04;
    return [
      { size: [w, t, d * 0.9], pos: [0, seat, d * 0.05] },
      { size: [w * 0.9, h - seat - t / 2, 0.05], pos: [0, seat + t / 2 + (h - seat - t / 2) / 2, -d / 2 + 0.04] },
      ...([[-1, -1], [1, -1], [-1, 1], [1, 1]] as const).map(([sx, sz]): Part => ({ size: [0.04, seat, 0.04], pos: [sx * dx, seat / 2, sz * dz], dark: true })),
    ];
  }
  if (p.category === "sofas" || p.category === "poltronas") {
    const base = h * 0.45, back = h - base, arm = w * 0.09;
    return [
      { size: [w, base, d], pos: [0, base / 2, 0] },
      { size: [w, back, d * 0.22], pos: [0, base + back / 2, -d / 2 + d * 0.11] },
      { size: [arm, h * 0.62, d * 0.78], pos: [-(w / 2 - arm / 2), h * 0.31, d * 0.11] },
      { size: [arm, h * 0.62, d * 0.78], pos: [w / 2 - arm / 2, h * 0.31, d * 0.11] },
    ];
  }
  if (p.category === "camas") {
    const base = Math.min(0.45, h * 0.4);
    return [
      { size: [w, base, d], pos: [0, base / 2, 0] },
      { size: [w, h, 0.08], pos: [0, h / 2, -d / 2 + 0.04] },
    ];
  }
  return [{ size: [w, h, d], pos: [0, h / 2, 0] }];
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
