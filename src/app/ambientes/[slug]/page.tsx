import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { bundleBySlug, bundles, bySlug, img } from "@/data/products";
import { priceInfo } from "@/lib/pricing";
import { brl } from "@/lib/format";
import { BundleBuy } from "@/components/BundleBuy";

export function generateStaticParams() { return bundles.map((b) => ({ slug: b.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const b = bundleBySlug((await params).slug);
  return b ? { title: b.name, description: b.description } : {};
}

export default async function BundlePage({ params }: { params: Promise<{ slug: string }> }) {
  const b = bundleBySlug((await params).slug);
  if (!b) notFound();
  const rows = b.items.map((i) => ({ ...i, p: bySlug(i.slug)! }));
  const total = rows.reduce((s, r) => s + r.p.price * r.qty, 0);
  const info = priceInfo({ listPrice: total, price: total * (1 - b.discountPct / 100) });
  return (
    <div className="container">
      <nav className="crumbs" aria-label="Você está em"><Link href="/">Início</Link> / <Link href="/ambientes">Ambientes</Link> / {b.name}</nav>
      <div className="pdp">
        <div className="gallery"><div className="main"><Image src={img(b.image, 1100, 825)} alt={b.name} width={1100} height={825} priority sizes="(max-width:960px) 100vw, 600px" /></div></div>
        <div className="buybox">
          <h1 style={{ fontSize: "2rem" }}>{b.name}</h1>
          <p className="muted">{b.description}</p>
          <div className="pricebox">
            <div className="price-old">{brl(total)} separadas</div>
            <div className="big">{brl(info.price)}</div>
            <div className="save">Você economiza {brl(total - info.price)} ({b.discountPct}%)</div>
            <div className="price-pix">{brl(info.pix)} no Pix</div>
            <div className="muted small">ou {info.installments}x de {brl(info.installmentValue)} sem juros</div>
          </div>
          <BundleBuy slug={b.slug} />
          <BundleBuy slug={b.slug} label="Comprar ambiente agora" go />
          <p className="small muted">Você escolhe cor e montagem de cada peça no carrinho.</p>
        </div>
      </div>
      <section className="section tight">
        <h2>O que vem no ambiente</h2>
        <div className="card">
          {rows.map((r) => (
            <Link key={r.slug} href={`/produto/${r.slug}`} className="line">
              <Image src={img(r.p.images[0], 220, 168)} alt="" width={110} height={84} />
              <div><b>{r.qty}× {r.p.name}</b><div className="small muted">{r.p.dims.w} × {r.p.dims.d} × {r.p.dims.h} cm</div></div>
              <div><div className="price-old">{brl(r.p.price * r.qty)}</div><b>{brl(r.p.price * r.qty * (1 - b.discountPct / 100))}</b></div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
