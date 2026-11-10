"use client";
import { usePlanner } from "@/lib/planner/store";
import type { PlanAlert } from "@/lib/planner/validate";

export function AlertsPanel({ alerts }: { alerts: PlanAlert[] }) {
  const select = usePlanner((s) => s.select);
  if (!alerts.length) return <p className="small" role="status">✓ Tudo certo: nenhum móvel ultrapassa as paredes ou se sobrepõe.</p>;
  return (
    <ul className="planner-list" aria-label="Alertas da planta">
      {alerts.map((a, i) => (
        <li key={i} className="planner-row" style={{ alignItems: "flex-start" }}>
          <span aria-hidden style={{ color: a.level === "erro" ? "var(--danger)" : "#b57d00", fontWeight: 800 }}>{a.level === "erro" ? "✕" : "!"}</span>
          <span style={{ flex: 1 }} className="small"><b>{a.level === "erro" ? "Problema: " : "Atenção: "}</b>{a.message}</span>
          <button type="button" className="btn sm ghost" onClick={() => select(a.itemIds[0])}>Ver</button>
        </li>
      ))}
    </ul>
  );
}
