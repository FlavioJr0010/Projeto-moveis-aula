"use client";
import Image from "next/image";
import { useMemo, useState } from "react";
import { bySlug, img } from "@/data/products";
import { brl } from "@/lib/format";
import { recommendForPlan } from "@/lib/planner/recommend";
import { usePlanner } from "@/lib/planner/store";
import type { Reco } from "@/lib/recommend";

const fit = (score: number) => (score >= 85 ? "Combina muito" : score >= 65 ? "Combina bem" : "Pode combinar");

function Card({ r, onAdd }: { r: Reco; onAdd: () => void }) {
  const p = r.product;
  return (
    <li className="planner-row" style={{ alignItems: "flex-start" }}>
      <Image src={img(p.images[0], 160, 160)} alt="" width={56} height={56} style={{ borderRadius: 10, objectFit: "cover", flex: "none" }} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <b className="small" style={{ display: "block", lineHeight: 1.25 }}>{p.name}</b>
        <span className="small muted">{p.dims.w}×{p.dims.d}×{p.dims.h} cm · {brl(p.price)}</span>
        <span className="small" style={{ display: "block", color: "var(--ok)", fontWeight: 600 }}>{fit(r.score)}</span>
        <span className="small muted" style={{ display: "block" }}>{r.reasons.join(" · ")}</span>
      </span>
      <button type="button" className="btn sm" onClick={onAdd} aria-label={`Adicionar ${p.name}`}>Adicionar</button>
    </li>
  );
}

/** Sugestões que ajudam, sem limitar: o catálogo inteiro continua disponível na aba "Móveis". */
export function SuggestionsPanel({ goCatalog }: { goCatalog: () => void }) {
  const plan = usePlanner((s) => s.plan)!;
  const selectedId = usePlanner((s) => s.selectedId);
  const add = usePlanner((s) => s.add);
  const [hidden, setHidden] = useState(false);

  const selected = plan.items.find((i) => i.id === selectedId);
  const recos = useMemo(() => recommendForPlan(plan, selected?.slug), [plan, selected?.slug]);
  const completa = recos.filter((r) => r.kind === "completa");
  const similar = recos.filter((r) => r.kind === "similar");

  if (!plan.items.length) {
    return (
      <div style={{ display: "grid", gap: 10 }}>
        <p className="small" style={{ margin: 0 }}>Adicione o primeiro móvel e mostramos o que combina com ele, respeitando o espaço que sobrar na planta.</p>
        <button type="button" className="btn sm" onClick={goCatalog}>Escolher um móvel</button>
      </div>
    );
  }
  if (hidden) {
    return (
      <div style={{ display: "grid", gap: 10 }}>
        <p className="small muted" style={{ margin: 0 }}>Sugestões ocultas. Você continua livre para adicionar qualquer móvel na aba “Móveis”.</p>
        <button type="button" className="btn sm ghost" onClick={() => setHidden(false)}>Mostrar sugestões</button>
      </div>
    );
  }
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {selected && <p className="small" style={{ margin: 0 }}>Combina com <b>{bySlug(selected.slug)?.name}</b> (selecionado). Toque no espaço vazio da planta para ver sugestões para todo o ambiente.</p>}
      {recos.length === 0 && <p className="small muted" style={{ margin: 0 }}>Sem sugestões que caibam no espaço que sobrou. Você pode girar ou mover os móveis, ou escolher outro item na aba “Móveis”.</p>}
      {completa.length > 0 && (
        <section aria-labelledby="sg-1">
          <h3 id="sg-1" style={{ fontSize: "1rem" }}>Sugestões para completar o espaço</h3>
          <ul className="planner-list">{completa.map((r) => <Card key={r.product.slug} r={r} onAdd={() => add(r.product.slug)} />)}</ul>
        </section>
      )}
      {similar.length > 0 && (
        <section aria-labelledby="sg-2">
          <h3 id="sg-2" style={{ fontSize: "1rem" }}>Você também pode gostar destes itens</h3>
          <ul className="planner-list">{similar.map((r) => <Card key={r.product.slug} r={r} onAdd={() => add(r.product.slug)} />)}</ul>
        </section>
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" className="btn sm ghost" onClick={goCatalog}>Ver todo o catálogo</button>
        <button type="button" className="btn sm ghost" onClick={() => setHidden(true)}>Ocultar sugestões</button>
      </div>
    </div>
  );
}
