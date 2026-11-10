"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Group, Layer, Line, Rect, Stage, Text } from "react-konva";
import type Konva from "konva";
import { bySlug } from "@/data/products";
import { clampCenter, clearanceRect, collides, footprint, rectOf } from "@/lib/planner/geometry";
import { nearestWall, WALL_LABEL } from "@/lib/planner/openings";
import { usePlanner } from "@/lib/planner/store";
import { FurnitureSymbol } from "./FurnitureSymbol";
import { decorFor } from "@/lib/planner/decor";
import { Floor, PlantShape, RugShape, Sunbeams, Walls, type Palette } from "./RoomLayer";

interface View { scale: number; x: number; y: number }
const PAD = 40;
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
/** Texto preto ou branco, conforme o brilho da cor do móvel (legível em qualquer tema). */
const inkOn = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.55 ? "#111111" : "#ffffff";
};
const meters = (cm: number) => `${(cm / 100).toFixed(2).replace(".", ",")} m`;

const LIGHT: Palette = { room: "#ffffff", wall: "#1d2a24", grid: "#e8e2d5", gridMajor: "#9a917c", text: "#1d2a24", danger: "#b3261e", accent: "#b9532c", plank: "#efe3cc", plankLine: "#dccdae", wallFill: "#b9b2a2", glass: "#cfe6f2" };
const DARK: Palette = { room: "#1a211d", wall: "#eef1ec", grid: "#263029", gridMajor: "#5b6b61", text: "#eef1ec", danger: "#ff8a80", accent: "#e08a62", plank: "#2a2f27", plankLine: "#363c32", wallFill: "#4b564f", glass: "#2c4350" };

function usePalette(): Palette {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setDark(mq.matches);
    const on = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return dark ? DARK : LIGHT;
}

