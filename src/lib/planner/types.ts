import type { Ambiente } from "@/data/products";

/** Tudo em centímetros. Origem (0,0) no canto superior esquerdo da planta; y cresce para baixo. */
export type Rot = 0 | 90 | 180 | 270;

export interface Room { tipo: Ambiente; w: number; d: number; h?: number }

/** Item posicionado. (x, y) é o CENTRO do móvel. Guarda só o slug: preço e medidas vêm do catálogo. */
export interface PlacedItem { id: string; slug: string; x: number; y: number; rot: Rot }

export interface Plan {
  id: string;
  version: 1;
  nome: string;
  room: Room;
  items: PlacedItem[];
  createdAt: string;
  updatedAt: string;
}

/** Retângulo centrado em (x, y), com largura w (eixo x) e profundidade d (eixo y). */
export interface Rect { x: number; y: number; w: number; d: number }

export interface Dims { w: number; d: number; h?: number }
