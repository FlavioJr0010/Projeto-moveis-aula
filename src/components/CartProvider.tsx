"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { lineKey, priceCart, type CartLine } from "@/lib/pricing";

interface Ctx {
  lines: CartLine[];
  ready: boolean;
  cep: string;
  setCep: (v: string) => void;
  add: (l: CartLine, silent?: boolean) => void;
  addMany: (ls: CartLine[]) => void;
  setQty: (key: string, qty: number) => void;
  toggleAssembly: (key: string) => void;
  remove: (key: string) => void;
  clear: () => void;
  count: number;
}
const CartCtx = createContext<Ctx | null>(null);
export const useCart = () => {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart fora do CartProvider");
  return c;
};

const KEY = "casaraiz:cart:v1";
const CEP_KEY = "casaraiz:cep";
const safe = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* ignora: modo privado */ } },
};

function merge(lines: CartLine[], l: CartLine) {
  const k = lineKey(l);
  const i = lines.findIndex((x) => lineKey(x) === k);
  if (i === -1) return [...lines, l];
  return lines.map((x, j) => (j === i ? { ...x, qty: Math.min(x.qty + l.qty, 20) } : x));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [cep, setCepState] = useState("");
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    try {
      const raw = safe.get(KEY);
      if (raw) setLines(priceCart(JSON.parse(raw)).lines.map(({ slug, qty, color, assembly, bundle }) => ({ slug, qty, color, assembly, bundle })));
    } catch { /* carrinho corrompido: começa vazio */ }
    setCepState(safe.get(CEP_KEY) ?? "");
    setReady(true);
  }, []);
  useEffect(() => { if (ready) safe.set(KEY, JSON.stringify(lines)); }, [lines, ready]);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  const value = useMemo<Ctx>(() => ({
    lines, ready, cep,
    setCep: (v) => { setCepState(v); safe.set(CEP_KEY, v); },
    add: (l, silent) => { setLines((p) => merge(p, l)); if (!silent) notify("Adicionado ao carrinho"); },
    addMany: (ls) => { setLines((p) => ls.reduce(merge, p)); notify(`${ls.length} itens adicionados ao carrinho`); },
    setQty: (key, qty) => setLines((p) => p.map((x) => (lineKey(x) === key ? { ...x, qty: Math.max(1, Math.min(qty, 20)) } : x))),
    toggleAssembly: (key) => setLines((p) => p.map((x) => (lineKey(x) === key ? { ...x, assembly: !x.assembly } : x))),
    remove: (key) => setLines((p) => p.filter((x) => lineKey(x) !== key)),
    clear: () => setLines([]),
    count: lines.reduce((s, l) => s + l.qty, 0),
  }), [lines, ready, cep, notify]);

  return (
    <CartCtx.Provider value={value}>
      {children}
      {toast && (
        <div className="toast" role="status">
          {toast} <Link href="/carrinho">Ver carrinho</Link>
        </div>
      )}
    </CartCtx.Provider>
  );
}
