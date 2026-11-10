"use client";
import Image from "next/image";
import { useMemo, useState } from "react";
import { ambientesList, img } from "@/data/products";
import { fitsRoom } from "@/lib/planner/geometry";
import { usePlanner } from "@/lib/planner/store";
import { searchProducts } from "@/lib/search";
import { brl } from "@/lib/format";

export function CatalogPanel() {
  const room = usePlanner((s) => s.plan!.room);
  const add = usePlanner((s) => s.add);
  const [q, setQ] = useState("");
  const [onlyRoom, setOnlyRoom] = useState(true);
  const ambLabel = ambientesList.find((a) => a.slug === room.tipo)?.label ?? room.tipo;

  const list = useMemo(() => searchProducts({ q: q || undefined, ambiente: onlyRoom ? room.tipo : undefined }).slice(0, 40), [q, onlyRoom, room.tipo]);

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <label className="sr-only" htmlFor="pl-busca">Buscar móvel</label>
      <input id="pl-busca" className="field" type="search" placeholder="Buscar móvel (ex.: mesa, cadeira, estante)" value={q} onChange={(e) => setQ(e.target.value)} />
      <label style={{ display: "flex", gap: 8, alignItems: "center", minHeight: 44 }}>
        <input type="checkbox" checked={onlyRoom} onChange={(e) => setOnlyRoom(e.target.checked)} style={{ accentColor: "var(--brand)", width: 20, height: 20 }} />
        Só móveis para {ambLabel.toLowerCase()}
      </label>
      <p className="small muted" style={{ margin: 0 }} aria-live="polite">{list.length} {list.length === 1 ? "móvel" : "móveis"}. Você pode adicionar qualquer item do catálogo.</p>
      <ul className="planner-list">
        {list.map((p) => {
          const fits = fitsRoom(p.dims, room);
          return (
            <li key={p.slug} className="planner-row">
              <Image src={img(p.images[0], 160, 160)} alt="" width={56} height={56} style={{ borderRadius: 10, objectFit: "cover", flex: "none" }} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <b className="small" style={{ display: "block", lineHeight: 1.25 }}>{p.name}</b>
                <span className="small muted">{p.dims.w}×{p.dims.d}×{p.dims.h} cm · {brl(p.price)}</span>
              </span>
              <button type="button" className="btn sm" disabled={!fits} onClick={() => add(p.slug)} aria-label={fits ? `Adicionar ${p.name}` : `${p.name} não cabe neste ambiente`}>
                {fits ? "Adicionar" : "Não cabe"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
