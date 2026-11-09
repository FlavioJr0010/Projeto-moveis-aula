"use client";
import { useState } from "react";

export function FiltersPanel({ children, activeCount }: { children: React.ReactNode; activeCount: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" className="btn ghost filter-toggle block" aria-expanded={open} aria-controls="filtros" onClick={() => setOpen(!open)}>
        Filtros{activeCount ? ` (${activeCount})` : ""}
      </button>
      <div id="filtros" className={`filters${open ? "" : " collapsed"}`} style={open ? { marginTop: 12 } : undefined}>{children}</div>
    </div>
  );
}
