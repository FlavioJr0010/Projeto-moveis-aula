import type { Metadata } from "next";
import Link from "next/link";
import { ambientesList, categories, contextosList, perfisList } from "@/data/products";
import { parseParams, searchProducts } from "@/lib/search";
import { ProductCard } from "@/components/ProductCard";
import { FiltersPanel } from "@/components/FiltersPanel";

export const metadata: Metadata = { title: "Móveis" };

type SP = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function Produtos({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const get = (k: string) => first(sp[k]);
  const params = parseParams(get);
  const list = searchProducts(params);
  const fitActive = !!(params.w || params.d || params.h);

  const chips: { label: string; key: string }[] = [];
  if (params.q) chips.push({ label: `“${params.q}”`, key: "q" });
  if (params.categoria) chips.push({ label: categories.find((c) => c.slug === params.categoria)?.label ?? params.categoria, key: "categoria" });
  if (params.contexto) chips.push({ label: contextosList.find((a) => a.slug === params.contexto)?.label ?? params.contexto, key: "contexto" });
  if (params.ambiente) chips.push({ label: ambientesList.find((a) => a.slug === params.ambiente)?.label ?? "", key: "ambiente" });
  if (params.perfil) chips.push({ label: perfisList.find((a) => a.slug === params.perfil)?.label ?? "", key: "perfil" });
  if (params.min || params.max) chips.push({ label: `Preço ${params.min ?? 0} – ${params.max ?? "∞"}`, key: "preco" });
  if (params.w) chips.push({ label: `Largura ≤ ${params.w} cm`, key: "w" });
  if (params.d) chips.push({ label: `Profundidade ≤ ${params.d} cm`, key: "d" });
  if (params.h) chips.push({ label: `Altura ≤ ${params.h} cm`, key: "h" });
  if (params.eco) chips.push({ label: "Eco (30%+ reciclado)", key: "eco" });

  const without = (key: string) => {
    const n = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) {
      const val = first(v); if (!val) continue;
      if (key === "preco" && (k === "min" || k === "max")) continue;
      if (k !== key) n.set(k, val);
    }
    return `/produtos${n.toString() ? `?${n}` : ""}`;
  };

  return (
    <div className="container section tight">
      <nav className="crumbs" aria-label="Você está em"><Link href="/">Início</Link> / Móveis</nav>
      <h1 style={{ fontSize: "2rem" }}>Móveis</h1>
      <div className="layout">
        <FiltersPanel activeCount={chips.length}>
          <form action="/produtos" method="get">
            {params.q && <input type="hidden" name="q" value={params.q} />}
            <fieldset>
              <legend>📏 Cabe no meu espaço</legend>
              <p className="small muted">Medida livre onde o móvel vai ficar.</p>
              <div className="row3">
                <div><label htmlFor="f-w">Larg.</label><input id="f-w" name="w" className="field" inputMode="numeric" defaultValue={params.w ?? ""} placeholder="cm" /></div>
                <div><label htmlFor="f-d">Prof.</label><input id="f-d" name="d" className="field" inputMode="numeric" defaultValue={params.d ?? ""} placeholder="cm" /></div>
                <div><label htmlFor="f-h">Alt.</label><input id="f-h" name="h" className="field" inputMode="numeric" defaultValue={params.h ?? ""} placeholder="cm" /></div>
              </div>
            </fieldset>
            <fieldset>
              <legend>Uso</legend>
              <select name="contexto" className="field" defaultValue={params.contexto ?? ""} aria-label="Uso: casa, home office ou empresa">
                <option value="">Casa, home office e empresa</option>{contextosList.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
              </select>
            </fieldset>
            <fieldset>
              <legend>Categoria</legend>
              <select name="categoria" className="field" defaultValue={params.categoria ?? ""} aria-label="Categoria">
                <option value="">Todas</option>{categories.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
              </select>
            </fieldset>
            <fieldset>
              <legend>Ambiente</legend>
              <select name="ambiente" className="field" defaultValue={params.ambiente ?? ""} aria-label="Ambiente">
                <option value="">Todos</option>{ambientesList.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
              </select>
            </fieldset>
            <fieldset>
              <legend>Para quem</legend>
              <select name="perfil" className="field" defaultValue={params.perfil ?? ""} aria-label="Perfil">
                <option value="">Todos</option>{perfisList.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
              </select>
            </fieldset>
            <fieldset>
              <legend>Preço (R$)</legend>
              <div className="row2">
                <input name="min" className="field" inputMode="numeric" placeholder="Mín." defaultValue={params.min ?? ""} aria-label="Preço mínimo" />
                <input name="max" className="field" inputMode="numeric" placeholder="Máx." defaultValue={params.max ?? ""} aria-label="Preço máximo" />
              </div>
            </fieldset>
            <fieldset>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="checkbox" name="eco" value="1" defaultChecked={params.eco} style={{ accentColor: "var(--brand)" }} /> Só produtos eco (30%+ reciclado)</label>
            </fieldset>
            <fieldset>
              <legend>Ordenar por</legend>
              <select name="ordem" className="field" defaultValue={params.ordem ?? "relevancia"} aria-label="Ordenar">
                <option value="relevancia">Mais relevantes</option><option value="menor">Menor preço</option><option value="maior">Maior preço</option>
                <option value="avaliacao">Melhor avaliados</option><option value="desconto">Maior desconto</option>
              </select>
            </fieldset>
            <button className="btn block">Aplicar filtros</button>
            {chips.length > 0 && <Link href="/produtos" className="btn ghost block" style={{ marginTop: 8 }}>Limpar tudo</Link>}
          </form>
        </FiltersPanel>

        <section aria-live="polite">
          <h2 className="sr-only">Lista de produtos</h2>
          <div className="toolbar"><strong>{list.length} {list.length === 1 ? "produto" : "produtos"}</strong></div>
          {chips.length > 0 && (
            <div className="chips">
              {chips.map((c) => <Link key={c.key} href={without(c.key)} className="chip" aria-label={`Remover filtro ${c.label}`}>{c.label} ✕</Link>)}
            </div>
          )}
          {fitActive && list.length > 0 && <p className="hint" style={{ marginBottom: 16 }}>Mostrando apenas móveis que cabem nas medidas informadas. Deixe pelo menos 60 cm de passagem livre ao redor.</p>}
          {list.length === 0 ? (
            <div className="empty card"><h2>Nada por aqui ainda</h2><p className="muted">Nenhum móvel atende a todos os filtros. Tente aumentar as medidas ou remover um filtro.</p><Link href="/produtos" className="btn">Ver todos os móveis</Link></div>
          ) : (
            <div className="grid cols-3">{list.map((p, i) => <ProductCard key={p.slug} p={p} fits={fitActive} priority={i < 3} />)}</div>
          )}
        </section>
      </div>
    </div>
  );
}
