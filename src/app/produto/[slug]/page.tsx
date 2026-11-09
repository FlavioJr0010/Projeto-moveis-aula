import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { bundles, bySlug, categories, products } from "@/data/products";
import { searchProducts } from "@/lib/search";
import { Gallery } from "@/components/Gallery";
import { ProductBuy } from "@/components/ProductBuy";
import { ProductCard } from "@/components/ProductCard";
import { Stars } from "@/components/Stars";
import { LeafIcon } from "@/components/Icons";

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
  const inBundles = bundles.filter((b) => b.items.some((i) => i.slug === p.slug));

  const jsonLd = {
    "@context": "https://schema.org", "@type": "Product", name: p.name, description: p.description,
    aggregateRating: { "@type": "AggregateRating", ratingValue: p.rating, reviewCount: p.reviews },
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
          <p><Stars rating={p.rating} count={p.reviews} /></p>
          <ProductBuy product={p} />
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
              <tr><th>Peso</th><td>{p.weightKg} kg</td></tr>
              <tr><th>Materiais</th><td>{p.material}</td></tr>
              <tr><th>Estilo</th><td style={{ textTransform: "capitalize" }}>{p.style}</td></tr>
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
              <h2>Avaliações</h2>
              <p><Stars rating={p.rating} count={p.reviews} /></p>
              {REVIEWS.map((r) => (<div key={r.n} className="review"><Stars rating={r.s} /> <b style={{ marginLeft: 6 }}>{r.n}</b><p style={{ margin: "4px 0 0" }}>{r.t}</p></div>))}
              <p className="small muted">Avaliações de demonstração.</p>
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

      <section className="section tight">
        <h2>Você também pode gostar</h2>
        <div className="grid cols-4">{similar.map((x) => <ProductCard key={x.slug} p={x} />)}</div>
      </section>
    </div>
  );
}
