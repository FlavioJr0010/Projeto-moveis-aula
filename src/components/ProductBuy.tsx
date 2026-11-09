"use client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/data/products";
import { brl, isCep, maskCep } from "@/lib/format";
import { priceInfo, type CartLine } from "@/lib/pricing";
import { addBusinessDays, fmtDate, type ShippingOption } from "@/lib/shipping";
import { useCart } from "./CartProvider";

export function ProductBuy({ product }: { product: Product }) {
  const router = useRouter();
  const { add, cep, setCep, ready } = useCart();
  const [color, setColor] = useState(product.colors[0].name);
  const [qty, setQty] = useState(1);
  const [assembly, setAssembly] = useState(false);
  const [cepInput, setCepInput] = useState("");
  const [opts, setOpts] = useState<ShippingOption[] | null>(null);
  const [region, setRegion] = useState("");
  const [shipId, setShipId] = useState("economico");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const info = priceInfo(product);
  const line: CartLine = useMemo(() => ({ slug: product.slug, qty, color, assembly }), [product.slug, qty, color, assembly]);
  const out = product.stock < 1;

  const calc = async (value: string) => {
    if (!isCep(value)) { setErr("Digite um CEP com 8 dígitos."); return; }
    setErr(""); setLoading(true);
    try {
      const r = await fetch("/api/frete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cep: value, items: [line] }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setOpts(j.options); setRegion(j.region); setCep(value);
    } catch (e) { setErr((e as Error).message || "Não foi possível calcular o frete."); setOpts(null); }
    finally { setLoading(false); }
  };

  // recalcula quando muda quantidade/montagem e já há CEP
  useEffect(() => {
    if (!ready) return;
    if (!cepInput && cep) setCepInput(maskCep(cep));
    if (cep && isCep(cep)) calc(cep);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, qty]);

  const ship = opts?.find((o) => o.id === shipId) ?? opts?.[0];
  const merch = info.price * qty;
  const asm = assembly ? product.assemblyPrice * qty : 0;
  const total = merch + asm + (ship?.price ?? 0);

  return (
    <div className="buybox">
      <div className="pricebox">
        <div className="price-old">de {brl(info.listPrice)} <span className="badge" style={{ marginLeft: 6 }}>-{info.discountPct}%</span></div>
        <div className="big">{brl(info.price)}</div>
        <div className="price-pix" style={{ fontSize: "1.05rem" }}>{brl(info.pix)} no Pix (5% off)</div>
        <div className="muted">ou {info.installments}x de {brl(info.installmentValue)} sem juros</div>
      </div>

      <div>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Cor: <span style={{ fontWeight: 400 }}>{color}</span></div>
        <div className="swatches">
          {product.colors.map((c) => (
            <button key={c.name} className="swatch" aria-pressed={color === c.name} onClick={() => setColor(c.name)}><i style={{ background: c.hex }} />{c.name}</button>
          ))}
        </div>
      </div>

      {product.assemblyPrice > 0 && (
        <label className="ship-opt" style={{ alignItems: "center" }}>
          <span><input type="checkbox" checked={assembly} onChange={(e) => setAssembly(e.target.checked)} />Adicionar montagem profissional</span>
          <b>+ {brl(product.assemblyPrice)}</b>
        </label>
      )}

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div className="qty" role="group" aria-label="Quantidade">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Diminuir">−</button>
          <span aria-live="polite">{qty}</span>
          <button onClick={() => setQty((q) => Math.min(Math.min(product.stock, 20), q + 1))} aria-label="Aumentar">+</button>
        </div>
        <span className="small muted">{product.stock <= 10 ? `Últimas ${product.stock} unidades` : "Em estoque"}</span>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        <button className="btn accent block" disabled={out} onClick={() => { add(line); }}>Adicionar ao carrinho</button>
        <button className="btn ghost block" disabled={out} onClick={() => { add(line, true); router.push("/carrinho"); }}>Comprar agora</button>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Calcular frete e prazo</div>
        <form className="cep-row" onSubmit={(e) => { e.preventDefault(); calc(cepInput); }}>
          <input className="field" inputMode="numeric" placeholder="00000-000" value={cepInput} maxLength={9} aria-label="CEP" aria-invalid={!!err}
            onChange={(e) => setCepInput(maskCep(e.target.value))} />
          <button className="btn sm" disabled={loading}>{loading ? "…" : "Calcular"}</button>
        </form>
        {err && <div className="err" role="alert">{err}</div>}
        <a className="small" style={{ textDecoration: "underline" }} href="https://buscacepinter.correios.com.br/app/endereco/index.php" target="_blank" rel="noreferrer">Não sei meu CEP</a>
        {opts && (
          <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
            <div className="small muted">Entrega para {region}</div>
            {opts.map((o) => (
              <label key={o.id} className="ship-opt">
                <span><input type="radio" name="ship" checked={ship?.id === o.id} onChange={() => setShipId(o.id)} />
                  {o.label}<br /><small className="muted">chega entre {fmtDate(addBusinessDays(o.daysMin))} e {fmtDate(addBusinessDays(o.daysMax))} · {o.note}</small></span>
                <b>{o.price === 0 ? "Grátis" : brl(o.price)}</b>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="stickybar">
        <div className="p"><b>{brl(info.price)}</b><span className="small price-pix">{brl(info.pix)} no Pix</span></div>
        <button className="btn accent" disabled={out} onClick={() => add(line)}>Adicionar ao carrinho</button>
      </div>

      {ship && (
        <div className="final" aria-live="polite">
          <dl>
            <div><dt>Produto ({qty}×)</dt><dd>{brl(merch)}</dd></div>
            {asm > 0 && <div><dt>Montagem</dt><dd>{brl(asm)}</dd></div>}
            <div><dt>Frete</dt><dd>{ship.price === 0 ? "Grátis" : brl(ship.price)}</dd></div>
            <div className="tot"><dt>Preço final</dt><dd>{brl(total)}</dd></div>
            <div className="small muted"><dt>No Pix</dt><dd>{brl(total - (merch + asm) * 0.05)}</dd></div>
          </dl>
        </div>
      )}
    </div>
  );
}
