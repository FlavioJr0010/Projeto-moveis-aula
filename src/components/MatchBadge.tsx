"use client";
import { bestColor } from "@/lib/match";
import { useCart } from "./CartProvider";

const ICON = { ok: "✓", warn: "!", bad: "✕" } as const;

/** Selo compacto nos cards: considera a melhor cor disponível para o carrinho. */
export function MatchBadge({ slug }: { slug: string }) {
  const { lines, ready } = useCart();
  if (!ready || !lines.length) return null;
  const b = bestColor(slug, lines.map((l) => ({ slug: l.slug, color: l.color })));
  if (!b) return null;
  const short = b.r.level === "ok" ? "Combina" : b.r.level === "warn" ? "Com ressalvas" : "Não combina";
  return <span className={`match-badge ${b.r.level}`} title={b.r.reasons[0]?.text}><b aria-hidden>{ICON[b.r.level]}</b> {short}</span>;
}
