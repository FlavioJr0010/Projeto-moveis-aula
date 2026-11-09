import { NextResponse } from "next/server";
import { computeOrder, type PayMethod } from "@/lib/checkout";
import { isValidLine, type CartLine } from "@/lib/pricing";
import { isCep } from "@/lib/format";
import { addBusinessDays } from "@/lib/shipping";
import { randomBytes } from "node:crypto";

interface Body {
  items?: CartLine[];
  customer?: { nome?: string; email?: string; telefone?: string };
  address?: { cep?: string; rua?: string; numero?: string; bairro?: string; cidade?: string; uf?: string };
  shippingId?: string;
  payment?: { method?: PayMethod; installments?: number; last4?: string };
}

const fail = (error: string, field?: string) => NextResponse.json({ error, field }, { status: 400 });

export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as Body | null;
  if (!b) return fail("Requisição inválida.");

  const c = b.customer ?? {}, a = b.address ?? {}, pay = b.payment ?? {};
  if (!c.nome || c.nome.trim().split(/\s+/).length < 2) return fail("Informe nome e sobrenome.", "nome");
  if (!c.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.email)) return fail("E-mail inválido.", "email");
  if (!c.telefone || c.telefone.replace(/\D/g, "").length < 10) return fail("Telefone inválido.", "telefone");
  if (!a.cep || !isCep(a.cep)) return fail("CEP inválido.", "cep");
  if (!a.rua || !a.numero || !a.bairro || !a.cidade || !a.uf) return fail("Complete o endereço.", "rua");
  if (!pay.method || !["pix", "cartao", "boleto"].includes(pay.method)) return fail("Escolha a forma de pagamento.");

  const items = Array.isArray(b.items) ? b.items : [];
  if (!items.length) return fail("Carrinho vazio");
  if (!items.every(isValidLine)) return fail("Itens do carrinho inválidos. Atualize o carrinho e tente de novo.");

  const calc = computeOrder(items, a.cep as string, b.shippingId ?? "", pay.method, pay.installments);
  if (calc.error !== undefined) return fail(calc.error);

  // Simulação de gateway: cartão final 0002 é recusado (cartão de teste 4000 0000 0000 0002).
  if (pay.method === "cartao") {
    if (!pay.last4 || !/^\d{4}$/.test(pay.last4)) return fail("Dados do cartão inválidos.");
    if (pay.last4 === "0002") return NextResponse.json({ error: "Pagamento recusado pelo emissor (simulação).", field: "cartao" }, { status: 402 });
  }

  const id = "CR-" + randomBytes(3).toString("hex").toUpperCase();
  const code = randomBytes(16).toString("hex");
  return NextResponse.json({
    id,
    createdAt: new Date().toISOString(),
    status: pay.method === "cartao" ? "pago" : "aguardando_pagamento",
    simulated: true,
    customer: { nome: c.nome.trim(), email: c.email.trim() },
    address: a,
    shipping: { label: calc.option.label, price: calc.option.price, deliveryBy: addBusinessDays(calc.option.daysMax).toISOString() },
    payment: {
      method: pay.method, installments: calc.totals.installments,
      pixCode: pay.method === "pix" ? `00020126SIMULADO${code}5204000053039865802BR` : undefined,
      boletoLine: pay.method === "boleto" ? `00000.00000 00000.000000 00000.000000 0 ${code.slice(0, 14).replace(/\D/g, "0")}` : undefined,
    },
    totals: calc.totals,
    items: calc.cart.lines.map((l) => ({ slug: l.slug, name: l.product.name, qty: l.qty, color: l.color, unitPrice: l.unitPrice, assembly: l.assembly })),
  });
}
