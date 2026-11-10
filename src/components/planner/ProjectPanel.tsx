"use client";
import { useState } from "react";
import Link from "next/link";
import { bySlug } from "@/data/products";
import { useCart } from "@/components/CartProvider";
import { brl } from "@/lib/format";
import { publishPlan } from "@/lib/planner/cloud";
import { saveProject } from "@/lib/planner/storage";
import { usePlanner } from "@/lib/planner/store";
import { planLines, planTotal } from "@/lib/planner/totals";
import type { PlanAlert } from "@/lib/planner/validate";

export function ProjectPanel({ alerts }: { alerts: PlanAlert[] }) {
  const plan = usePlanner((s) => s.plan)!;
  const selectedId = usePlanner((s) => s.selectedId);
  const { select, remove, rename, close } = usePlanner.getState();
  const cart = useCart();
  const [msg, setMsg] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const total = planTotal(plan.items);
  const errors = alerts.filter((a) => a.level === "erro").length;

  const save = () => setMsg(saveProject(plan) ? "Projeto salvo neste aparelho." : "Não foi possível salvar (armazenamento indisponível).");
  const share = async () => {
    setBusy(true); setMsg(null); setLink(null);
    const r = await publishPlan(plan);
    setBusy(false);
    if (!r.ok) return setMsg(r.error);
    setLink(r.url);
    try { await navigator.clipboard.writeText(r.url); setMsg("Link copiado! Quem abrir verá uma cópia do projeto."); }
    catch { setMsg("Link pronto. Copie o endereço abaixo."); }
  };
  const toCart = () => { cart.addMany(planLines(plan.items)); setMsg(null); };
  const reset = () => { if (!plan.items.length || window.confirm("Fechar este ambiente? Salve o projeto antes para não perder os móveis.")) close(); };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div>
        <label className="small" htmlFor="pl-rename">Nome do projeto</label>
        <input id="pl-rename" className="field" value={plan.nome} maxLength={80} onChange={(e) => rename(e.target.value)} />
        <p className="small muted" style={{ margin: "6px 0 0" }}>{plan.room.w}×{plan.room.d} cm{plan.room.h ? ` · pé-direito ${plan.room.h} cm` : ""}</p>
      </div>

      <section aria-labelledby="pl-itens">
        <h3 id="pl-itens" style={{ fontSize: "1rem" }}>Itens na planta ({plan.items.length})</h3>
        {plan.items.length === 0 ? <p className="small muted">Nenhum móvel ainda. Use a aba “Móveis” para adicionar.</p> : (
          <ul className="planner-list">
            {plan.items.map((it) => {
              const p = bySlug(it.slug);
              if (!p) return null;
              const bad = alerts.some((a) => a.level === "erro" && a.itemIds.includes(it.id));
              return (
                <li key={it.id} className="planner-row">
                  <button type="button" className="planner-pick" aria-pressed={selectedId === it.id} onClick={() => select(it.id)}>
                    <b className="small">{bad && <span aria-label="com problema" style={{ color: "var(--danger)" }}>⚠ </span>}{p.name}</b>
                    <span className="small muted">{p.dims.w}×{p.dims.d} cm · {brl(p.price)}</span>
                  </button>
                  <button type="button" className="btn sm ghost" onClick={() => remove(it.id)} aria-label={`Remover ${p.name}`}>Remover</button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="card" style={{ padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span>Total dos móveis</span><b style={{ fontSize: "1.3rem" }} aria-live="polite">{brl(total.merchandise)}</b>
        </div>
        <p className="small muted" style={{ margin: "4px 0 0" }}>Sem frete e sem montagem. Desconto do Pix e parcelamento no carrinho.</p>
      </div>

      {errors > 0 && <div className="alert err-box" role="status">Há {errors} {errors === 1 ? "problema" : "problemas"} na planta. Veja a aba “Alertas”.</div>}
      {msg && <div className="alert demo" role="status">{msg}</div>}

      <div style={{ display: "grid", gap: 8 }}>
        <button type="button" className="btn accent block" disabled={!plan.items.length} onClick={toCart}>Adicionar tudo ao carrinho</button>
        <button type="button" className="btn block" onClick={save}>Salvar neste aparelho</button>
        <button type="button" className="btn ghost block" onClick={share} disabled={busy || !plan.items.length}>{busy ? "Gerando link…" : "Compartilhar por link"}</button>
        {link && <input className="field" readOnly value={link} aria-label="Link do projeto" onFocus={(e) => e.currentTarget.select()} />}
        <button type="button" className="btn ghost block" onClick={reset}>Novo ambiente</button>
        <Link className="small muted center" href="/carrinho">Ir para o carrinho</Link>
      </div>
    </div>
  );
}