/** Planta 2D em escala (1 unidade = 1 cm). O Stage é escalado, então posições ficam sempre em cm. */
export default function Canvas2D({ errorIds }: { errorIds: Set<string> }) {
  const plan = usePlanner((s) => s.plan)!;
  const selectedId = usePlanner((s) => s.selectedId);
  const { select, moveTo, rotate, remove, nudge, undo, redo } = usePlanner.getState();
  const canUndo = usePlanner((s) => s.history.past.length > 0);
  const canRedo = usePlanner((s) => s.history.future.length > 0);
  const pal = usePalette();
  const { room } = plan;
  const openings = plan.openings ?? [];
  const { moveOpening, flipOpening, removeOpening } = usePlanner.getState();
  const [selOpening, setSelOpening] = useState<string | null>(null);
  const [showDims, setShowDims] = useState(true);
  const [showZones, setShowZones] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [live, setLive] = useState<{ id: string; x: number; y: number } | null>(null);
  useEffect(() => { if (selectedId) setSelOpening(null); }, [selectedId]);

  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: Math.round(e.contentRect.width), h: Math.round(e.contentRect.height) }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fit = useMemo<View | null>(() => {
    if (!size.w || !size.h) return null;
    const s = Math.max(Math.min((size.w - PAD * 2) / room.w, (size.h - PAD * 2) / room.d), 0.02);
    return { scale: s, x: (size.w - room.w * s) / 2, y: (size.h - room.d * s) / 2 };
  }, [size, room.w, room.d]);

  const [view, setView] = useState<View | null>(null);
  const hasSize = size.w > 0;
  useEffect(() => { if (fit) setView(fit); /* reajusta ao trocar de planta/medidas */ }, [plan.id, room.w, room.d, hasSize]); // eslint-disable-line react-hooks/exhaustive-deps

  const minScale = (fit?.scale ?? 0.1) * 0.5, maxScale = (fit?.scale ?? 0.1) * 10;
  const zoomAt = (p: { x: number; y: number }, ns: number) => setView((v) => {
    if (!v) return v;
    const s = clamp(ns, minScale, maxScale);
    const pt = { x: (p.x - v.x) / v.scale, y: (p.y - v.y) / v.scale };
    return { scale: s, x: p.x - pt.x * s, y: p.y - pt.y * s };
  });

  // pinça (dois dedos): zoom + pan
  const pinch = useRef<{ dist: number; cx: number; cy: number } | null>(null);
  const onTouchMove = (e: Konva.KonvaEventObject<TouchEvent>) => {
    const [t1, t2] = [e.evt.touches[0], e.evt.touches[1]];
    if (!t1 || !t2 || !wrapRef.current) return;
    e.evt.preventDefault();
    const stage = e.target.getStage();
    if (stage?.isDragging()) stage.stopDrag();
    const r = wrapRef.current.getBoundingClientRect();
    const cx = (t1.clientX + t2.clientX) / 2 - r.left, cy = (t1.clientY + t2.clientY) / 2 - r.top;
    const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
    const last = pinch.current;
    pinch.current = { dist, cx, cy };
    if (!last || !last.dist) return;
    setView((v) => {
      if (!v) return v;
      const s = clamp(v.scale * (dist / last.dist), minScale, maxScale);
      const pt = { x: (cx - v.x) / v.scale, y: (cy - v.y) / v.scale };
      return { scale: s, x: cx - pt.x * s + (cx - last.cx), y: cy - pt.y * s + (cy - last.cy) };
    });
  };

  const decor = useMemo(() => decorFor(plan), [plan]);
  const items = useMemo(() => plan.items.flatMap((it) => { const p = bySlug(it.slug); return p ? [{ it, p }] : []; }), [plan.items]);
  const [drag, setDrag] = useState<{ id: string; bad: boolean } | null>(null);

  const onDragMove = (id: string, slug: string, rot: 0 | 90 | 180 | 270, node: Konva.Node) => {
    const p = bySlug(slug)!;
    const r0 = rectOf({ x: node.x(), y: node.y(), rot }, p.dims);
    const pos = clampCenter(r0, room); // nunca passa das paredes enquanto arrasta
    node.position(pos);
    setLive({ id, ...pos });
    const others = items.filter((o) => o.it.id !== id).map((o) => rectOf(o.it, o.p.dims));
    const bad = collides({ ...r0, ...pos }, others);
    setDrag((d) => (d && d.id === id && d.bad === bad ? d : { id, bad }));
  };
  const onDragEnd = (id: string, node: Konva.Node) => {
    setDrag(null); setLive(null);
    moveTo(id, node.x(), node.y());
    const now = usePlanner.getState().plan?.items.find((i) => i.id === id);
    if (now) node.position({ x: now.x, y: now.y }); // se foi recusado, volta ao último ponto válido
  };

  const sel = items.find((o) => o.it.id === selectedId);
  const fs = clamp(12 / (view?.scale ?? 1), 4, 40);

  const onKey = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") { e.preventDefault(); redo(); return; }
    if (selOpening) {
      if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); removeOpening(selOpening); setSelOpening(null); }
      else if (e.key === "Escape") setSelOpening(null);
      return;
    }
    if (!selectedId) return;
    const step = 10;
    const k = e.key.toLowerCase();
    const map: Record<string, [number, number]> = { arrowleft: [-step, 0], arrowright: [step, 0], arrowup: [0, -step], arrowdown: [0, step] };
    if (map[k]) { e.preventDefault(); nudge(selectedId, ...map[k]); }
    else if (k === "r") { e.preventDefault(); rotate(selectedId); }
    else if (k === "delete" || k === "backspace") { e.preventDefault(); remove(selectedId); }
    else if (k === "escape") select(null);
  };

  const selOp = openings.find((o) => o.id === selOpening);
  const pickOpening = (id: string) => { select(null); setSelOpening(id); };
  const dropOpening = (id: string, x: number, y: number) => { const n = nearestWall(x, y, room); moveOpening(id, n.wall, n.at); };
  const area = (room.w * room.d) / 10000;

  // cotas: distância (cm) do móvel selecionado/arrastado até cada parede
  const dimRect = sel ? rectOf({ x: live && live.id === sel.it.id ? live.x : sel.it.x, y: live && live.id === sel.it.id ? live.y : sel.it.y, rot: sel.it.rot }, sel.p.dims) : null;

  return (
    <>
    <div
      className="planner-stage" ref={wrapRef} tabIndex={0} onKeyDown={onKey}
      style={{ "--ratio": (room.w + 100) / (room.d + 100) } as React.CSSProperties}
      role="group" aria-label={`Planta do ambiente, ${meters(room.w)} por ${meters(room.d)}`} aria-describedby="planner-keys"
    >
      <p id="planner-keys" className="sr-only">Com um móvel selecionado: setas movem 10 centímetros, R gira 90 graus, Delete remove, Esc desmarca. Control Z desfaz e Control Shift Z refaz.</p>
      {view && size.w > 0 && (
        <Stage
          width={size.w} height={size.h} x={view.x} y={view.y} scaleX={view.scale} scaleY={view.scale}
          draggable onDragEnd={(e) => { if (e.target === e.target.getStage()) setView((v) => (v ? { ...v, x: e.target.x(), y: e.target.y() } : v)); }}
          onWheel={(e) => { e.evt.preventDefault(); const p = e.target.getStage()?.getPointerPosition(); if (p) zoomAt(p, view.scale * (e.evt.deltaY > 0 ? 1 / 1.12 : 1.12)); }}
          onMouseDown={(e) => { if (e.target === e.target.getStage()) { select(null); setSelOpening(null); } }}
          onTouchStart={(e) => { if (e.target === e.target.getStage()) { select(null); setSelOpening(null); } }}
          onTouchMove={onTouchMove} onTouchEnd={() => { pinch.current = null; }}
        >
          <Layer>
            <Floor room={room} pal={pal} showGrid={showGrid} />
            {decor.rug && <RugShape rug={decor.rug} />}
            <Sunbeams room={room} openings={openings} />
            <Walls room={room} openings={openings} pal={pal} selectedOpening={selOpening} onSelect={pickOpening} onDragOpening={dropOpening} />
            <Text x={0} y={-fs * 1.8} width={room.w} align="center" text={`${room.w} cm (${meters(room.w)})`} fontSize={fs} fill={pal.text} listening={false} />
            <Text x={-fs * 1.8} y={room.d} width={room.d} align="center" rotation={-90} text={`${room.d} cm (${meters(room.d)})`} fontSize={fs} fill={pal.text} listening={false} />

            {decor.plants.map((pl, i) => <PlantShape key={i} plant={pl} />)}

            {items.filter(({ it, p }) => p.planner?.clearance?.frente && (showZones || it.id === selectedId)).map(({ it, p }) => {
              const z = clearanceRect(it, p.dims, p.planner!.clearance!.frente);
              return <Rect key={`z${it.id}`} x={z.x - z.w / 2} y={z.y - z.d / 2} width={z.w} height={z.d} fill={pal.accent} opacity={it.id === selectedId ? 0.16 : 0.08} stroke={pal.accent} strokeWidth={1} strokeScaleEnabled={false} dash={[6, 4]} listening={false} />;
            })}

            {items.map(({ it, p }) => {
              const f = footprint(p.dims, it.rot);
              const bad = errorIds.has(it.id) || (drag?.id === it.id && drag.bad);
              const selected = it.id === selectedId;
              const hit = Math.max(44 / view.scale - p.dims.w, 0), hitD = Math.max(44 / view.scale - p.dims.d, 0); // alvo de toque mínimo ~44px
              return (
                <Group
                  key={it.id} x={it.x} y={it.y} rotation={it.rot} draggable
                  onDragStart={(e) => { e.cancelBubble = true; select(it.id); }}
                  onDragMove={(e) => { e.cancelBubble = true; onDragMove(it.id, it.slug, it.rot, e.target); }}
                  onDragEnd={(e) => { e.cancelBubble = true; onDragEnd(it.id, e.target); }}
                  onClick={() => select(it.id)} onTap={() => select(it.id)}
                >
                  <Rect x={-(p.dims.w + hit) / 2} y={-(p.dims.d + hitD) / 2} width={p.dims.w + hit} height={p.dims.d + hitD} fill="rgba(0,0,0,0)" />
                  <Rect x={-p.dims.w / 2 + 3} y={-p.dims.d / 2 + 4} width={p.dims.w} height={p.dims.d} cornerRadius={3} fill="#000" opacity={selected ? 0.22 : 0.14} listening={false} />
                  <FurnitureSymbol
                    p={p} fill={p.colors[0].hex} bad={bad} dash={drag?.id === it.id && drag.bad ? [6, 4] : undefined}
                    stroke={bad ? pal.danger : selected ? pal.accent : pal.wall} strokeWidth={selected ? 3 : 1.2}
                  />
                  {f.w * view.scale > 54 && f.d * view.scale > 26 && (
                    <Text
                      x={0} y={0} offsetX={f.w / 2} offsetY={fs} rotation={-it.rot} width={f.w} align="center"
                      text={`${p.name}\n${p.dims.w}×${p.dims.d}`} fontSize={fs * 0.85} lineHeight={1.15} wrap="none" ellipsis
                      fill={bad ? "#ffffff" : inkOn(p.colors[0].hex)} listening={false} shadowColor={bad ? "#000" : inkOn(p.colors[0].hex) === "#111111" ? "#fff" : "#000"} shadowBlur={2} shadowOpacity={0.6} shadowEnabled
                    />
                  )}
                </Group>
              );
            })}
            {showDims && dimRect && (() => {
              const r = dimRect, L = r.x - r.w / 2, R = r.x + r.w / 2, T = r.y - r.d / 2, B = r.y + r.d / 2;
              const segs: { pts: number[]; label: string; lx: number; ly: number }[] = [
                { pts: [L, r.y, 0, r.y], label: `${Math.round(L)}`, lx: L / 2, ly: r.y },
                { pts: [R, r.y, room.w, r.y], label: `${Math.round(room.w - R)}`, lx: (R + room.w) / 2, ly: r.y },
                { pts: [r.x, T, r.x, 0], label: `${Math.round(T)}`, lx: r.x, ly: T / 2 },
                { pts: [r.x, B, r.x, room.d], label: `${Math.round(room.d - B)}`, lx: r.x, ly: (B + room.d) / 2 },
              ];
              return segs.filter((g) => Number(g.label) > 2).map((g, i) => (
                <Group key={i} listening={false}>
                  <Line points={g.pts} stroke={pal.accent} strokeWidth={1} strokeScaleEnabled={false} dash={[4, 3]} />
                  <Text x={g.lx - fs * 2} y={g.ly - fs * 0.6} width={fs * 4} align="center" text={`${g.label} cm`} fontSize={fs * 0.8} fill={pal.accent} fontStyle="bold" stroke={pal.room} strokeWidth={fs * 0.25} fillAfterStrokeEnabled />
                </Group>
              ));
            })()}
          </Layer>
        </Stage>
      )}
    </div>

      <div className="planner-tools" role="toolbar" aria-label="Ferramentas da planta">
        {selOp ? (
          <>
            <span className="planner-sel small"><b>{selOp.kind === "porta" ? "Porta" : "Janela"}</b> · {selOp.w} cm · {WALL_LABEL[selOp.wall].toLowerCase()}. Arraste pela parede.</span>
            {selOp.kind === "porta" && <button type="button" className="tool" onClick={() => flipOpening(selOp.id)} aria-label="Inverter o lado da dobradiça">⇆</button>}
            <button type="button" className="tool danger" onClick={() => { removeOpening(selOp.id); setSelOpening(null); }} aria-label={`Remover ${selOp.kind}`}>🗑</button>
          </>
        ) : sel ? (
          <>
            <span className="planner-sel small"><b>{sel.p.name}</b> · {sel.p.dims.w}×{sel.p.dims.d}×{sel.p.dims.h} cm</span>
            <button type="button" className="tool" onClick={() => rotate(sel.it.id)} aria-label="Girar 90 graus">↻</button>
            <button type="button" className="tool" onClick={() => nudge(sel.it.id, -10, 0)} aria-label="Mover para a esquerda">←</button>
            <button type="button" className="tool" onClick={() => nudge(sel.it.id, 0, -10)} aria-label="Mover para cima">↑</button>
            <button type="button" className="tool" onClick={() => nudge(sel.it.id, 0, 10)} aria-label="Mover para baixo">↓</button>
            <button type="button" className="tool" onClick={() => nudge(sel.it.id, 10, 0)} aria-label="Mover para a direita">→</button>
            <button type="button" className="tool danger" onClick={() => remove(sel.it.id)} aria-label="Remover móvel">🗑</button>
          </>
        ) : (
          <span className="planner-sel small muted">Toque em um móvel, porta ou janela para selecioná-lo. Área: {area.toFixed(1).replace(".", ",")} m².</span>
        )}
        <span className="planner-view" role="group" aria-label="Exibição da planta">
          <button type="button" className="chip-btn" aria-pressed={showDims} onClick={() => setShowDims((v) => !v)}>Medidas</button>
          <button type="button" className="chip-btn" aria-pressed={showZones} onClick={() => setShowZones((v) => !v)}>Folgas</button>
          <button type="button" className="chip-btn" aria-pressed={showGrid} onClick={() => setShowGrid((v) => !v)}>Grade</button>
        </span>
        <span className="planner-zoom">
          <button type="button" className="tool" disabled={!canUndo} onClick={undo} aria-label="Desfazer (Ctrl+Z)">↶</button>
          <button type="button" className="tool" disabled={!canRedo} onClick={redo} aria-label="Refazer (Ctrl+Shift+Z)">↷</button>
          <button type="button" className="tool" onClick={() => zoomAt({ x: size.w / 2, y: size.h / 2 }, (view?.scale ?? 1) / 1.3)} aria-label="Diminuir zoom">−</button>
          <button type="button" className="tool" onClick={() => zoomAt({ x: size.w / 2, y: size.h / 2 }, (view?.scale ?? 1) * 1.3)} aria-label="Aumentar zoom">+</button>
          <button type="button" className="tool" onClick={() => fit && setView(fit)} aria-label="Ajustar a planta à tela">⤢</button>
        </span>
      </div>
    </>
  );
}
