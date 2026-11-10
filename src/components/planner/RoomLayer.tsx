"use client";
import { Group, Line, Rect, Shape } from "react-konva";
import type Konva from "konva";
import type { Ambiente } from "@/data/products";
import { doorGeometry, pointOn, WALL_T, wallFrame } from "@/lib/planner/openings";
import type { Plant, Rug } from "@/lib/planner/decor";
import type { Opening, Room } from "@/lib/planner/types";

export interface Palette { room: string; wall: string; grid: string; gridMajor: string; text: string; danger: string; accent: string; plank: string; plankLine: string; wallFill: string; glass: string }

const TILE: Ambiente[] = ["cozinha"];
const HARD: Ambiente[] = ["recepcao", "loja", "escritorio", "sala-reuniao"];

/** Piso em uma única chamada de desenho: tábuas (madeira) ou porcelanato (cozinha/comercial). */
export function Floor({ room, pal, showGrid }: { room: Room; pal: Palette; showGrid: boolean }) {
  const tile = TILE.includes(room.tipo) || HARD.includes(room.tipo);
  const sceneFunc = (ctx: Konva.Context) => {
    const c = ctx as unknown as CanvasRenderingContext2D;
    c.fillStyle = pal.plank; c.fillRect(0, 0, room.w, room.d);
    if (!tile) { // cada tábua com um tom levemente diferente, como madeira de verdade
      const pw0 = 18, len0 = 120;
      let r0 = 0;
      for (let y = 0; y < room.d; y += pw0, r0++) {
        for (let x = (((r0 * 47) % len0) || len0) - len0, k = 0; x < room.w; x += len0, k++) {
          const v = (((r0 * 31 + k * 17) % 11) - 5) / 5;
          c.fillStyle = v > 0 ? `rgba(255,255,255,${v * 0.10})` : `rgba(60,35,10,${-v * 0.10})`;
          c.fillRect(Math.max(x, 0), y, Math.min(x + len0, room.w) - Math.max(x, 0), Math.min(pw0, room.d - y));
        }
      }
    } else { // porcelanato: placas alternadas com brilho
      const s0 = 60;
      for (let x = 0, i = 0; x < room.w; x += s0, i++) for (let y = 0, j = 0; y < room.d; y += s0, j++) {
        if ((i + j) % 2) { c.fillStyle = "rgba(255,255,255,0.18)"; c.fillRect(x, y, Math.min(s0, room.w - x), Math.min(s0, room.d - y)); }
      }
    }
    c.strokeStyle = pal.plankLine; c.lineWidth = 1; c.beginPath();
    if (tile) {
      const s = 60;
      for (let x = s; x < room.w; x += s) { c.moveTo(x, 0); c.lineTo(x, room.d); }
      for (let y = s; y < room.d; y += s) { c.moveTo(0, y); c.lineTo(room.w, y); }
    } else {
      const pw = 18, len = 120; // tábuas de 18 cm, emendas deslocadas
      let row = 0;
      for (let y = pw; y < room.d; y += pw, row++) c.moveTo(0, y), c.lineTo(room.w, y);
      row = 0;
      for (let y = 0; y < room.d; y += pw, row++) for (let x = ((row * 47) % len) || len; x < room.w; x += len) c.moveTo(x, y), c.lineTo(x, Math.min(y + pw, room.d));
    }
    c.stroke();
    // sombra suave junto às paredes (dá profundidade ao ambiente)
    const sh = Math.min(26, room.w / 8, room.d / 8);
    const edge = (x0: number, y0: number, x1: number, y1: number, rx: number, ry: number, rw: number, rh: number) => {
      const g = c.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, "rgba(20,12,4,0.28)"); g.addColorStop(1, "rgba(20,12,4,0)");
      c.fillStyle = g; c.fillRect(rx, ry, rw, rh);
    };
    edge(0, 0, 0, sh, 0, 0, room.w, sh); edge(0, room.d, 0, room.d - sh, 0, room.d - sh, room.w, sh);
    edge(0, 0, sh, 0, 0, 0, sh, room.d); edge(room.w, 0, room.w - sh, 0, room.w - sh, 0, sh, room.d);
    if (showGrid) {
      c.strokeStyle = pal.gridMajor; c.globalAlpha = 0.35; c.beginPath();
      for (let x = 0; x <= room.w; x += 100) { c.moveTo(x, 0); c.lineTo(x, room.d); }
      for (let y = 0; y <= room.d; y += 100) { c.moveTo(0, y); c.lineTo(room.w, y); }
      c.stroke(); c.globalAlpha = 1;
    }
  };
  return <Shape sceneFunc={sceneFunc} listening={false} strokeScaleEnabled={false} />;
}

