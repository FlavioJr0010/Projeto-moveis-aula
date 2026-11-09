import { NextResponse } from "next/server";
import { bySlug } from "@/data/products";
import { evaluateMatch, type CartItem } from "@/lib/match";

export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as { slug?: string; color?: string; items?: CartItem[] } | null;
  const p = b?.slug ? bySlug(b.slug) : undefined;
  if (!b || !p) return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  const items = Array.isArray(b.items) ? b.items.filter((i) => i && typeof i.slug === "string" && typeof i.color === "string") : [];
  const result = evaluateMatch(p.slug, b.color ?? p.colors[0].name, items);
  return NextResponse.json(result ?? { score: null, level: null, label: "Carrinho vazio: nada para comparar.", reasons: [] });
}
