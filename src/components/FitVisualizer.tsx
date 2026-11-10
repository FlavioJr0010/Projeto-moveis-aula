"use client";
import { useRef, useState } from "react";
import type { Product } from "@/data/products";
import { checkAccess, type Stairs } from "@/lib/access";

/** Planta baixa em escala: o usuário informa o cômodo e arrasta o móvel para ver se cabe. */
export function FitVisualizer({ product }: { product: Product }) {
  const [rw, setRw] = useState(300);
  const [rd, setRd] = useState(400);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const svg = useRef<SVGSVGElement>(null);

  const W = Math.max(100, rw), D = Math.max(100, rd);
  const pw = product.dims.w, pd = product.dims.d;
  const x = Math.min(Math.max(pos.x, 0), Math.max(0, W - pw));
  const y = Math.min(Math.max(pos.y, 0), Math.max(0, D - pd));
  const fits = pw <= W && pd <= D;

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
      <div className="row3" style={{ marginBottom: 12, gridTemplateColumns: "1fr 1fr" }}>
        <div><label className="small" htmlFor="fv-w">Largura do cômodo (cm)</label><input id="fv-w" className="field" inputMode="numeric" value={rw || ""} onChange={num(setRw)} /></div>
        <div><label className="small" htmlFor="fv-d">Comprimento (cm)</label><input id="fv-d" className="field" inputMode="numeric" value={rd || ""} onChange={num(setRd)} /></div>
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
      <AccessCheck slug={product.slug} />
    </div>
  );
}

/** Conecta Rota (opcional): triagem conservadora de acesso para entrega. Nada aqui é obrigatório para comprar. */
function AccessCheck({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState("");
  const [stairs, setStairs] = useState<Stairs | "">("");
  const n = raw.trim() === "" ? undefined : Number(raw.replace(",", "."));
  const r = open ? checkAccess(slug, { passagemCm: n, stairs: stairs || undefined }) : null;
  const tone = r?.status === "favoravel" ? "ok" : r?.status === "atencao" || r?.status === "invalido" ? "bad" : "muted";
  return (
    <div style={{ marginTop: 14, borderTop: "1px solid var(--line)", paddingTop: 12 }}>
      {!open ? (
        <>
          <p style={{ margin: "0 0 8px" }}>Quer conferir se este móvel consegue passar pelas entradas da sua casa? Leva menos de um minuto se você já souber as medidas.</p>
          <button type="button" className="btn ghost sm" onClick={() => setOpen(true)}>Verificar acesso para entrega (opcional)</button>
        </>
      ) : (
        <div>
          <label className="small" htmlFor="ac-w">Largura livre da passagem mais estreita, em cm (porta, corredor ou elevador)</label>
          <input id="ac-w" className="field" inputMode="decimal" value={raw} onChange={(e) => setRaw(e.target.value)} placeholder="Ex.: 80 (deixe em branco se não sabe)" />
          <p className="small muted" style={{ margin: "4px 0 8px" }}>Meça entre os batentes, com a porta aberta a 90°.</p>
          <label className="small" htmlFor="ac-s">Há escada, curva fechada ou elevador no trajeto?</label>
          <select id="ac-s" className="field" value={stairs} onChange={(e) => setStairs(e.target.value as Stairs | "")}>
            <option value="">Prefiro não responder</option><option value="nao">Não</option><option value="sim">Sim</option><option value="nao-sei">Não sei</option>
          </select>
          {r && (
            <div role="status" style={{ marginTop: 10 }}>
              <p className={tone === "muted" ? "" : tone} style={{ margin: "0 0 4px" }}><b>{r.title}.</b> {r.text}</p>
              {r.used.length > 0 && <p className="small muted" style={{ margin: 0 }}>Medidas usadas: {r.used.join("; ")}.</p>}
              {r.missing.length > 0 && <p className="small muted" style={{ margin: 0 }}>Falta: {r.missing.join("; ")}.</p>}
            </div>
          )}
          <button type="button" className="btn ghost sm" style={{ marginTop: 8 }} onClick={() => { setOpen(false); setRaw(""); setStairs(""); }}>Fechar verificação</button>
        </div>
      )}
    </div>
  );
}
