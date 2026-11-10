"use client";
import { Circle, Ellipse, Line, Rect } from "react-konva";
import type { Product } from "@/data/products";
import { shade, tint } from "@/lib/planner/model3d";

interface Props { p: Pick<Product, "category" | "name" | "dims">; fill: string; stroke: string; strokeWidth: number; bad: boolean; dash?: number[] }

/**
 * Símbolo de planta (vista de cima) de cada tipo de móvel, desenhado em cm e centrado em (0,0).
 * A frente do móvel fica para baixo (+y), como no resto do planejador.
 */
export function FurnitureSymbol({ p, fill, stroke, strokeWidth, bad, dash }: Props) {
  const { w, d } = p.dims;
  const hw = w / 2, hd = d / 2;
  const dark = bad ? "#8c1d18" : shade(fill, 0.35), light = bad ? "#ffb4ab" : tint(fill, 0.3);
  const base = bad ? "#e57368" : fill;
  const line = { stroke: dark, strokeWidth: 1, strokeScaleEnabled: false, listening: false } as const;
  const lo = 0.55;
  const shell = { stroke, strokeWidth, strokeScaleEnabled: false, dash, listening: false } as const;
  const r = Math.min(6, w / 6, d / 6);
  const inset = Math.min(5, w / 8, d / 8);

  // volume: degradê de luz (canto de cima) e sombra suave nas peças internas
  const grad = (c1: string, c2: string, x: number, y: number, ww: number, hh: number) => ({
    fillLinearGradientStartPoint: { x, y }, fillLinearGradientEndPoint: { x: x + ww, y: y + hh }, fillLinearGradientColorStops: [0, c1, 1, c2],
  });
  const soft = { shadowColor: dark, shadowBlur: 3, shadowOpacity: 0.4, shadowOffsetY: 1.5, shadowEnabled: true } as const;
  const body = <Rect x={-hw} y={-hd} width={w} height={d} cornerRadius={r} {...(bad ? { fill: base } : grad(tint(base, 0.14), shade(base, 0.1), -hw, -hd, w, d))} {...shell} />;

  if (p.category === "sofas" || p.category === "poltronas") {
    const arm = Math.max(w * 0.1, 9), back = Math.max(d * 0.26, 14);
    const n = p.category === "sofas" ? Math.max(2, Math.round(w / 70)) : 1;
    const inner = w - 2 * arm, cw = inner / n;
    return (
      <>
        {body}
        <Rect x={-hw + arm} y={-hd} width={inner} height={back} cornerRadius={r} fill={dark} opacity={0.35} listening={false} />
        <Rect x={-hw} y={-hd} width={arm} height={d} cornerRadius={r} fill={dark} opacity={0.4} listening={false} />
        <Rect x={hw - arm} y={-hd} width={arm} height={d} cornerRadius={r} fill={dark} opacity={0.4} listening={false} />
        {Array.from({ length: n }, (_, i) => (
          <Rect key={i} x={-hw + arm + cw * i + 2} y={-hd + back} width={cw - 4} height={d - back - 3} cornerRadius={r * 1.5} {...grad(tint(light, 0.2), light, -hw + arm + cw * i, -hd + back, cw, d - back)} opacity={0.9} {...line} {...soft} />
        ))}
      </>
    );
  }
  if (p.category === "camas") {
    const head = Math.min(12, d * 0.06), pillowH = Math.min(36, d * 0.18), two = w > 125;
    const pw = two ? (w - 36) / 2 : w - 24;
    return (
      <>
        {body}
        <Rect x={-hw} y={-hd} width={w} height={head} fill={dark} opacity={0.55} listening={false} />
        {(two ? [-1, 1] : [0]).map((s) => (
          <Rect key={s} x={s === 0 ? -pw / 2 : s * (pw / 2 + 6) - pw / 2} y={-hd + head + 6} width={pw} height={pillowH} cornerRadius={10} {...grad("#ffffff", light, -pw / 2, -hd + head + 6, pw, pillowH)} {...line} {...soft} opacity={0.95} />
        ))}
        <Rect x={-hw + 4} y={-hd + head + pillowH + 14} width={w - 8} height={d - head - pillowH - 18} cornerRadius={5} {...grad(tint(base, 0.22), shade(base, 0.05), -hw, -hd + head + pillowH + 14, w, d / 2)} opacity={0.95} {...line} {...soft} />
        <Line points={[-hw + 4, -hd + head + pillowH + 40, hw - 4, -hd + head + pillowH + 40]} {...line} opacity={lo} />
      </>
    );
  }
  if (p.category === "mesas") {
    if (/redond/i.test(p.name)) {
      return (
        <>
          <Ellipse x={0} y={0} radiusX={hw} radiusY={hd} {...(bad ? { fill: base } : { fillRadialGradientStartPoint: { x: -hw * 0.3, y: -hd * 0.3 }, fillRadialGradientStartRadius: 0, fillRadialGradientEndPoint: { x: 0, y: 0 }, fillRadialGradientEndRadius: hw, fillRadialGradientColorStops: [0, tint(base, 0.2), 1, shade(base, 0.1)] })} {...shell} />
          <Ellipse x={0} y={0} radiusX={hw - inset * 1.5} radiusY={hd - inset * 1.5} {...line} opacity={lo} />
          <Circle x={0} y={0} radius={Math.min(hw, hd) * 0.12} fill={dark} opacity={0.3} listening={false} />
        </>
      );
    }
    const gn = Math.max(2, Math.floor(Math.min(w, d) / 22));
    const grain = Array.from({ length: gn }, (_, i) => -hd + ((i + 1) * d) / (gn + 1));
    return (
      <>
        {body}
        <Rect x={-hw + inset} y={-hd + inset} width={w - 2 * inset} height={d - 2 * inset} cornerRadius={2} {...line} opacity={lo} />
        {grain.map((y, i) => <Line key={i} points={[-hw + inset * 2, y, hw - inset * 2, y]} {...line} opacity={0.18} />)}
      </>
    );
  }
  if (p.category === "cadeiras") {
    const back = Math.max(d * 0.22, 6);
    const round = Math.abs(w - d) < 6 && w >= 55; // giratória: assento redondo + encosto em arco
    return (
      <>
        {round ? <Circle x={0} y={0} radius={hw} fill={base} {...shell} /> : body}
        <Rect x={-hw * 0.82} y={-hd} width={w * 0.82} height={back} cornerRadius={round ? 8 : 3} fill={dark} opacity={0.5} listening={false} />
        <Rect x={-hw * 0.72} y={-hd + back + 3} width={w * 0.72} height={d - back - 9} cornerRadius={6} {...grad(tint(light, 0.2), light, -hw * 0.72, -hd + back + 3, w * 0.72, d - back)} opacity={0.85} {...line} {...soft} />
      </>
    );
  }
  if (p.category === "armarios") {
    const n = Math.max(1, Math.round(w / 50)), dw = w / n, front = Math.min(3, d / 10);
    return (
      <>
        {body}
        <Rect x={-hw} y={hd - front} width={w} height={front} fill={dark} opacity={0.5} listening={false} />
        {Array.from({ length: n - 1 }, (_, i) => <Line key={i} points={[-hw + dw * (i + 1), -hd + 1, -hw + dw * (i + 1), hd - 1]} {...line} opacity={lo} />)}
        {Array.from({ length: n }, (_, i) => <Circle key={`h${i}`} x={-hw + dw * (i + 0.5) + (i % 2 === 0 ? dw * 0.36 : -dw * 0.36)} y={hd - front - 2} radius={1.6} fill={dark} listening={false} />)}
      </>
    );
  }
  if (p.category === "estantes") {
    return (
      <>
        {body}
        <Rect x={-hw + inset / 2} y={-hd + inset / 2} width={w - inset} height={d - inset} {...line} opacity={lo} />
        <Line points={[-hw, -hd, hw, hd]} {...line} opacity={0.3} /><Line points={[hw, -hd, -hw, hd]} {...line} opacity={0.3} />
      </>
    );
  }
  if (p.category === "balcoes") {
    return (
      <>
        {body}
        <Rect x={-hw + inset} y={-hd + inset} width={w - 2 * inset} height={d - 2 * inset} cornerRadius={2} fill={light} opacity={0.45} {...line} />
        <Rect x={-hw} y={hd - 6} width={w} height={6} fill={dark} opacity={0.45} listening={false} />
      </>
    );
  }
  if (/divis/i.test(p.name)) return <>{body}<Line points={[-hw, 0, hw, 0]} {...line} opacity={lo} dash={[4, 3]} /></>;
  return (
    <>
      {body}
      <Rect x={-hw + inset} y={-hd + inset} width={w - 2 * inset} height={d - 2 * inset} cornerRadius={2} {...line} opacity={lo} />
    </>
  );
}
