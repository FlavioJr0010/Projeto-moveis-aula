import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ambientesList, bundles, bySlug, categories, contextosList, products } from "@/data/products";
import { searchProducts } from "@/lib/search";
import { priceInfo } from "@/lib/pricing";
import { recommend } from "@/lib/recommend";
import { Gallery } from "@/components/Gallery";
import { ProductBuy } from "@/components/ProductBuy";
import { ProductCard } from "@/components/ProductCard";
import { Stars } from "@/components/Stars";
import { LeafIcon } from "@/components/Icons";
import { WhatsAppAsk } from "@/components/WhatsAppAsk";
import { techOf } from "@/data/tech";

export function generateStaticParams() { return products.map((p) => ({ slug: p.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = bySlug((await params).slug);
  return p ? { title: p.name, description: p.short } : {};
}

const REVIEWS = [
  { n: "Camila R.", t: "Chegou antes do prazo e a medida é exatamente a do site. Valeu a pena conferir se cabia!", s: 5 },
  { n: "Rafael S.", t: "Acabamento melhor do que eu esperava pelo preço. Atendimento resolveu minha dúvida no WhatsApp em minutos.", s: 5 },
  { n: "Juliana M.", t: "Montagem foi rápida. Só a caixa veio um pouco amassada, mas o produto estava perfeito.", s: 4 },
];

export default async function ProdutoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = bySlug(slug);
  if (!p) notFound();
  const cat = categories.find((c) => c.slug === p.category)!;
  const similar = searchProducts({}).filter((x) => x.slug !== p.slug && (x.category === p.category || x.ambientes.some((a) => p.ambientes.includes(a)))).slice(0, 4);
  const combina = recommend({ anchors: [p], limit: 4 });
  const tech = techOf(p.slug);
  const isSeat = p.category === "cadeiras" || p.subcategoria === "banqueta";
  const demo = (f?: string) => (f === "demo" ? " (demo)" : "");
  const inBundles = bundles.filter((b) => b.items.some((i) => i.slug === p.slug));

  const jsonLd = {
    "@context": "https://schema.org", "@type": "Product", name: p.name, description: p.description,
    offers: { "@type": "Offer", priceCurrency: "BRL", price: p.price, availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" },
  };

  return (
    <div className="container">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="crumbs" aria-label="Você está em"><Link href="/">Início</Link> / <Link href={`/produtos?categoria=${cat.slug}`}>{cat.label}</Link> / {p.name}</nav>
      <div className="pdp">
        <div>
          <Gallery product={p} />
        </div>
        <div>
          <h1 style={{ fontSize: "2rem" }}>{p.name}</h1>
          <p className="muted">{p.short}</p>
          <p><Stars rating={p.rating} count={p.reviews} /> <span className="small muted">· nota de demonstração</span></p>
          <ProductBuy product={p} />
          <WhatsAppAsk name={p.name} />
        </div>
      </div>

      <section className="section tight">
        <div className="grid cols-2 stack" style={{ gap: 36, alignItems: "start" }}>
          <div>
            <h2>Sobre o produto</h2>
            <p>{p.description}</p>
            <table className="specs"><tbody>
              <tr><th>Largura</th><td>{p.dims.w} cm</td></tr>
              <tr><th>Profundidade</th><td>{p.dims.d} cm</td></tr>
              <tr><th>Altura</th><td>{p.dims.h} cm</td></tr>
              {isSeat && <tr><th>Altura do assento</th><td>{tech.assento ? `${tech.assento.range[0] === tech.assento.range[1] ? tech.assento.range[0] : `${tech.assento.range[0]} a ${tech.assento.range[1]}`} cm${demo(tech.assento.fonte)}` : <span className="muted">informação não disponível (os {p.dims.h} cm acima são a altura total)</span>}</td></tr>}
              {isSeat && tech.uso && <tr><th>Indicado para</th><td>{tech.uso.para.map((u) => (u === "mesa" ? "mesa" : "bancada ou balcão")).join(", ")}{demo(tech.uso.fonte)}</td></tr>}
              {tech.embalagem && <tr><th>Embalagem</th><td>{tech.embalagem.volumes} volume{tech.embalagem.volumes > 1 ? "s" : ""}; maior: {tech.embalagem.w} × {tech.embalagem.d} × {tech.embalagem.h} cm{demo(tech.embalagem.fonte)}</td></tr>}
              {tech.desmontavel && <tr><th>Desmontagem</th><td>{tech.desmontavel.valor ? "Chega desmontado / pode ser desmontado" : "Não desmonta"}{demo(tech.desmontavel.fonte)}</td></tr>}
              {tech.limpeza && <tr><th>Limpeza</th><td>{tech.limpeza.nota}{demo(tech.limpeza.fonte)}</td></tr>}
              <tr><th>Peso</th><td>{p.weightKg} kg</td></tr>
              <tr><th>Materiais</th><td>{p.material}</td></tr>
              <tr><th>Uso</th><td>{p.contextos.map((c) => contextosList.find((x) => x.slug === c)?.label).join(", ")}</td></tr>
              <tr><th>Ambientes</th><td>{p.ambientes.map((a) => ambientesList.find((x) => x.slug === a)?.label ?? a).join(", ")}</td></tr>
              <tr><th>Estilo</th><td style={{ textTransform: "capitalize" }}>{p.visual.estilos.join(", ")}</td></tr>
              <tr><th>Acabamento</th><td style={{ textTransform: "capitalize" }}>{p.visual.acabamento}</td></tr>
              <tr><th>Garantia</th><td>3 anos (demo)</td></tr>
            </tbody></table>
          </div>
          <div style={{ display: "grid", gap: 20 }}>
            <div className="eco-box">
              <h3 style={{ display: "flex", gap: 8, alignItems: "center" }}><LeafIcon /> Índice eco</h3>
              <p style={{ margin: "0 0 8px" }}>{p.eco.note}</p>
              <div className="small" style={{ display: "flex", justifyContent: "space-between" }}><span>Material reciclado</span><b>{p.eco.recycledPct}%</b></div>
              <div className="bar" role="img" aria-label={`${p.eco.recycledPct}% de material reciclado`}><i style={{ width: `${p.eco.recycledPct}%` }} /></div>
              <p className="small muted" style={{ margin: "8px 0 0" }}>Selo: {p.eco.cert}. Dados de demonstração.</p>
            </div>
            <div>
              <h2>Avaliações <span className="badge">demonstração</span></h2>
              <p><Stars rating={p.rating} count={p.reviews} /></p>
              {REVIEWS.map((r) => (<div key={r.n} className="review"><Stars rating={r.s} /> <b style={{ marginLeft: 6 }}>{r.n}</b><p style={{ margin: "4px 0 0" }}>{r.t}</p></div>))}
              <p className="small muted">Avaliações e notas de demonstração: não são relatos de clientes reais.</p>
            </div>
          </div>
        </div>
      </section>

      {inBundles.length > 0 && (
        <section className="section tight">
          <h2>Combina com</h2>
          <div className="grid cols-3 stack">
            {inBundles.map((b) => (
              <Link key={b.slug} href={`/ambientes/${b.slug}`} className="card idea"><h3>{b.name}</h3><p className="muted small">{b.description}</p><span className="badge">-{b.discountPct}% no conjunto</span></Link>
            ))}
          </div>
        </section>
      )}

      {combina.length > 0 && (
        <section className="section tight" aria-labelledby="combina">
          <h2 id="combina">Combina com este móvel</h2>
          <p className="muted small">Sugestões por estilo, cor e material. Você pode escolher qualquer outro item do catálogo.</p>
          <div className="grid cols-4">
            {combina.map((r) => (
              <div key={r.product.slug} style={{ display: "grid", gap: 6, alignContent: "start" }}>
                <ProductCard p={{ ...r.product, info: priceInfo(r.product) }} />
                <p className="small muted" style={{ margin: 0 }}>{r.reasons.join(" · ")}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="section tight">
        <h2>Você também pode gostar</h2>
        <div className="grid cols-4">{similar.map((x) => <ProductCard key={x.slug} p={x} />)}</div>
      </section>
    </div>
  );
}
