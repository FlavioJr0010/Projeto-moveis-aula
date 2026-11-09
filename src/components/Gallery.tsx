"use client";
import Image from "next/image";
import { useState } from "react";
import { img, type Product } from "@/data/products";
import { FitVisualizer } from "./FitVisualizer";

export function Gallery({ product }: { product: Product }) {
  const [tab, setTab] = useState<"foto" | "espaco">("foto");
  return (
    <div className="gallery">
      <div className="tabs" role="tablist" aria-label="Visualização do produto">
        <button className="tab" role="tab" id="t-foto" aria-selected={tab === "foto"} aria-controls="p-foto" onClick={() => setTab("foto")}>Foto</button>
        <button className="tab" role="tab" id="t-espaco" aria-selected={tab === "espaco"} aria-controls="p-espaco" onClick={() => setTab("espaco")}>📏 Cabe no meu espaço?</button>
      </div>
      {tab === "foto" ? (
        <div id="p-foto" role="tabpanel" aria-labelledby="t-foto" className="main">
          <Image src={img(product.images[0], 1100, 825)} alt={product.name} width={1100} height={825} priority sizes="(max-width: 960px) 100vw, 600px" />
        </div>
      ) : (
        <div id="p-espaco" role="tabpanel" aria-labelledby="t-espaco"><FitVisualizer product={product} /></div>
      )}
      <p className="small muted" style={{ marginTop: 8 }}>Imagem ilustrativa de demonstração.</p>
    </div>
  );
}
