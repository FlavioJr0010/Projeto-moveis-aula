"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { categories, img } from "@/data/products";
import { brl } from "@/lib/format";
import { useCart } from "./CartProvider";
import { CartIcon, SearchIcon } from "./Icons";

interface Sug { slug: string; name: string; image: string; price: number }

export function Header() {
  const router = useRouter();
  const { count } = useCart();
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Sug[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const box = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) { setItems([]); return; }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/produtos?q=${encodeURIComponent(q)}&limit=5`, { signal: ctrl.signal });
        const j = await r.json();
        setItems(j.items); setOpen(true); setActive(-1);
      } catch { /* cancelado ou offline */ }
    }, 200);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q]);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const onKey = (e: React.KeyboardEvent) => {
    if (!open || !items.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % items.length); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a <= 0 ? items.length - 1 : a - 1)); }
    if (e.key === "Escape") setOpen(false);
    if (e.key === "Enter" && active >= 0) { e.preventDefault(); setOpen(false); router.push(`/produto/${items[active].slug}`); }
  };

  return (
    <>
      <div className="topbar">Frete grátis acima de R$ 1.999 (SP, Sul e Sudeste) · 5% off no Pix · até 10x sem juros</div>
      <header className="header">
        <div className="container">
          <div className="header-row">
            <Link href="/" className="logo" aria-label="Casa Raiz, página inicial">🌿 Casa<span>Raiz</span></Link>
            <form ref={box} className="search" role="search" action="/produtos" onSubmit={() => setOpen(false)}>
              <SearchIcon size={18} />
              <input
                name="q" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey}
                placeholder="Buscar sofá, mesa, cama…" aria-label="Buscar produtos" autoComplete="off"
                role="combobox" aria-expanded={open && items.length > 0} aria-controls={listId} aria-autocomplete="list"
              />
              {open && items.length > 0 && (
                <div className="suggest" id={listId} role="listbox">
                  {items.map((s, i) => (
                    <Link key={s.slug} href={`/produto/${s.slug}`} role="option" aria-selected={i === active} onClick={() => setOpen(false)}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img(s.image, 96, 96)} alt="" width={44} height={44} />
                      <span style={{ flex: 1 }}>{s.name}</span><b>{brl(s.price)}</b>
                    </Link>
                  ))}
                </div>
              )}
            </form>
            <Link href="/carrinho" className="cart-link" aria-label={`Carrinho, ${count} itens`}>
              <CartIcon /> <span className="hide-sm">Carrinho</span>
              {count > 0 && <span className="count">{count}</span>}
            </Link>
          </div>
          <nav className="nav" aria-label="Categorias">
            {categories.map((c) => <Link key={c.slug} href={`/produtos?categoria=${c.slug}`}>{c.label}</Link>)}
            <Link href="/ambientes">Ambientes completos</Link>
            <Link href="/quiz">Descubra seu estilo</Link>
            <Link href="/sustentabilidade">Sustentabilidade</Link>
          </nav>
        </div>
      </header>
    </>
  );
}
