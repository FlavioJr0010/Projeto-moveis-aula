"use client";
import { useRouter } from "next/navigation";
import { bundleBySlug, bySlug } from "@/data/products";
import { useCart } from "./CartProvider";

export function BundleBuy({ slug, label = "Adicionar ambiente ao carrinho", go }: { slug: string; label?: string; go?: boolean }) {
  const { addMany } = useCart();
  const router = useRouter();
  const b = bundleBySlug(slug);
  if (!b) return null;
  const add = () => {
    addMany(b.items.map((i) => ({ slug: i.slug, qty: i.qty, color: i.color ?? bySlug(i.slug)!.colors[0].name, assembly: false, bundle: b.slug })));
    if (go) router.push("/carrinho");
  };
  return <button className="btn accent" onClick={add}>{label}</button>;
}
