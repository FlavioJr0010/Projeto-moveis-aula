"use client";
import { usePlanner } from "@/lib/planner/store";
import { WALL_LABEL, WALLS, WIDTHS } from "@/lib/planner/openings";
import type { Wall } from "@/lib/planner/types";

/** Portas e janelas do ambiente: adicionar, trocar de parede, largura, lado da dobradiça e remover. */
export function OpeningsPanel() {
  const plan = usePlanner((s) => s.plan)!;
  const { addOpening, moveOpening, resizeOpening, flipOpening, removeOpening } = usePlanner.getState();
  const list = plan.openings ?? [];
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <p className="small muted" style={{ margin: 0 }}>Portas e janelas mudam onde os móveis podem ficar: a porta precisa abrir e a janela não deve ser encoberta. Na planta, arraste-as pela parede.</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" className="btn sm" onClick={() => addOpening("porta")}>+ Porta</button>
        <button type="button" className="btn sm" onClick={() => addOpening("janela")}>+ Janela</button>
      </div>
      {list.length === 0 ? <p className="small muted">Nenhuma porta ou janela. Adicione para a planta ficar mais fiel ao seu espaço.</p> : (
        <ul className="planner-list">
          {list.map((o) => {
            const label = o.kind === "porta" ? "Porta" : "Janela";
            return (
              <li key={o.id} className="planner-row" style={{ flexWrap: "wrap" }}>
                <b className="small" style={{ flex: "1 1 100%" }}>{label}</b>
                <label className="small" style={{ display: "grid", gap: 2 }}>Parede
                  <select className="field" value={o.wall} onChange={(e) => moveOpening(o.id, e.target.value as Wall, o.at)}>
                    {WALLS.map((w) => <option key={w} value={w}>{WALL_LABEL[w]}</option>)}
                  </select>
                </label>
                <label className="small" style={{ display: "grid", gap: 2 }}>Largura
                  <select className="field" value={o.w} onChange={(e) => resizeOpening(o.id, Number(e.target.value))}>
                    {WIDTHS[o.kind].map((w) => <option key={w} value={w}>{w} cm</option>)}
                  </select>
                </label>
                {o.kind === "porta" && <button type="button" className="btn sm ghost" onClick={() => flipOpening(o.id)}>Inverter lado</button>}
                <button type="button" className="btn sm ghost" onClick={() => removeOpening(o.id)} aria-label={`Remover ${label.toLowerCase()} da ${WALL_LABEL[o.wall].toLowerCase()}`}>Remover</button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
