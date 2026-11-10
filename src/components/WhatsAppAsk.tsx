"use client";
import { useState } from "react";
import { productQuestion, whatsappLink } from "@/lib/whatsapp";

/** Dúvida sobre o produto no WhatsApp: o cliente vê e edita o texto; nada é enviado sem o clique. */
export function WhatsAppAsk({ name }: { name: string }) {
  const [text, setText] = useState(productQuestion(name));
  return (
    <details style={{ marginTop: 12 }}>
      <summary style={{ cursor: "pointer", padding: "8px 0" }}>Tirar dúvida sobre este produto no WhatsApp (demo)</summary>
      <label className="small" htmlFor="wa-msg">Mensagem (só o produto público; edite à vontade, não inclua dados pessoais)</label>
      <textarea id="wa-msg" className="field" rows={3} value={text} onChange={(e) => setText(e.target.value)} />
      <a className="btn sm" style={{ marginTop: 8 }} href={whatsappLink(text)} target="_blank" rel="noreferrer">Abrir WhatsApp com esta mensagem</a>
    </details>
  );
}
