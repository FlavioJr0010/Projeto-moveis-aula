"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { brl } from "@/lib/format";
import { fmtDate } from "@/lib/shipping";

interface Order {
  id: string; status: string; customer: { nome: string; email: string };
  shipping: { label: string; price: number; deliveryBy: string };
  payment: { method: string; installments: number; pixCode?: string; boletoLine?: string };
  totals: { merchandise: number; assembly: number; shipping: number; pixDiscount: number; total: number };
  items: { name: string; qty: number; color: string; unitPrice: number }[];
}

export function OrderClient() {
  const [o, setO] = useState<Order | null | undefined>(undefined);
  const [copied, setCopied] = useState(false);
  useEffect(() => { try { const r = localStorage.getItem("casaraiz:order"); setO(r ? JSON.parse(r) : null); } catch { setO(null); } }, []);

  if (o === undefined) return <p className="muted">Carregando…</p>;
  if (!o) return <div className="card empty"><h2>Nenhum pedido recente</h2><Link className="btn" href="/produtos">Ver móveis</Link></div>;
  const code = o.payment.pixCode ?? o.payment.boletoLine;
  const copy = async () => { try { await navigator.clipboard.writeText(code ?? ""); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { /* sem permissão */ } };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", display: "grid", gap: 18 }}>
      <div className="alert demo">Pedido simulado: nenhum pagamento real foi processado.</div>
      <div>
        <h1 style={{ fontSize: "2rem" }}>{o.status === "pago" ? "Pagamento aprovado! 🎉" : "Pedido recebido!"}</h1>
        <p className="muted">Pedido <b>{o.id}</b>. Enviamos os detalhes para {o.customer.email}.</p>
      </div>
      {code && (
        <div className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: "1.2rem" }}>{o.payment.method === "pix" ? "Pague com Pix" : "Seu boleto"}</h2>
          <p className="code" aria-label="Código de pagamento">{code}</p>
          <button className="btn" onClick={copy}>{copied ? "Copiado ✓" : "Copiar código"}</button>
        </div>
      )}
      <div className="card" style={{ padding: 20 }}>
        <h2 style={{ fontSize: "1.2rem" }}>Entrega</h2>
        <p style={{ margin: 0 }}>{o.shipping.label}. Previsão até <b>{fmtDate(new Date(o.shipping.deliveryBy))}</b>.</p>
      </div>
      <div className="card" style={{ padding: 20 }}>
        <h2 style={{ fontSize: "1.2rem" }}>Itens</h2>
        {o.items.map((i, k) => <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "6px 0" }}><span>{i.qty}× {i.name} <span className="muted small">({i.color})</span></span><b>{brl(i.unitPrice * i.qty)}</b></div>)}
        <dl className="summary" style={{ border: 0, padding: "12px 0 0", position: "static" }}>
          {o.totals.assembly > 0 && <div><dt>Montagem</dt><dd>{brl(o.totals.assembly)}</dd></div>}
          <div><dt>Frete</dt><dd>{o.totals.shipping === 0 ? "Grátis" : brl(o.totals.shipping)}</dd></div>
          {o.totals.pixDiscount > 0 && <div className="save"><dt>Desconto Pix</dt><dd>− {brl(o.totals.pixDiscount)}</dd></div>}
          <div className="tot"><dt>Total</dt><dd>{brl(o.totals.total)}{o.payment.installments > 1 ? ` em ${o.payment.installments}x` : ""}</dd></div>
        </dl>
      </div>
      <Link className="btn ghost" href="/">Voltar para a loja</Link>
    </div>
  );
}
