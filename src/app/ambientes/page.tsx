import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { bundles, bySlug, img } from "@/data/products";
import { priceInfo } from "@/lib/pricing";
import { brl } from "@/lib/format";

export const metadata: Metadata = { title: "Ambientes completos" };

export default function Ambientes() {
  return (
    <div className="container section tight">
      <h1>Ambientes completos</h1>
      <p className="muted">Peças que combinam entre si, com desconto no conjunto e uma única compra.</p>
      <h2 className="sr-only">Lista de ambientes</h2>
      <div className="grid cols-3 stack">
        {bundles.map((b) => {
          const total = b.items.reduce((s, i) => s + bySlug(i.slug)!.price * i.qty, 0);
          const info = priceInfo({ listPrice: total, price: total * (1 - b.discountPct / 100) });
          return (
            <Link key={b.slug} href={`/ambientes/${b.slug}`} className="card pcard">
              <div className="ph"><Image src={img(b.image, 640, 480)} alt={b.name} width={640} height={480} sizes="(max-width:700px) 100vw, 33vw" /><div className="badges"><span className="badge">-{b.discountPct}% no conjunto</span></div></div>
              <div className="body"><h3>{b.name}</h3><p className="muted small">{b.description}</p>
                <div style={{ marginTop: "auto" }}><div className="price-old">{brl(total)}</div><div className="price">{brl(info.price)}</div><div className="price-pix">{brl(info.pix)} no Pix</div></div></div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
