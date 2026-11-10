"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { usePlanner } from "@/lib/planner/store";
import type { WallColor } from "@/lib/planner/model3d";
import type { Mode3D } from "./Scene3D";

// three.js só é baixado quando o usuário abre o 3D (não pesa no resto do site).
const Scene3D = dynamic(() => import("./Scene3D"), {
  ssr: false,
  loading: () => <p className="muted" role="status" style={{ padding: 16 }}>Carregando o 3D…</p>,
});

export function View3D({ errorIds }: { errorIds: Set<string> }) {
  const plan = usePlanner((s) => s.plan)!;
  const [mode, setMode] = useState<Mode3D>("orbita");
  const [wall, setWall] = useState<WallColor>("branco");

  return (
    <>
      <div className="planner-stage" style={{ touchAction: "none", "--ratio": 1.3 } as React.CSSProperties} role="img"
        aria-label={`Visualização 3D do ambiente de ${plan.room.w} por ${plan.room.d} centímetros com ${plan.items.length} ${plan.items.length === 1 ? "móvel" : "móveis"}. Arraste para girar.`}>
        <Scene3D plan={plan} errorIds={errorIds} mode={mode} wall={wall} />
      </div>
      <div className="planner-tools" role="toolbar" aria-label="Opções do 3D">
        <span className="seg" role="group" aria-label="Modo de visão">
          <button type="button" aria-pressed={mode === "orbita"} onClick={() => setMode("orbita")}>Visão geral</button>
          <button type="button" aria-pressed={mode === "dentro"} onClick={() => setMode("dentro")}>Dentro do ambiente</button>
        </span>
        <span className="seg" role="group" aria-label="Cor das paredes">
          <button type="button" aria-pressed={wall === "branco"} onClick={() => setWall("branco")}>Parede branca</button>
          <button type="button" aria-pressed={wall === "palha"} onClick={() => setWall("palha")}>Parede palha</button>
        </span>
        <span className="planner-sel small muted" style={{ flexBasis: "100%" }}>
          {mode === "orbita" ? "Arraste para girar ao redor; pince para aproximar." : "Arraste para olhar em volta (360°)."}
        </span>
      </div>
    </>
  );
}
