import { MAX_INSTALLMENTS, MIN_INSTALLMENT, PIX_DISCOUNT, priceCart, type CartLine } from "./pricing";
import { estimateShipping } from "./shipping";
import { round2 } from "./format";

export type PayMethod = "pix" | "cartao" | "boleto";

export interface OrderTotals {
  merchandise: number;
  assembly: number;
  shipping: number;
  pixDiscount: number;
  total: number;
  installments: number;
  installmentValue: number;
  bundleSavings: number;
}

/** Cálculo único usado pelo checkout (exibição) e pela API (validação). */
export function computeOrder(lines: CartLine[], cep: string, shippingId: string, method: PayMethod, installments = 1) {
  const cart = priceCart(lines);
  if (!cart.lines.length) return { error: "Carrinho vazio" as const };
  const ship = estimateShipping(cep, cart.merchandise, cart.weightKg);
  if (!ship) return { error: "CEP inválido" as const };
  const opt = ship.options.find((o) => o.id === shippingId);
  if (!opt) return { error: "Opção de entrega inválida" as const };

  const base = cart.merchandise + cart.assembly;
  const pixDiscount = method === "pix" ? round2(base * PIX_DISCOUNT) : 0;
  const total = round2(base - pixDiscount + opt.price);
  const maxInst = Math.max(1, Math.min(MAX_INSTALLMENTS, Math.floor(total / MIN_INSTALLMENT)));
  const inst = method === "cartao" ? Math.min(Math.max(1, installments), maxInst) : 1;
  const totals: OrderTotals = {
    merchandise: cart.merchandise, assembly: cart.assembly, shipping: opt.price,
    pixDiscount, total, installments: inst, installmentValue: round2(total / inst),
    bundleSavings: cart.bundleSavings,
  };
  return { cart, option: opt, region: ship.region, totals, maxInstallments: maxInst };
}

export const luhn = (num: string) => {
  const d = num.replace(/\D/g, "");
  if (d.length < 13 || d.length > 19) return false;
  let sum = 0;
  for (let i = 0; i < d.length; i++) {
    let n = Number(d[d.length - 1 - i]);
    if (i % 2 === 1) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
  }
  return sum % 10 === 0;
};
