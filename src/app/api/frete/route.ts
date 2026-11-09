import { NextResponse } from "next/server";
import { priceCart, type CartLine } from "@/lib/pricing";
import { estimateShipping } from "@/lib/shipping";
import { isCep } from "@/lib/format";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { cep?: string; items?: CartLine[] } | null;
  if (!body?.cep || !isCep(body.cep)) return NextResponse.json({ error: "Informe um CEP válido com 8 dígitos." }, { status: 400 });
  const cart = priceCart(Array.isArray(body.items) ? body.items : []);
  if (!cart.lines.length) return NextResponse.json({ error: "Nenhum produto para calcular." }, { status: 400 });
  const ship = estimateShipping(body.cep, cart.merchandise, cart.weightKg);
  return NextResponse.json(ship);
}
