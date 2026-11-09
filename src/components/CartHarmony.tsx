"use client";
import { products } from "@/data/products";
import { evaluateMatch, bestColor, type Level } from "@/lib/match";
import { searchProducts } from "@/lib/search";
import type { CartLine } from "@/lib/pricing";
import { ProductCard } from "./ProductCard";

const ICON = { ok: "✓", warn: "!", bad: "✕" } as const;

/** Resumo de harmonia do carrinho + sugestões que combinam com o que já foi escolhido. */
export function CartHarmony({ lines, part }: { lines: CartLine[]; part: "summary" | "suggest" }) {
  const items = lines.map((l) => ({ slug: l.slug, color: l.color }));
  const per = items.map((it, i) => ({ it, r: evaluateMatch(it.slug, it.color, items.filter((_, j) => j !== i)) }));
  const rated = per.filter((x) => x.r);
  if (!rated.length) {
    const only = searchProducts({}).filter((p) => !items.some((i) => i.slug === p.slug));
    const picks = only.map((p) => ({ p, b: bestColor(p.slug, items) })).filter((x) => x.b && x.b.r.level === "ok").sort((a, b) => b.b!.r.score - a.b!.r.score).slice(0, 4);
    return part === "suggest" && picks.length ? <Suggestions picks={picks.map((x) => x.p.slug)} /> : null;
  }
  const score = Math.round(rated.reduce((s, x) => s + x.r!.score, 0) / rated.length);
  const level: Level = rated.some((x) => x.r!.level === "bad") ? "bad" : score >= 68 && !rated.some((x) => x.r!.level === "warn") ? "ok" : "warn";
  const issues = [...new Map(rated.flatMap((x) => x.r!.reasons.filter((r) => r.level !== "ok")).map((r) => [r.text, r])).values()];
  const oks = rated.flatMap((x) => x.r!.reasons.filter((r) => r.level === "ok")).length;

  const inCart = new Set(items.map((i) => i.slug));
  const picks = products.filter((p) => !inCart.has(p.slug)).map((p) => ({ slug: p.slug, b: bestColor(p.slug, items) }))
    .filter((x) => x.b && x.b.r.level === "ok").sort((a, b) => b.b!.r.score - a.b!.r.score).slice(0, 4).map((x) => x.slug);

  return (
    part === "suggest" ? (picks.length > 0 ? <Suggestions picks={picks} /> : null) :
    <>
      <div className={`match ${level}`} style={{ marginBottom: 16 }} aria-live="polite">
        <div className="match-head"><span className="match-ico" aria-hidden>{ICON[level]}</span>
          <div><b>{level === "ok" ? "Seu carrinho está harmonioso" : level === "warn" ? "Seu carrinho combina, com ressalvas" : "Algumas peças não combinam bem"}</b><div className="small muted">Harmonia geral {score}% · {oks} pontos positivos</div></div></div>
        <div className="bar" role="img" aria-label={`Harmonia ${score}%`}><i style={{ width: `${score}%` }} /></div>
        {issues.length > 0 && <ul className="match-list">{issues.map((r) => <li key={r.text} className={r.level}><span aria-hidden>{ICON[r.level]}</span>{r.text}</li>)}</ul>}
      </div>
    </>
  );
}

function Suggestions({ picks }: { picks: string[] }) {
  const list = searchProducts({}).filter((p) => picks.includes(p.slug)).sort((a, b) => picks.indexOf(a.slug) - picks.indexOf(b.slug));
  return (
    <section style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: "1.3rem" }}>Combina com o que você escolheu</h2>
      <div className="grid cols-4">{list.map((p) => <ProductCard key={p.slug} p={p} />)}</div>
    </section>
  );
}
