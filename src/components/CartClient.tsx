"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { img } from "@/data/products";
import { brl, isCep, maskCep } from "@/lib/format";
import { FREE_SHIPPING_FROM, lineKey, priceCart } from "@/lib/pricing";
import { estimateShipping } from "@/lib/shipping";
import { useCart } from "./CartProvider";
import { CartHarmony } from "./CartHarmony";

export function CartClient() {
  const { lines, ready, setQty, remove, toggleAssembly, cep, setCep } = useCart();
  const [cepInput, setCepInput] = useState("");
  useEffect(() => { if (ready && cep) setCepInput(maskCep(cep)); }, [ready, cep]);

  if (!ready) return <p className="muted">Carregando…</p>;
  const cart = priceCart(lines);
  if (!cart.lines.length) {
    return <div className="card empty"><h2>Seu carrinho está vazio</h2><p className="muted">Que tal começar pelos ambientes prontos ou pelo quiz de estilo?</p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}><Link className="btn" href="/produtos">Ver móveis</Link><Link className="btn ghost" href="/ambientes">Ambientes completos</Link></div></div>;
  }

  const ship = isCep(cepInput) ? estimateShipping(cepInput, cart.merchandise, cart.weightKg) : null;
  const eco = ship?.options[0];
  const base = cart.merchandise + cart.assembly;
  const total = base + (eco?.price ?? 0);
  const missing = Math.max(0, FREE_SHIPPING_FROM - cart.merchandise);

  return (
    <div className="cart-layout">
      <div>
        <div className="card" style={{ marginBottom: 16, padding: 16 }}>
          {missing > 0
            ? <p style={{ margin: "0 0 8px" }}>Faltam <b>{brl(missing)}</b> para frete grátis (SP, Sul e Sudeste).</p>
            : <p style={{ margin: "0 0 8px" }} className="save">🎉 Você ganhou frete grátis (SP, Sul e Sudeste)!</p>}
          <div className="progress" role="progressbar" aria-label="Progresso para frete grátis" aria-valuemin={0} aria-valuemax={FREE_SHIPPING_FROM} aria-valuenow={Math.min(cart.merchandise, FREE_SHIPPING_FROM)}><i style={{ width: `${Math.min(100, (cart.merchandise / FREE_SHIPPING_FROM) * 100)}%` }} /></div>
        </div>
        <CartHarmony lines={cart.lines} part="summary" />
        <div className="card">
          {cart.lines.map((l) => {
            const key = lineKey(l);
            return (
              <div className="line" key={key}>
                <Link href={`/produto/${l.slug}`}><Image src={img(l.product.images[0], 220, 168)} alt={l.product.name} width={110} height={84} /></Link>
                <div>
                  <Link href={`/produto/${l.slug}`}><b>{l.product.name}</b></Link>
                  <div className="small muted">Cor: {l.color}{l.bundle && <> · <span className="save">desconto de ambiente</span></>}</div>
                  {l.product.assemblyPrice > 0 && (
                    <label className="small" style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4 }}>
                      <input type="checkbox" checked={l.assembly} onChange={() => toggleAssembly(key)} style={{ accentColor: "var(--brand)" }} /> Montagem (+ {brl(l.product.assemblyPrice)})
                    </label>
                  )}
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
                  <div className="qty" role="group" aria-label={`Quantidade de ${l.product.name}`}>
                    <button onClick={() => setQty(key, l.qty - 1)} aria-label="Diminuir" disabled={l.qty <= 1}>−</button><span>{l.qty}</span><button onClick={() => setQty(key, l.qty + 1)} aria-label="Aumentar">+</button>
                  </div>
                  <div style={{ textAlign: "right" }}><b>{brl(l.lineTotal)}</b><br /><button className="small" style={{ background: "none", border: 0, color: "var(--danger)", cursor: "pointer", padding: "8px 0", textDecoration: "underline", minHeight: 36 }} onClick={() => remove(key)}>Remover</button></div>
                </div>
              </div>
            );
          })}
        </div>
        <CartHarmony lines={cart.lines} part="suggest" />
      </div>

      <aside className="summary" aria-label="Resumo do pedido">
        <h2 style={{ fontSize: "1.25rem", margin: 0 }}>Resumo</h2>
        <div>
          <label className="small" htmlFor="cart-cep">Calcule o frete</label>
          <input id="cart-cep" className="field" inputMode="numeric" placeholder="00000-000" maxLength={9} value={cepInput}
            onChange={(e) => { const m = maskCep(e.target.value); setCepInput(m); if (isCep(m)) setCep(m); }} />
          {ship && <div className="small muted" style={{ marginTop: 4 }}>Entrega para {ship.region}</div>}
        </div>
        <dl>
          <div><dt>Produtos</dt><dd>{brl(cart.subtotal)}</dd></div>
          {cart.bundleSavings > 0 && <div className="save"><dt>Desconto de ambiente</dt><dd>− {brl(cart.bundleSavings)}</dd></div>}
          {cart.assembly > 0 && <div><dt>Montagem</dt><dd>{brl(cart.assembly)}</dd></div>}
          <div><dt>Frete</dt><dd>{eco ? (eco.price === 0 ? "Grátis" : brl(eco.price)) : "Informe o CEP"}</dd></div>
          <div className="tot"><dt>Total</dt><dd>{brl(total)}</dd></div>
          <div className="price-pix"><dt>No Pix (5% off)</dt><dd>{brl(total - base * 0.05)}</dd></div>
        </dl>
        <Link className="btn accent block" href="/checkout">Finalizar compra</Link>
        <Link className="btn ghost block" href="/produtos">Continuar comprando</Link>
      </aside>
    </div>
  );
}