/** Paredes com espessura (fora da área útil) e vãos recortados, com folha e arco da porta e vidro da janela. */
export function Walls({ room, openings, pal, selectedOpening, onSelect, onDragOpening }: {
  room: Room; openings: Opening[]; pal: Palette; selectedOpening: string | null;
  onSelect: (id: string) => void; onDragOpening: (id: string, x: number, y: number) => void;
}) {
  const t = WALL_T;
  const bands: { x: number; y: number; w: number; d: number }[] = [
    { x: -t, y: -t, w: room.w + 2 * t, d: t }, { x: -t, y: room.d, w: room.w + 2 * t, d: t },
    { x: -t, y: 0, w: t, d: room.d }, { x: room.w, y: 0, w: t, d: room.d },
  ];
  return (
    <>
      {bands.map((b, i) => <Rect key={i} x={b.x} y={b.y} width={b.w} height={b.d} fill={pal.wallFill} listening={false} />)}
      <Rect x={0} y={0} width={room.w} height={room.d} stroke={pal.wall} strokeWidth={1.5} strokeScaleEnabled={false} listening={false} />
      {openings.map((o) => {
        const f = wallFrame(o.wall, room);
        const [cx, cy] = pointOn(f, o.at); // centro do vão, sobre a linha interna da parede
        const sel = o.id === selectedOpening;
        const horiz = f.dir[0] !== 0;
        const hit = Math.max(o.w, 60);
        return (
          <Group key={o.id} x={cx} y={cy} draggable
            onDragStart={(e) => { e.cancelBubble = true; onSelect(o.id); }}
            onDragMove={(e) => { e.cancelBubble = true; }}
            onDragEnd={(e) => { e.cancelBubble = true; const n = e.target; onDragOpening(o.id, n.x(), n.y()); n.position({ x: cx, y: cy }); }}
            onClick={(e) => { e.cancelBubble = true; onSelect(o.id); }} onTap={(e) => { e.cancelBubble = true; onSelect(o.id); }}
          >
            {/* alvo de toque confortável */}
            <Rect x={horiz ? -hit / 2 : -30} y={horiz ? -30 : -hit / 2} width={horiz ? hit : 60} height={horiz ? 60 : hit} fill="rgba(0,0,0,0)" />
            <OpeningGlyph o={o} room={room} cx={cx} cy={cy} pal={pal} accent={sel ? pal.accent : pal.wall} sel={sel} />
          </Group>
        );
      })}
    </>
  );
}

function OpeningGlyph({ o, room, cx, cy, pal, accent, sel }: { o: Opening; room: Room; cx: number; cy: number; pal: Palette; accent: string; sel: boolean }) {
  const f = wallFrame(o.wall, room);
  const horiz = f.dir[0] !== 0;
  const t = WALL_T, half = o.w / 2;
  // faixa da parede que o vão atravessa: vai da linha interna para FORA
  const bx = horiz ? -half : f.inward[0] > 0 ? -t : 0, by = horiz ? (f.inward[1] > 0 ? -t : 0) : -half;
  const bw = horiz ? o.w : t, bh = horiz ? t : o.w;
  const sw = sel ? 2 : 1;
  if (o.kind === "janela") {
    const mids = [0.25, 0.5, 0.75].map((k) => (horiz ? by : bx) + k * t);
    return (
      <>
        <Rect x={bx} y={by} width={bw} height={bh} fill={pal.glass} stroke={accent} strokeWidth={sw} strokeScaleEnabled={false} listening={false} />
        {mids.map((k, i) => <Line key={i} points={horiz ? [-half, k, half, k] : [k, -half, k, half]} stroke={accent} strokeWidth={1} strokeScaleEnabled={false} listening={false} />)}
      </>
    );
  }
  const g = doorGeometry(o, room);
  const hinge: [number, number] = [g.hinge[0] - cx, g.hinge[1] - cy], open: [number, number] = [g.openEnd[0] - cx, g.openEnd[1] - cy];
  return (
    <>
      <Rect x={bx} y={by} width={bw} height={bh} fill={pal.room} listening={false} />
      <Line points={[...hinge, ...open]} stroke={accent} strokeWidth={sel ? 3 : 2} strokeScaleEnabled={false} lineCap="round" listening={false} />
      <Shape listening={false} sceneFunc={(ctx) => {
        const c = ctx as unknown as CanvasRenderingContext2D;
        c.save(); c.setLineDash([5, 4]); c.strokeStyle = accent; c.lineWidth = 1; c.beginPath();
        c.arc(hinge[0], hinge[1], o.w, g.startAngle, g.endAngle, g.anticlockwise); c.stroke(); c.restore();
      }} />
    </>
  );
}

