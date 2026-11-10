"use client";
import { useEffect, useState } from "react";
import { ambientesList, type Ambiente } from "@/data/products";
import { ROOM_MAX, ROOM_MIN, validRoomSize } from "@/lib/planner/geometry";
import { deleteProject, listProjects } from "@/lib/planner/storage";
import { usePlanner } from "@/lib/planner/store";
import type { Plan } from "@/lib/planner/types";

const PRESETS: { label: string; tipo: Ambiente; w: number; d: number }[] = [
  { label: "Quarto 3 × 3 m", tipo: "quarto", w: 300, d: 300 },
  { label: "Sala 4 × 3,5 m", tipo: "sala", w: 400, d: 350 },
  { label: "Home office 2,5 × 2,5 m", tipo: "home-office", w: 250, d: 250 },
  { label: "Escritório 6 × 5 m", tipo: "escritorio", w: 600, d: 500 },
  { label: "Recepção 5 × 4 m", tipo: "recepcao", w: 500, d: 400 },
  { label: "Sala de reunião 5 × 4 m", tipo: "sala-reuniao", w: 500, d: 400 },
];

const digits = (v: string) => v.replace(/\D/g, "").slice(0, 4);

export function RoomSetup() {
  const newPlan = usePlanner((s) => s.newPlan);
  const load = usePlanner((s) => s.load);
  const [tipo, setTipo] = useState<Ambiente>("sala");
  const [w, setW] = useState("");
  const [d, setD] = useState("");
  const [h, setH] = useState("");
  const [nome, setNome] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState<Plan[]>([]);
  useEffect(() => setSaved(listProjects()), []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const e1 = validRoomSize(Number(w), Number(d));
    if (e1) return setErr(e1);
    if (h && (Number(h) < 180 || Number(h) > 600)) return setErr("O pé-direito deve ficar entre 180 e 600 cm (ou deixe em branco).");
    setErr(null);
    newPlan({ tipo, w: Number(w), d: Number(d), ...(h ? { h: Number(h) } : {}) }, nome);
  };

  return (
    <div style={{ display: "grid", gap: 24, maxWidth: 720 }}>
      <p className="muted" style={{ margin: 0 }}>Informe as medidas do espaço (em centímetros). Vamos desenhar a planta em escala para você posicionar os móveis.</p>

      <form onSubmit={submit} className="card" style={{ padding: 18, display: "grid", gap: 14 }} noValidate>
        <div>
          <label className="small" htmlFor="pl-tipo">Tipo de ambiente</label>
          <select id="pl-tipo" className="field" value={tipo} onChange={(e) => setTipo(e.target.value as Ambiente)}>
            {ambientesList.map((a) => <option key={a.slug} value={a.slug}>{a.label}</option>)}
          </select>
        </div>
        <div className="row3">
          <div><label className="small" htmlFor="pl-w">Largura (cm)</label><input id="pl-w" className="field" inputMode="numeric" value={w} onChange={(e) => setW(digits(e.target.value))} placeholder="ex.: 400" aria-describedby="pl-help" /></div>
          <div><label className="small" htmlFor="pl-d">Profundidade (cm)</label><input id="pl-d" className="field" inputMode="numeric" value={d} onChange={(e) => setD(digits(e.target.value))} placeholder="ex.: 350" aria-describedby="pl-help" /></div>
          <div><label className="small" htmlFor="pl-h">Pé-direito (cm)</label><input id="pl-h" className="field" inputMode="numeric" value={h} onChange={(e) => setH(digits(e.target.value))} placeholder="opcional" /></div>
        </div>
        <p id="pl-help" className="small muted" style={{ margin: 0 }}>De {ROOM_MIN} cm a {ROOM_MAX} cm. 100 cm = 1 metro.</p>
        <div>
          <label className="small" htmlFor="pl-nome">Nome do projeto (opcional)</label>
          <input id="pl-nome" className="field" value={nome} maxLength={80} onChange={(e) => setNome(e.target.value)} placeholder="ex.: Quarto do bebê" />
        </div>
        {err && <div className="alert err-box" role="alert">{err}</div>}
        <button className="btn block">Criar planta</button>
      </form>

      <section aria-labelledby="pl-presets">
        <h2 id="pl-presets" style={{ fontSize: "1.1rem" }}>Ou comece por um modelo</h2>
        <div className="chips">
          {PRESETS.map((p) => (
            <button key={p.label} type="button" className="chip" style={{ minHeight: 44 }} onClick={() => { setTipo(p.tipo); setW(String(p.w)); setD(String(p.d)); setErr(null); }}>{p.label}</button>
          ))}
        </div>
      </section>

      {saved.length > 0 && (
        <section aria-labelledby="pl-saved">
          <h2 id="pl-saved" style={{ fontSize: "1.1rem" }}>Projetos salvos neste aparelho</h2>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
            {saved.map((p) => (
              <li key={p.id} className="card" style={{ padding: 12, display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
                <span><b>{p.nome}</b><br /><span className="small muted">{p.room.w}×{p.room.d} cm · {p.items.length} {p.items.length === 1 ? "móvel" : "móveis"}</span></span>
                <span style={{ display: "flex", gap: 8 }}>
                  <button type="button" className="btn sm" onClick={() => load(p)}>Abrir</button>
                  <button type="button" className="btn sm ghost" aria-label={`Excluir projeto ${p.nome}`} onClick={() => { deleteProject(p.id); setSaved(listProjects()); }}>Excluir</button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
