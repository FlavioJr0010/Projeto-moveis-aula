"use client";

import Script from "next/script";

// Widget oficial VLibras (Governo Federal) — tradução de textos para Libras.
// Docs: https://vlibras.gov.br/doc/
const VLIBRAS_APP = "https://vlibras.gov.br/app";

declare global {
  interface Window {
    VLibras?: { Widget: new (rootPath: string) => unknown };
    __vlibrasLoaded?: boolean;
  }
}

function init() {
  // evita instanciar duas vezes (ex.: navegação/StrictMode)
  if (window.__vlibrasLoaded || !window.VLibras) return;
  window.__vlibrasLoaded = true;
  new window.VLibras.Widget(VLIBRAS_APP);
}

export function VLibras() {
  return (
    <>
      <div {...{ vw: "true" }} className="enabled">
        <div {...{ "vw-access-button": "true" }} className="active" />
        <div {...{ "vw-plugin-wrapper": "true" }}>
          <div className="vw-plugin-top-wrapper" />
        </div>
      </div>
      <Script
        src={`${VLIBRAS_APP}/vlibras-plugin.js`}
        strategy="afterInteractive"
        onReady={init}
      />
    </>
  );
}
