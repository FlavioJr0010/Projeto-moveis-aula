import Link from "next/link";
import Image from "next/image";
import { bundles, categories, contextosList, img, bySlug } from "@/data/products";
import { searchProducts } from "@/lib/search";
import { priceInfo } from "@/lib/pricing";
import { brl } from "@/lib/format";
import { ProductCard } from "@/components/ProductCard";
import { SpaceFinder } from "@/components/SpaceFinder";
import { HomeIcon, LeafIcon, PixIcon, RulerIcon, ShieldIcon, SparkIcon, TagIcon, TruckIcon, WrenchIcon, ChatIcon } from "@/components/Icons";

const catImg: Record<string, string> = {
  sofas: "1555041469-a586c61ea9bc", poltronas: "1586023492125-27b2c045efd7", camas: "1540518614846-7eded433c457",
  mesas: "1519710164239-da123dc03ef4", armarios: "1594026112284-02bb6f3352fe", complementos: "1503602642458-232111445657",
  cadeiras: "1580480055273-228ff5388ef8", estantes: "1600494603989-9650cf6ddd3d", balcoes: "1524758631624-e2822e304c36",
};

export default function Home() {
  const best = searchProducts({}).slice(0, 4);
  return (
    <>
      <section className="hero">
        <Image src={img("1631679706909-1844bbd07221", 1800, 1000)} alt="Sala clara com sofá, poltronas e plantas" fill priority sizes="100vw" style={{ objectFit: "cover" }} />
        <div className="container">
          <h1>Móveis que cabem na sua casa e na sua vida</h1>
          <p>Feitos para a primeira casa, a família e o apartamento pequeno. Madeira de reflorestamento, entrega consolidada e atendimento de gente de verdade.</p>
          <div className="hero-actions">
            <Link className="btn accent" href="/quiz">Descobrir meu estilo</Link>
            <Link className="btn ghost" href="/ambientes">Ver ambientes completos</Link>
          </div>
        </div>
      </section>

      <div className="container trust" aria-label="Vantagens">
        <div><PixIcon /><span><b>5% off no Pix</b>e até 10x sem juros</span></div>
        <div><TruckIcon /><span><b>Frete grátis</b>acima de R$ 1.999 (Irecê e região)</span></div>
        <div><WrenchIcon /><span><b>Montagem opcional</b>escolha no carrinho</span></div>
        <div><ShieldIcon /><span><b>30 dias para trocar</b>sem burocracia (demo)</span></div>
      </div>

      <section className="section tight">
        <div className="container">
          <div className="section-head"><div><h2>O que você quer mobiliar?</h2><p className="muted">Escolha o seu caso e veja só o que faz sentido para ele.</p></div></div>
          <div className="grid cols-3 stack">
            {contextosList.map((c) => (
              <Link key={c.slug} href={`/produtos?contexto=${c.slug}`} className="card idea">
                <h3>{c.label}</h3><p className="muted small">{c.desc}</p><span className="btn sm ghost">Ver móveis</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section tight">
        <div className="container">
          <div className="section-head"><div><h2>Pensado para facilitar a sua compra</h2><p className="muted">Ferramentas que ajudam a acertar na primeira vez.</p></div></div>
          <div className="grid cols-4 stack">
            <div className="card idea">
              <div className="ico"><RulerIcon /></div>
              <h3>Cabe no meu espaço</h3>
              <p className="muted small">Informe a medida do vão e veja só o que realmente cabe.</p>
              <SpaceFinder />
            </div>
            <div className="card idea"><div className="ico"><SparkIcon /></div><h3>Quiz de estilo</h3><p className="muted small">Quatro perguntas e montamos a sua seleção.</p><Link className="btn sm ghost" href="/quiz">Fazer o quiz</Link></div>
            <div className="card idea"><div className="ico"><HomeIcon /></div><h3>Ambientes completos</h3><p className="muted small">Sala, quarto ou jantar combinados, com desconto no conjunto.</p><Link className="btn sm ghost" href="/ambientes">Ver ambientes</Link></div>
            <div className="card idea"><div className="ico"><TagIcon /></div><h3>Preço final sem susto</h3><p className="muted small">Produto + montagem + frete somados antes de você decidir.</p><Link className="btn sm ghost" href="/produto/sofa-nuvem-2-lugares">Ver exemplo</Link></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head"><h2>Compre por categoria</h2><Link href="/produtos" className="btn ghost sm">Ver tudo</Link></div>
          <div className="grid cols-3">
            {categories.map((c) => (
              <Link key={c.slug} href={`/produtos?categoria=${c.slug}`} className="tile">
                <Image src={img(catImg[c.slug], 640, 480)} alt="" width={640} height={480} sizes="(max-width:600px) 50vw, 33vw" />
                <div className="cap"><h3>{c.label}</h3></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: "var(--soft)" }}>
        <div className="container">
          <div className="section-head"><div><h2>Ambientes prontos</h2><p className="muted">Peças que combinam entre si, com desconto de 7% a 12% no conjunto.</p></div></div>
          <div className="grid cols-3 stack">
            {bundles.slice(0, 3).map((b) => {
              const total = b.items.reduce((s, i) => s + bySlug(i.slug)!.price * i.qty, 0);
              const info = priceInfo({ listPrice: total, price: total * (1 - b.discountPct / 100) });
              return (
                <Link key={b.slug} href={`/ambientes/${b.slug}`} className="card pcard">
                  <div className="ph"><Image src={img(b.image, 640, 480)} alt={b.name} width={640} height={480} sizes="(max-width:600px) 100vw, 33vw" /><div className="badges"><span className="badge">-{b.discountPct}% no conjunto</span></div></div>
                  <div className="body"><h3>{b.name}</h3><p className="muted small">{b.description}</p><div className="price" style={{ marginTop: "auto" }}>{brl(info.price)}</div><div className="price-pix">{brl(info.pix)} no Pix</div></div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head"><h2>Mais amados pelos clientes</h2><Link href="/produtos" className="btn ghost sm">Ver todos</Link></div>
          <div className="grid cols-4">{best.map((p, i) => <ProductCard key={p.slug} p={p} priority={i < 2} />)}</div>
        </div>
      </section>

      <section className="section tight">
        <div className="container">
          <div className="band">
            <div><h2>Móveis bonitos que respeitam o planeta</h2><p>Madeira de reflorestamento, painéis de baixa emissão, embalagens recicláveis e, em estudo, o programa “Segunda vida” para o seu móvel antigo.</p><Link className="btn" href="/sustentabilidade">Conhecer nosso compromisso</Link></div>
            <ul><li><LeafIcon /> Cada produto mostra o seu índice de material reciclado</li><li><TruckIcon /> Entrega consolidada para menos viagens</li><li><ShieldIcon /> Peças que duram: garantia de 3 anos (demo)</li></ul>
          </div>
        </div>
      </section>

      <section className="section tight">
        <div className="container">
          <div className="card" style={{ padding: 28, display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}><ChatIcon size={36} /><div><h3 style={{ margin: 0 }}>Dúvida sobre medidas, montagem ou prazo?</h3><p className="muted" style={{ margin: 0 }}>Fale com a gente pelo chat no canto da tela ou pelo WhatsApp, de segunda a sábado.</p></div></div>
            <a className="btn" href="https://wa.me/5511900000000" target="_blank" rel="noreferrer">Chamar no WhatsApp (demo)</a>
          </div>
        </div>
      </section>
    </>
  );
}
