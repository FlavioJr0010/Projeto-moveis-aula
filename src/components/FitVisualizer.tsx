"use client";
import { useRef, useState } from "react";
import type { Product } from "@/data/products";

/** Planta baixa em escala: o usuário informa o cômodo e arrasta o móvel para ver se cabe. */
export function FitVisualizer({ product }: { product: Product }) {
  const [rw, setRw] = useState(300);
  const [rd, setRd] = useState(400);
  const [door, setDoor] = useState(80);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const svg = useRef<SVGSVGElement>(null);

  const W = Math.max(100, rw), D = Math.max(100, rd);
  const pw = product.dims.w, pd = product.dims.d;
  const x = Math.min(Math.max(pos.x, 0), Math.max(0, W - pw));
  const y = Math.min(Math.max(pos.y, 0), Math.max(0, D - pd));
  const fits = pw <= W && pd <= D;
  const sorted = [product.dims.w, product.dims.d, product.dims.h].sort((a, b) => a - b);
  const passesDoor = sorted[0] <= door && sorted[1] <= 210;

  const toRoom = (e: React.PointerEvent) => {
    const r = svg.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * D };
  };
  const down = (e: React.PointerEvent) => { const p = toRoom(e); drag.current = { dx: p.x - x, dy: p.y - y }; (e.target as Element).setPointerCapture(e.pointerId); };
  const move = (e: React.PointerEvent) => { if (!drag.current) return; const p = toRoom(e); setPos({ x: p.x - drag.current.dx, y: p.y - drag.current.dy }); };
  const up = () => { drag.current = null; };

  const num = (set: (n: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => set(Number(e.target.value.replace(/\D/g, "")) || 0);

  return (
    <div className="fit">
      <div className="row3" style={{ marginBottom: 12 }}>
        <div><label className="small" htmlFor="fv-w">Largura do cômodo (cm)</label><input id="fv-w" className="field" inputMode="numeric" value={rw || ""} onChange={num(setRw)} /></div>
        <div><label className="small" htmlFor="fv-d">Comprimento (cm)</label><input id="fv-d" className="field" inputMode="numeric" value={rd || ""} onChange={num(setRd)} /></div>
        <div><label className="small" htmlFor="fv-p">Porta/elevador (cm)</label><input id="fv-p" className="field" inputMode="numeric" value={door || ""} onChange={num(setDoor)} /></div>
      </div>
      <svg ref={svg} viewBox={`-10 -10 ${W + 20} ${D + 20}`} role="img" aria-label={`Planta do cômodo de ${W} por ${D} centímetros com o móvel em escala`}>
        <rect x={0} y={0} width={W} height={D} fill="none" stroke="var(--muted)" strokeWidth={4} />
        <rect x={x} y={y} width={pw} height={pd} rx={6} fill={fits ? "var(--brand)" : "var(--danger)"} fillOpacity={0.8} stroke="var(--ink)" strokeWidth={2} style={{ cursor: "grab" }}
          onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} />
        <text x={x + pw / 2} y={y + pd / 2} textAnchor="middle" dominantBaseline="middle" fontSize={Math.max(12, Math.min(pw, pd) / 6)} fill="#fff" pointerEvents="none">{pw} × {pd}</text>
      </svg>
      <p className="small muted" style={{ margin: "8px 0" }}>Arraste o móvel pela planta. A escala é real.</p>
      <p className={fits ? "ok" : "bad"} style={{ margin: "0 0 6px" }}>
        {fits ? `✓ Cabe! Sobram ${W - pw} cm na largura e ${D - pd} cm no comprimento.` : "✗ Não cabe nesse cômodo com essas medidas."}
      </p>
      <p className={passesDoor ? "ok" : "bad"} style={{ margin: 0 }}>
        {passesDoor
          ? `✓ Passa pela porta de ${door} cm (menor medida: ${sorted[0]} cm).`
          : `⚠ A menor medida do móvel é ${sorted[0]} cm e a porta tem ${door} cm. Fale com a gente sobre entrega desmontada ou içamento.`}
      </p>
    </div>
  );
}
