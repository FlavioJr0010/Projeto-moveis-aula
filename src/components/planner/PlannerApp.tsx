"use client";
import { useEffect, useState } from "react";
import { usePlanner } from "@/lib/planner/store";
import { loadCurrent, saveCurrent } from "@/lib/planner/storage";
import { RoomSetup } from "./RoomSetup";
import { Workspace } from "./Workspace";

/** Decide entre "criar ambiente" e "editar planta". Restaura e salva automaticamente (localStorage). */
export function PlannerApp() {
  const plan = usePlanner((s) => s.plan);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const cur = loadCurrent();
    if (cur && !usePlanner.getState().plan) usePlanner.getState().load(cur);
    setReady(true);
    return usePlanner.subscribe((s, prev) => { if (s.plan !== prev.plan) saveCurrent(s.plan); });
  }, []);

  if (!ready) return <p className="muted" role="status">Carregando planejador…</p>;
  return plan ? <Workspace /> : <RoomSetup />;
}
