"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { bySlug } from "@/data/products";
import { evaluateCompat, type CompatItem, type CompatResult } from "@/lib/compat";
import { brl } from "@/lib/format";
import { whatsappLink } from "@/lib/whatsapp";

const KEY = "casa-raiz:compat";
interface Saved { yes: string[]; no: string[] }
const load = (): Saved => { try { const s = JSON.parse(localStorage.getItem(KEY) ?? ""); return { yes: s.yes ?? [], no: s.no ?? [] }; } catch { return { yes: [], no: [] }; } };
const save = (s: Saved) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* sem armazenamento: a decisão vale só nesta visita */ } };

const ICON = { ok: "✓", atencao: "!", indeterminado: "?" } as const;
const LEVEL = { ok: "ok", atencao: "warn", indeterminado: "warn" } as const;

/** Conecta Compatível: avisos de compatibilidade em kits e carrinho. Nunca bloqueia a compra. */
export function CompatAlerts({ items }: { items: CompatItem[] }) {
  const [saved, setSaved] = useState<Saved>({ yes: [], no: [] });
  useEffect(() => setSaved(load()), []);
  const update = (s: Saved) => { setSaved(s); save(s); };

  const results = useMemo(() => evaluateCompat(items, new Set(saved.yes)), [items, saved.yes]);
  const visible = results.filter((r) => !saved.no.includes(r.key));
  if (!visible.length) return null;

  return (
    <section aria-label="Compatibilidade entre os itens" style={{ display: "grid", gap: 12, marginBottom: 16 }}>
      {visible.map((r) => <Alert key={r.key} r={r} onYes={() => update({ ...saved, yes: [...saved.yes, r.key] })} onNo={() => update({ ...saved, no: [...saved.no, r.key] })} />)}
    </section>
  );
}

function Alert({ r, onYes, onNo }: { r: CompatResult; onYes: () => void; onNo: () => void }) {
  const mesa = bySlug(r.mesa)!, seat = bySlug(r.assento)!;
  if (!r.presumed) {
    return (
      <div className="match warn" role="group" aria-label="Pergunta sobre uso conjunto">
        <div className="match-head"><span className="match-ico" aria-hidden>?</span>
          <div><b>Você pretende usar estes itens juntos?</b><div className="small muted">{mesa.name} e {seat.name}. Se sim, conferimos se as alturas combinam.</div></div></div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          <button className="btn sm" onClick={onYes}>Sim, conferir</button>
          <button className="btn ghost sm" onClick={onNo}>Não, são para usos diferentes</button>
        </div>
      </div>
    );
  }
  return (
    <div className={`match ${LEVEL[r.status]}`} role="group" aria-label={r.title}>
      <div className="match-head"><span className="match-ico" aria-hidden>{ICON[r.status]}</span>
        <div><b>{r.title}</b><div className="small muted">{mesa.name} + {seat.name}</div></div></div>
      <p style={{ margin: "8px 0" }}>{r.text}</p>
      {r.missing.length > 0 && <p className="small" style={{ margin: "0 0 8px" }}>Falta informar: {r.missing.join(", ")}.</p>}
      {r.alternatives.length > 0 && (
        <div className="small" style={{ margin: "0 0 8px" }}>
          <b>Alternativas com altura de assento informada:</b>
          <ul className="match-list">{r.alternatives.map((s) => { const a = bySlug(s)!; return <li key={s}><Link href={`/produto/${s}`}>{a.name}</Link> · {brl(a.price)}</li>; })}</ul>
        </div>
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {r.status !== "ok" && <a className="btn ghost sm" href={whatsappLink(`Olá! Tenho uma dúvida sobre usar "${mesa.name}" com "${seat.name}".`)} target="_blank" rel="noreferrer">Tirar dúvida no WhatsApp (demo)</a>}
        <button className="btn ghost sm" onClick={onNo}>Entendi, dispensar aviso</button>
      </div>
      <p className="small muted" style={{ margin: "8px 0 0" }}>Este aviso não altera preços nem o carrinho; você pode seguir com a compra normalmente.</p>
    </div>
  );
}
