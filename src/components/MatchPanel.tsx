"use client";
import type { Product } from "@/data/products";
import { bestColor, evaluateMatch } from "@/lib/match";
import { useCart } from "./CartProvider";

const ICON = { ok: "✓", warn: "!", bad: "✕" } as const;

/** Painel da página do produto: atualiza ao trocar a cor. */
export function MatchPanel({ product, color, onPickColor }: { product: Product; color: string; onPickColor: (c: string) => void }) {
  const { lines, ready } = useCart();
  if (!ready) return null;
  const cart = lines.map((l) => ({ slug: l.slug, color: l.color }));
  const r = evaluateMatch(product.slug, color, cart);
  if (!r) {
    return <div className="match neutral"><b>Combina com o seu espaço?</b><p className="small muted" style={{ margin: "4px 0 0" }}>Adicione peças ao carrinho e mostramos aqui se este móvel combina com elas.</p></div>;
  }
  const best = bestColor(product.slug, cart);
  const tip = best && best.color !== color && best.r.score >= r.score + 8 ? best : null;
  return (
    <div className={`match ${r.level}`} aria-live="polite">
      <div className="match-head"><span className="match-ico" aria-hidden>{ICON[r.level]}</span><div><b>{r.label}</b><div className="small muted">Compatibilidade {r.score}%</div></div></div>
      <div className="bar" role="img" aria-label={`Compatibilidade ${r.score}%`}><i style={{ width: `${r.score}%` }} /></div>
      <ul className="match-list">{r.reasons.map((x, i) => <li key={i} className={x.level}><span aria-hidden>{ICON[x.level]}</span>{x.text}</li>)}</ul>
      {tip && <button type="button" className="btn ghost sm" onClick={() => onPickColor(tip.color)}>Na cor {tip.color} combina mais ({tip.r.score}%)</button>}
    </div>
  );
}
