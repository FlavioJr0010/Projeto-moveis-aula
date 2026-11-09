import Link from "next/link";
import Image from "next/image";
import { img } from "@/data/products";
import type { ProductWithPrice } from "@/lib/search";
import { brl } from "@/lib/format";
import { FREE_SHIPPING_FROM } from "@/lib/pricing";
import { Stars } from "./Stars";
import { MatchBadge } from "./MatchBadge";

export function ProductCard({ p, fits, priority }: { p: ProductWithPrice; fits?: boolean; priority?: boolean }) {
  const { info } = p;
  return (
    <Link href={`/produto/${p.slug}`} className="card pcard">
      <div className="ph">
        <Image src={img(p.images[0], 640, 480)} alt={p.name} width={640} height={480} sizes="(max-width: 600px) 50vw, (max-width: 960px) 33vw, 280px" priority={priority} />
        <div className="badges">
          {info.discountPct > 0 && <span className="badge">-{info.discountPct}%</span>}
          {p.eco.recycledPct >= 30 && <span className="badge eco">Eco {p.eco.recycledPct}%</span>}
        </div>
      </div>
      <div className="body">
        <h3>{p.name}</h3>
        <Stars rating={p.rating} count={p.reviews} />
        <span className="dims">{p.dims.w} × {p.dims.d} × {p.dims.h} cm (L×P×A)</span>
        {fits && <span className="fit-yes">✓ Cabe no seu espaço</span>}
        <MatchBadge slug={p.slug} />
        <div style={{ marginTop: "auto" }}>
          <div className="price-old">{brl(info.listPrice)}</div>
          <div className="price">{brl(info.price)}</div>
          <div className="price-pix">{brl(info.pix)} no Pix</div>
          <div className="small muted">
            ou {info.installments}x de {brl(info.installmentValue)} sem juros
          </div>
          {info.price >= FREE_SHIPPING_FROM && <div className="small" style={{ color: "var(--ok)", fontWeight: 600 }}>Frete grátis (SP, Sul e Sudeste)</div>}
        </div>
      </div>
    </Link>
  );
}
