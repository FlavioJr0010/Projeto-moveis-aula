"use client";
import Link from "next/link";
import { useState } from "react";
import { bundles, bySlug, perfisList, type Ambiente, type Perfil } from "@/data/products";
import { searchProducts } from "@/lib/search";
import { priceInfo } from "@/lib/pricing";
import { brl } from "@/lib/format";
import { ProductCard } from "./ProductCard";
import { BundleBuy } from "./BundleBuy";

type Style = "moderno" | "classico" | "natural";
interface Answers { perfil?: Perfil; ambiente?: Ambiente | "casa"; style?: Style; budget?: number }

const STEPS = [
  { key: "perfil", title: "Quem vai usar os móveis?", opts: perfisList.map((p) => ({ v: p.slug, t: p.label, d: p.slug === "primeira-casa" ? "Montando tudo do zero" : p.slug === "familia" ? "Resistência e espaço para todos" : "Cada centímetro conta" })) },
  { key: "ambiente", title: "Por onde você quer começar?", opts: [{ v: "sala", t: "Sala de estar", d: "" }, { v: "quarto", t: "Quarto", d: "" }, { v: "jantar", t: "Sala de jantar", d: "" }, { v: "casa", t: "Quero o essencial da casa", d: "Um pouco de cada ambiente" }] },
  { key: "style", title: "Qual estilo combina com você?", opts: [{ v: "moderno", t: "Moderno", d: "Linhas retas e cores marcantes" }, { v: "classico", t: "Clássico", d: "Capitonê e detalhes dourados" }, { v: "natural", t: "Natural", d: "Madeira clara e tons terrosos" }] },
  { key: "budget", title: "Quanto pretende investir?", opts: [{ v: 3000, t: "Até R$ 3.000", d: "" }, { v: 6000, t: "Até R$ 6.000", d: "" }, { v: 99999, t: "Sem limite definido", d: "" }] },
] as const;

export function QuizClient() {
  const [step, setStep] = useState(0);
  const [a, setA] = useState<Answers>({});
  const done = step >= STEPS.length;

  if (!done) {
    const s = STEPS[step];
    return (
      <div className="quiz">
        <p className="muted small">Pergunta {step + 1} de {STEPS.length}</p>
        <div className="progress" aria-hidden><i style={{ width: `${(step / STEPS.length) * 100}%` }} /></div>
        <h2 style={{ marginTop: 20 }}>{s.title}</h2>
        <div className="opts">
          {s.opts.map((o) => (
            <button key={String(o.v)} className="opt" onClick={() => { setA({ ...a, [s.key]: o.v }); setStep(step + 1); }}>{o.t}{o.d && <small>{o.d}</small>}</button>
          ))}
        </div>
        {step > 0 && <button className="btn ghost sm" onClick={() => setStep(step - 1)}>Voltar</button>}
      </div>
    );
  }

  const bundleTotal = (b: (typeof bundles)[number]) => b.items.reduce((s, i) => s + bySlug(i.slug)!.price * i.qty, 0) * (1 - b.discountPct / 100);
  const budget = a.budget ?? 99999;
  const bundle = [...bundles]
    .map((b) => ({ b, score: (b.perfil === a.perfil ? 3 : 0) + (b.ambiente === a.ambiente ? 3 : 0) + (bundleTotal(b) <= budget ? 2 : -2) }))
    .sort((x, y) => y.score - x.score)[0]?.b;
  const picks = searchProducts({})
    .map((p) => ({ p, score: (p.perfis.includes(a.perfil!) ? 3 : 0) + (a.ambiente === "casa" || p.ambientes.includes(a.ambiente as Ambiente) ? 3 : 0) + (p.style === a.style ? 2 : 0) + (p.price <= budget / 2 ? 1 : 0) + p.rating / 10 }))
    .sort((x, y) => y.score - x.score).slice(0, 4).map((x) => x.p);
  const info = bundle ? priceInfo({ listPrice: bundleTotal(bundle) / (1 - bundle.discountPct / 100), price: bundleTotal(bundle) }) : null;

  return (
    <div>
      <h2>Sua seleção está pronta ✨</h2>
      <p className="muted">Com base nas suas respostas, estas são as nossas sugestões.</p>
      {bundle && info && (
        <div className="card" style={{ padding: 20, margin: "20px 0" }}>
          <span className="badge">Ambiente recomendado</span>
          <h3 style={{ marginTop: 10 }}>{bundle.name}</h3><p className="muted">{bundle.description}</p>
          <p><b className="price">{brl(info.price)}</b> <span className="price-pix">· {brl(info.pix)} no Pix</span></p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><BundleBuy slug={bundle.slug} /><Link className="btn ghost" href={`/ambientes/${bundle.slug}`}>Ver detalhes</Link></div>
        </div>
      )}
      <h3>Peças que combinam com você</h3>
      <div className="grid cols-4">{picks.map((p) => <ProductCard key={p.slug} p={p} />)}</div>
      <p style={{ marginTop: 24 }}><button className="btn ghost" onClick={() => { setA({}); setStep(0); }}>Refazer o quiz</button></p>
    </div>
  );
}
