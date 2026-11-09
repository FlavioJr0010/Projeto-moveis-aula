"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** "Cabe no meu espaço" na home: leva a medida do vão para a listagem já filtrada. */
export function SpaceFinder() {
  const router = useRouter();
  const [w, setW] = useState(""); const [d, setD] = useState("");
  const go = (e: React.FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (w) p.set("w", w); if (d) p.set("d", d);
    router.push(`/produtos?${p}`);
  };
  return (
    <form onSubmit={go} style={{ display: "grid", gap: 10, marginTop: 12 }}>
      <div className="row2">
        <div><label className="small" htmlFor="sf-w">Largura livre (cm)</label><input id="sf-w" className="field" inputMode="numeric" value={w} onChange={(e) => setW(e.target.value.replace(/\D/g, ""))} placeholder="ex.: 200" /></div>
        <div><label className="small" htmlFor="sf-d">Profundidade (cm)</label><input id="sf-d" className="field" inputMode="numeric" value={d} onChange={(e) => setD(e.target.value.replace(/\D/g, ""))} placeholder="ex.: 90" /></div>
      </div>
      <button className="btn sm" disabled={!w && !d}>Ver o que cabe</button>
    </form>
  );
}