/** Tapete (mesmo cálculo do 3D): base de lã, borda, miolo e franjas nas pontas. */
export function RugShape({ rug }: { rug: Rug }) {
  const sceneFunc = (ctx: Konva.Context) => {
    const c = ctx as unknown as CanvasRenderingContext2D;
    const x = rug.x - rug.w / 2, y = rug.y - rug.d / 2;
    c.save();
    c.shadowColor = "rgba(0,0,0,.28)"; c.shadowBlur = 6; c.shadowOffsetY = 2;
    c.fillStyle = rug.color; c.fillRect(x, y, rug.w, rug.d);
    c.restore();
    c.strokeStyle = "rgba(0,0,0,.20)"; c.lineWidth = 5; c.strokeRect(x + 9, y + 9, rug.w - 18, rug.d - 18);
    c.strokeStyle = "rgba(255,255,255,.28)"; c.lineWidth = 1.5; c.strokeRect(x + 20, y + 20, rug.w - 40, rug.d - 40);
    c.strokeStyle = "rgba(255,255,255,.35)"; c.lineWidth = 1; c.beginPath();
    for (let i = 0; i <= rug.w; i += 5) { c.moveTo(x + i, y); c.lineTo(x + i, y - 5); c.moveTo(x + i, y + rug.d); c.lineTo(x + i, y + rug.d + 5); }
    c.stroke();
  };
  return <Shape sceneFunc={sceneFunc} listening={false} />;
}

/** Planta de vaso vista de cima: folhas em leque com sombra. */
export function PlantShape({ plant }: { plant: Plant }) {
  const sceneFunc = (ctx: Konva.Context) => {
    const c = ctx as unknown as CanvasRenderingContext2D;
    c.save(); c.translate(plant.x, plant.y);
    c.fillStyle = "rgba(0,0,0,.22)"; c.beginPath(); c.ellipse(5, 6, plant.r, plant.r, 0, 0, 7); c.fill();
    c.fillStyle = "#b9a58b"; c.beginPath(); c.arc(0, 0, plant.r * 0.7, 0, 7); c.fill();
    c.fillStyle = "#3b2c20"; c.beginPath(); c.arc(0, 0, plant.r * 0.55, 0, 7); c.fill();
    const greens = ["#2f5a35", "#3f6b3a", "#4f7d42"];
    for (let ring = 0; ring < 3; ring++) {
      const n = 7 - ring, len = plant.r * (1.5 - ring * 0.32);
      for (let i = 0; i < n; i++) {
        c.save(); c.rotate((i / n) * Math.PI * 2 + ring * 0.5);
        c.fillStyle = greens[ring]; c.strokeStyle = "rgba(0,0,0,.25)"; c.lineWidth = 0.8;
        c.beginPath(); c.ellipse(len * 0.55, 0, len * 0.5, len * 0.2, 0, 0, 7); c.fill(); c.stroke();
        c.strokeStyle = "rgba(255,255,255,.25)"; c.beginPath(); c.moveTo(len * 0.1, 0); c.lineTo(len * 0.95, 0); c.stroke();
        c.restore();
      }
    }
    c.restore();
  };
  return <Shape sceneFunc={sceneFunc} listening={false} />;
}

/** Feixe de luz do sol entrando por cada janela (trapézio suave sobre o piso). */
export function Sunbeams({ room, openings }: { room: Room; openings: Opening[] }) {
  const sceneFunc = (ctx: Konva.Context) => {
    const c = ctx as unknown as CanvasRenderingContext2D;
    for (const o of openings) {
      if (o.kind !== "janela") continue;
      const f = wallFrame(o.wall, room), [cx, cy] = pointOn(f, o.at);
      const reach = Math.min(160, (f.dir[0] !== 0 ? room.d : room.w) * 0.5), spread = o.w * 0.35;
      const ex = f.inward[0] * reach, ey = f.inward[1] * reach, px = f.dir[0], py = f.dir[1];
      const g = c.createLinearGradient(cx, cy, cx + ex, cy + ey);
      g.addColorStop(0, "rgba(255,244,205,.38)"); g.addColorStop(1, "rgba(255,244,205,0)");
      c.fillStyle = g; c.beginPath();
      c.moveTo(cx - px * o.w / 2, cy - py * o.w / 2); c.lineTo(cx + px * o.w / 2, cy + py * o.w / 2);
      c.lineTo(cx + ex + px * (o.w / 2 + spread), cy + ey + py * (o.w / 2 + spread)); c.lineTo(cx + ex - px * (o.w / 2 + spread), cy + ey - py * (o.w / 2 + spread));
      c.closePath(); c.fill();
    }
  };
  return <Shape sceneFunc={sceneFunc} listening={false} />;
}
