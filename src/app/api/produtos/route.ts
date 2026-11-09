import { NextResponse } from "next/server";
import { parseParams, searchProducts } from "@/lib/search";

export function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const list = searchProducts(parseParams((k) => sp.get(k)));
  const limit = Math.min(Number(sp.get("limit")) || 50, 50);
  return NextResponse.json({
    total: list.length,
    items: list.slice(0, limit).map((p) => ({
      slug: p.slug, name: p.name, category: p.category, subcategoria: p.subcategoria, contextos: p.contextos, image: p.images[0],
      price: p.info.price, pix: p.info.pix, dims: p.dims,
    })),
  });
}
