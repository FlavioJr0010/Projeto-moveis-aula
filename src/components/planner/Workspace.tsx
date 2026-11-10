"use client";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { usePlanner } from "@/lib/planner/store";
import { itemsWithError, validatePlan } from "@/lib/planner/validate";
import { AlertsPanel } from "./AlertsPanel";
import { CatalogPanel } from "./CatalogPanel";
import { ProjectPanel } from "./ProjectPanel";

// Konva usa `window`: carrega só no navegador e não pesa nas outras páginas.
const Canvas2D = dynamic(() => import("./Canvas2D"), {
  ssr: false,
  loading: () => <div className="planner-stage" role="status"><p className="muted" style={{ padding: 16 }}>Carregando planta…</p></div>,
});

type Tab = "moveis" | "projeto" | "alertas";

export function Workspace() {
  const plan = usePlanner((s) => s.plan)!;
  const notice = usePlanner((s) => s.notice);
  const clearNotice = usePlanner((s) => s.clearNotice);
  const [tab, setTab] = useState<Tab>("moveis");

  const alerts = useMemo(() => validatePlan(plan), [plan]);
  const errorIds = useMemo(() => itemsWithError(alerts), [alerts]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(clearNotice, 6000);
    return () => clearTimeout(t);
  }, [notice, clearNotice]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "moveis", label: "Móveis" },
    { id: "projeto", label: `Projeto (${plan.items.length})` },
    { id: "alertas", label: alerts.length ? `Alertas (${alerts.length})` : "Alertas" },
  ];

  return (
    <div className="planner">
      <div>
        {notice && <div className="alert err-box planner-notice" role="alert">{notice} <button type="button" className="btn sm ghost" onClick={clearNotice}>OK</button></div>}
        <Canvas2D errorIds={errorIds} />
        <p className="small muted" style={{ margin: "8px 0 0" }}>Arraste os móveis na planta, pince com dois dedos para dar zoom. Quadriculado: 50 cm.</p>
      </div>
      <aside className="planner-side" aria-label="Painel do planejador">
        <div role="tablist" aria-label="Seções" className="planner-tabs">
          {tabs.map((t) => (
            <button key={t.id} role="tab" type="button" id={`tab-${t.id}`} aria-selected={tab === t.id} aria-controls={`panel-${t.id}`} className={tab === t.id ? "on" : ""} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>
        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="planner-body">
          {tab === "moveis" && <CatalogPanel />}
          {tab === "projeto" && <ProjectPanel alerts={alerts} />}
          {tab === "alertas" && <AlertsPanel alerts={alerts} />}
        </div>
      </aside>
    </div>
  );
}
