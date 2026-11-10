"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { categories, contextosList, img } from "@/data/products";
import { brl } from "@/lib/format";
import { useCart } from "./CartProvider";
import { CartIcon, CloseIcon, MenuIcon, SearchIcon } from "./Icons";

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

  // menu hambúrguer (drawer)
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const closeMenu = () => { setMenu(false); menuBtn.current?.focus(); };

  useEffect(() => { setMenu(false); }, [pathname]); // fecha ao navegar
  useEffect(() => {
    if (!menu) return;
    closeBtn.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // trava a rolagem do fundo
    return () => { document.body.style.overflow = prev; };
  }, [menu]);

  const onDrawerKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { e.preventDefault(); closeMenu(); return; }
    if (e.key !== "Tab" || !drawer.current) return;
    const f = drawer.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

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
      <div className="topbar" role="region" aria-label="Condições da loja">Frete grátis acima de R$ 1.999 (Irecê e região) · 5% off no Pix · até 10x sem juros</div>
      <header className="header">
        <div className="container">
          <div className="header-row">
            <button ref={menuBtn} type="button" className="menu-btn" aria-label="Abrir menu" aria-expanded={menu} aria-controls="menu-principal" aria-haspopup="dialog" onClick={() => setMenu(true)}>
              <MenuIcon /> <span className="hide-sm">Menu</span>
            </button>
            <Link href="/" className="logo" aria-label="CasaRaiz, página inicial"><span aria-hidden="true">🌿 </span>Casa<span>Raiz</span></Link>
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
            <Link href="/carrinho" className="cart-link" aria-label={count > 0 ? `Carrinho ${count} ${count === 1 ? "item" : "itens"}` : "Carrinho"}>
              <CartIcon /> <span className="hide-sm">Carrinho</span>
              {count > 0 && <>{" "}<span className="count">{count}</span></>}
            </Link>
          </div>
        </div>
      </header>

      {menu && (
        <>
          <div className="drawer-overlay" onClick={closeMenu} aria-hidden="true" />
          <div ref={drawer} id="menu-principal" className="drawer" role="dialog" aria-modal="true" aria-label="Menu principal" onKeyDown={onDrawerKey}>
            <div className="drawer-head">
              <b>Menu</b>
              <button ref={closeBtn} type="button" className="menu-btn" aria-label="Fechar menu" onClick={closeMenu}><CloseIcon /></button>
            </div>
            <nav aria-label="Menu principal" className="drawer-body">
              <h2 className="drawer-title">Para quem</h2>
              <ul>
                {contextosList.map((c) => <li key={c.slug}><Link href={`/produtos?contexto=${c.slug}`}>{c.label}</Link></li>)}
              </ul>
              <h2 className="drawer-title">Categorias</h2>
              <ul>
                <li><Link href="/produtos">Ver todos os móveis</Link></li>
                {categories.map((c) => <li key={c.slug}><Link href={`/produtos?categoria=${c.slug}`}>{c.label}</Link></li>)}
              </ul>
              <h2 className="drawer-title">Explore</h2>
              <ul>
                <li><Link href="/ambientes">Ambientes completos</Link></li>
                <li><Link href="/planejador">Planejador de ambientes</Link></li>
                <li><Link href="/quiz">Descubra seu estilo</Link></li>
                <li><Link href="/sustentabilidade">Sustentabilidade</Link></li>
              </ul>
            </nav>
          </div>
        </>
      )}
    </>
  );
}
