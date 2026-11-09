"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { brl, isCep, maskCep } from "@/lib/format";
import { computeOrder, luhn, type PayMethod } from "@/lib/checkout";
import { addBusinessDays, estimateShipping, fmtDate } from "@/lib/shipping";
import { priceCart } from "@/lib/pricing";
import { useCart } from "./CartProvider";

const UFS = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");
type Errors = Record<string, string>;

export function CheckoutClient() {
  const { lines, ready, cep, setCep, clear } = useCart();
  const router = useRouter();
  const [f, setF] = useState({ nome: "", email: "", telefone: "", cep: "", rua: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "" });
  const [shipId, setShipId] = useState("economico");
  const [method, setMethod] = useState<PayMethod>("pix");
  const [card, setCard] = useState({ num: "", nome: "", val: "", cvv: "" });
  const [inst, setInst] = useState(1);
  const [errors, setErrors] = useState<Errors>({});
  const [serverErr, setServerErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (ready && cep && !f.cep) setF((p) => ({ ...p, cep: maskCep(cep) })); }, [ready, cep, f.cep]);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  const lookup = async (value: string) => {
    if (!isCep(value)) return;
    setCep(value);
    try {
      const r = await fetch(`https://viacep.com.br/ws/${value.replace(/\D/g, "")}/json/`);
      const j = await r.json();
      if (!j.erro) setF((p) => ({ ...p, rua: j.logradouro || p.rua, bairro: j.bairro || p.bairro, cidade: j.localidade || p.cidade, uf: j.uf || p.uf }));
    } catch { /* sem internet: o usuário preenche manualmente */ }
  };

  const cart = useMemo(() => priceCart(lines), [lines]);
  const ship = isCep(f.cep) ? estimateShipping(f.cep, cart.merchandise, cart.weightKg) : null;
  const calc = isCep(f.cep) ? computeOrder(lines, f.cep, shipId, method, inst) : null;
  const ok = calc && calc.error === undefined ? calc : null;

  if (!ready) return <p className="muted">Carregando…</p>;
  if (!cart.lines.length) return <div className="card empty"><h2>Não há itens para finalizar</h2><Link className="btn" href="/produtos">Ver móveis</Link></div>;

  const validate = () => {
    const e: Errors = {};
    if (f.nome.trim().split(/\s+/).length < 2) e.nome = "Informe nome e sobrenome";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) e.email = "E-mail inválido";
    if (f.telefone.replace(/\D/g, "").length < 10) e.telefone = "Telefone com DDD";
    if (!isCep(f.cep)) e.cep = "CEP inválido";
    if (!f.rua) e.rua = "Obrigatório"; if (!f.numero) e.numero = "Obrigatório"; if (!f.bairro) e.bairro = "Obrigatório"; if (!f.cidade) e.cidade = "Obrigatório"; if (!f.uf) e.uf = "Obrigatório";
    if (method === "cartao") {
      if (!luhn(card.num)) e.num = "Número de cartão inválido";
      if (card.nome.trim().length < 3) e.cnome = "Nome como no cartão";
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.val)) e.val = "Use MM/AA";
      if (!/^\d{3,4}$/.test(card.cvv)) e.cvv = "CVV inválido";
    }
    setErrors(e);
    if (Object.keys(e).length) document.getElementById(`c-${Object.keys(e)[0]}`)?.focus();
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault(); setServerErr("");
    if (!validate() || !ok) return;
    setBusy(true);
    try {
      // Nunca enviamos número completo nem CVV: só os 4 últimos dígitos (simulação de tokenização).
      const r = await fetch("/api/pedidos", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines, customer: { nome: f.nome, email: f.email, telefone: f.telefone },
          address: { cep: f.cep, rua: f.rua, numero: f.numero, bairro: f.bairro, cidade: f.cidade, uf: f.uf },
          shippingId: shipId,
          payment: { method, installments: inst, last4: method === "cartao" ? card.num.replace(/\D/g, "").slice(-4) : undefined },
        }),
      });
      const j = await r.json();
      if (!r.ok) { setServerErr(j.error || "Não foi possível concluir."); return; }
      try { localStorage.setItem("casaraiz:order", JSON.stringify(j)); } catch { /* ignora */ }
      clear();
      router.push("/pedido");
    } catch { setServerErr("Sem conexão. Tente novamente."); }
    finally { setBusy(false); }
  };

  const Field = ({ id, label, cls = "s6", err, children }: { id: string; label: string; cls?: string; err?: string; children: React.ReactNode }) => (
    <div className={cls}><label htmlFor={`c-${id}`} className="small">{label}</label>{children}{err && <div className="err" role="alert">{err}</div>}</div>
  );
  const txt = (id: keyof typeof f, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <input id={`c-${id}`} className="field" value={f[id]} onChange={set(id)} aria-invalid={!!errors[id]} {...extra} />
  );
  const maxInst = ok?.maxInstallments ?? 1;

  return (
    <form className="cart-layout" onSubmit={submit} noValidate>
      <div>
        <div className="alert demo" style={{ marginBottom: 16 }}>Ambiente de demonstração: nenhuma cobrança real é feita. Cartão de teste aprovado: 4111 1111 1111 1111. Recusado: 4000 0000 0000 0002.</div>

        <section className="step"><h2><b>1</b> Seus dados</h2>
          <div className="form-grid">
            <Field id="nome" label="Nome completo" err={errors.nome}>{txt("nome", { autoComplete: "name" })}</Field>
            <Field id="email" label="E-mail" cls="s3" err={errors.email}>{txt("email", { type: "email", autoComplete: "email", inputMode: "email" })}</Field>
            <Field id="telefone" label="Celular com DDD" cls="s3" err={errors.telefone}>{txt("telefone", { type: "tel", autoComplete: "tel", inputMode: "tel" })}</Field>
          </div>
        </section>

        <section className="step"><h2><b>2</b> Entrega</h2>
          <div className="form-grid">
            <Field id="cep" label="CEP" cls="s2" err={errors.cep}>
              <input id="c-cep" className="field" inputMode="numeric" maxLength={9} autoComplete="postal-code" value={f.cep} aria-invalid={!!errors.cep}
                onChange={(e) => { const m = maskCep(e.target.value); setF((p) => ({ ...p, cep: m })); lookup(m); }} />
            </Field>
            <Field id="rua" label="Rua" cls="s4" err={errors.rua}>{txt("rua", { autoComplete: "address-line1" })}</Field>
            <Field id="numero" label="Número" cls="s2" err={errors.numero}>{txt("numero", { inputMode: "numeric" })}</Field>
            <Field id="complemento" label="Complemento" cls="s4">{txt("complemento", { autoComplete: "address-line2" })}</Field>
            <Field id="bairro" label="Bairro" cls="s2" err={errors.bairro}>{txt("bairro")}</Field>
            <Field id="cidade" label="Cidade" cls="s3" err={errors.cidade}>{txt("cidade", { autoComplete: "address-level2" })}</Field>
            <Field id="uf" label="UF" cls="s1" err={errors.uf}>
              <select id="c-uf" className="field" value={f.uf} onChange={set("uf")} aria-invalid={!!errors.uf}><option value="">UF</option>{UFS.map((u) => <option key={u}>{u}</option>)}</select>
            </Field>
          </div>
          {ship ? (
            <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
              <div className="small muted">Opções para {ship.region}</div>
              {ship.options.map((o) => (
                <label key={o.id} className="ship-opt"><span><input type="radio" name="ship" checked={shipId === o.id} onChange={() => setShipId(o.id)} />{o.label}<br />
                  <small className="muted">chega entre {fmtDate(addBusinessDays(o.daysMin))} e {fmtDate(addBusinessDays(o.daysMax))} · {o.note}</small></span><b>{o.price === 0 ? "Grátis" : brl(o.price)}</b></label>
              ))}
            </div>
          ) : <p className="hint" style={{ marginTop: 16 }}>Digite o CEP para ver as opções de entrega.</p>}
        </section>

        <section className="step"><h2><b>3</b> Pagamento</h2>
          <div className="pay-tabs" role="group" aria-label="Forma de pagamento">
            <button type="button" className="pay-tab" aria-pressed={method === "pix"} onClick={() => setMethod("pix")}>Pix<small>5% de desconto</small></button>
            <button type="button" className="pay-tab" aria-pressed={method === "cartao"} onClick={() => setMethod("cartao")}>Cartão<small>até 10x sem juros</small></button>
            <button type="button" className="pay-tab" aria-pressed={method === "boleto"} onClick={() => setMethod("boleto")}>Boleto<small>vence em 3 dias</small></button>
          </div>
          {method === "pix" && <p className="muted">Você receberá o código Pix na próxima tela. O pedido é confirmado assim que o pagamento é identificado.</p>}
          {method === "boleto" && <p className="muted">O boleto será gerado na próxima tela e o pedido fica reservado por 3 dias.</p>}
          {method === "cartao" && (
            <div className="form-grid">
              <Field id="num" label="Número do cartão" err={errors.num}><input id="c-num" className="field" inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000" maxLength={23} value={card.num} aria-invalid={!!errors.num}
                onChange={(e) => setCard({ ...card, num: e.target.value.replace(/\D/g, "").slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ") })} /></Field>
              <Field id="cnome" label="Nome impresso no cartão" err={errors.cnome}><input id="c-cnome" className="field" autoComplete="cc-name" value={card.nome} aria-invalid={!!errors.cnome} onChange={(e) => setCard({ ...card, nome: e.target.value })} /></Field>
              <Field id="val" label="Validade (MM/AA)" cls="s3" err={errors.val}><input id="c-val" className="field" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/AA" maxLength={5} value={card.val} aria-invalid={!!errors.val}
                onChange={(e) => { const d = e.target.value.replace(/\D/g, "").slice(0, 4); setCard({ ...card, val: d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d }); }} /></Field>
              <Field id="cvv" label="CVV" cls="s3" err={errors.cvv}><input id="c-cvv" className="field" inputMode="numeric" autoComplete="cc-csc" maxLength={4} value={card.cvv} aria-invalid={!!errors.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, "") })} /></Field>
              <Field id="inst" label="Parcelas">
                <select id="c-inst" className="field" value={Math.min(inst, maxInst)} onChange={(e) => setInst(Number(e.target.value))}>
                  {Array.from({ length: maxInst }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}x de {brl((ok?.totals.total ?? 0) / n)} sem juros</option>)}
                </select>
              </Field>
            </div>
          )}
        </section>
      </div>

      <aside className="summary" aria-label="Resumo do pedido">
        <h2 style={{ fontSize: "1.25rem", margin: 0 }}>Resumo</h2>
        {cart.lines.map((l) => <div key={`${l.slug}${l.color}${l.assembly}${l.bundle}`} className="small" style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><span>{l.qty}× {l.product.name}</span><span>{brl(l.lineTotal)}</span></div>)}
        <dl>
          <div><dt>Produtos</dt><dd>{brl(cart.merchandise)}</dd></div>
          {cart.bundleSavings > 0 && <div className="save"><dt>Já com desconto de ambiente</dt><dd>− {brl(cart.bundleSavings)}</dd></div>}
          {cart.assembly > 0 && <div><dt>Montagem</dt><dd>{brl(cart.assembly)}</dd></div>}
          <div><dt>Frete</dt><dd>{ok ? (ok.totals.shipping === 0 ? "Grátis" : brl(ok.totals.shipping)) : "—"}</dd></div>
          {ok && ok.totals.pixDiscount > 0 && <div className="save"><dt>Desconto Pix</dt><dd>− {brl(ok.totals.pixDiscount)}</dd></div>}
          <div className="tot"><dt>Total</dt><dd>{ok ? brl(ok.totals.total) : "—"}</dd></div>
          {ok && method === "cartao" && <div className="small muted"><dt>{ok.totals.installments}x sem juros</dt><dd>{brl(ok.totals.installmentValue)}</dd></div>}
        </dl>
        {serverErr && <div className="alert err-box" role="alert">{serverErr}</div>}
        <button className="btn accent block" disabled={busy || !ok}>{busy ? "Processando…" : `Pagar ${ok ? brl(ok.totals.total) : ""}`}</button>
        <Link href="/carrinho" className="btn ghost block">Voltar ao carrinho</Link>
      </aside>
    </form>
  );
}
