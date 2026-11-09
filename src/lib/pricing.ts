import { bundleBySlug, bySlug, type Product } from "@/data/products";
import { round2 } from "./format";

/** Regras comerciais num único lugar: site e API usam as mesmas contas. */
export const PIX_DISCOUNT = 0.05; // 5% no Pix
export const MAX_INSTALLMENTS = 10;
export const MIN_INSTALLMENT = 50;
export const FREE_SHIPPING_FROM = 1999;

export interface PriceInfo {
  listPrice: number;
  price: number;
  pix: number;
  discountPct: number;
  installments: number;
  installmentValue: number;
}

export function priceInfo(p: Pick<Product, "listPrice" | "price">, unitFactor = 1): PriceInfo {
  const price = round2(p.price * unitFactor);
  const installments = Math.max(1, Math.min(MAX_INSTALLMENTS, Math.floor(price / MIN_INSTALLMENT)));
  return {
    listPrice: p.listPrice,
    price,
    pix: round2(price * (1 - PIX_DISCOUNT)),
    discountPct: Math.round((1 - price / p.listPrice) * 100),
    installments,
    installmentValue: round2(price / installments),
  };
}

export interface CartLine {
  slug: string;
  qty: number;
  color: string;
  assembly: boolean;
  bundle?: string;
}

export const lineKey = (l: CartLine) => `${l.slug}|${l.color}|${l.assembly ? 1 : 0}|${l.bundle ?? ""}`;

export interface PricedLine extends CartLine {
  product: Product;
  unitPrice: number;
  lineTotal: number;
  assemblyTotal: number;
  bundleSaving: number;
}

export interface CartTotals {
  lines: PricedLine[];
  subtotal: number;
  bundleSavings: number;
  assembly: number;
  weightKg: number;
  merchandise: number; // subtotal - bundleSavings
  count: number;
}

export function priceCart(lines: CartLine[]): CartTotals {
  const priced: PricedLine[] = [];
  for (const l of lines) {
    const product = bySlug(l.slug);
    if (!product || l.qty < 1) continue;
    const qty = Math.min(l.qty, product.stock, 20);
    const bundle = l.bundle ? bundleBySlug(l.bundle) : undefined;
    const pct = bundle ? bundle.discountPct / 100 : 0;
    const unitPrice = round2(product.price * (1 - pct));
    priced.push({
      ...l, qty, product, unitPrice,
      lineTotal: round2(unitPrice * qty),
      bundleSaving: round2((product.price - unitPrice) * qty),
      assemblyTotal: l.assembly ? product.assemblyPrice * qty : 0,
    });
  }
  const subtotal = round2(priced.reduce((s, l) => s + l.product.price * l.qty, 0));
  const bundleSavings = round2(priced.reduce((s, l) => s + l.bundleSaving, 0));
  return {
    lines: priced,
    subtotal,
    bundleSavings,
    merchandise: round2(subtotal - bundleSavings),
    assembly: priced.reduce((s, l) => s + l.assemblyTotal, 0),
    weightKg: priced.reduce((s, l) => s + l.product.weightKg * l.qty, 0),
    count: priced.reduce((s, l) => s + l.qty, 0),
  };
}
