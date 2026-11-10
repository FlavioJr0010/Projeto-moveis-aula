"use client";
import { useEffect, useState } from "react";
import { usePlanner } from "@/lib/planner/store";
import { loadCurrent, saveCurrent } from "@/lib/planner/storage";
import { fetchShared } from "@/lib/planner/cloud";
import { RoomSetup } from "./RoomSetup";
import { Workspace } from "./Workspace";

/** Decide entre "criar ambiente" e "editar planta". Restaura e salva automaticamente (localStorage). */
export function PlannerApp() {
  const plan = usePlanner((s) => s.plan);
  const [ready, setReady] = useState(false);
  const [info, setInfo] = useState<{ kind: "ok" | "erro"; text: string } | null>(null);

  useEffect(() => {
    let alive = true;
    const unsub = usePlanner.subscribe((s, prev) => { if (s.plan !== prev.plan) saveCurrent(s.plan); });
    const shared = new URLSearchParams(window.location.search).get("projeto");
    (async () => {
      if (shared) {
        const r = await fetchShared(shared);
        if (!alive) return;
        window.history.replaceState(null, "", "/planejador"); // tira o id da barra de endereço
        if (r.ok) {
          usePlanner.getState().load(r.plan);
          setInfo({ kind: "ok", text: `Projeto “${r.plan.nome}” aberto como cópia. As suas mudanças não alteram o original.` });
        } else {
          const cur = loadCurrent();
          if (cur && !usePlanner.getState().plan) usePlanner.getState().load(cur);
          setInfo({ kind: "erro", text: r.error });
        }
      } else {
        const cur = loadCurrent();
        if (cur && !usePlanner.getState().plan) usePlanner.getState().load(cur);
      }
      if (alive) setReady(true);
    })();
    return () => { alive = false; unsub(); };
  }, []);

  if (!ready) return <p className="muted" role="status">Carregando planejador…</p>;
  return (
    <>
      {info && <div className={`alert ${info.kind === "erro" ? "err-box" : "demo"}`} role={info.kind === "erro" ? "alert" : "status"} style={{ marginBottom: 12, display: "flex", gap: 10, justifyContent: "space-between", alignItems: "center" }}>
        <span>{info.text}</span><button type="button" className="btn sm ghost" onClick={() => setInfo(null)}>OK</button>
      </div>}
      {plan ? <Workspace /> : <RoomSetup />}
    </>
  );
}
