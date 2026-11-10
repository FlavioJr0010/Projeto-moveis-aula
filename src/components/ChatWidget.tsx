"use client";
import { useRef, useState } from "react";
import { ChatIcon } from "./Icons";
import { whatsappLink } from "@/lib/whatsapp";

const FAQ: Record<string, string> = {
  "Prazo de entrega": "O prazo depende do CEP: de 3 a 18 dias úteis. Informe o CEP na página do produto ou no carrinho para ver o prazo exato.",
  "Montagem": "Oferecemos montagem opcional por R$ 60 a R$ 190, conforme o móvel. Marque a opção na página do produto ou no carrinho.",
  "Troca e devolução": "Você tem 30 dias para trocar ou devolver. Móveis com defeito são recolhidos sem custo (política de demonstração).",
  "Meu móvel passa na porta?": "Na aba “Cabe no meu espaço” da página do produto há uma verificação opcional de acesso para entrega. Ela é só uma triagem pelas medidas que você informar, não uma garantia. Quando a ficha indica que o móvel chega desmontado, isso aparece na página; na dúvida, fale com a gente.",
  "Segunda vida": "A “Segunda vida” (recolher o móvel antigo para doação ou reciclagem) ainda está em estudo: não é um serviço disponível hoje e não há prazo ou crédito prometido.",
};

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<{ me: boolean; t: string }[]>([
    { me: false, t: "Oi! Sou a Rê, do atendimento da Casa Raiz. Como posso ajudar?" },
  ]);
  const end = useRef<HTMLDivElement>(null);

  const ask = (k: string) => {
    setMsgs((m) => [...m, { me: true, t: k }, { me: false, t: FAQ[k] }]);
    setTimeout(() => end.current?.scrollIntoView({ block: "end" }), 50);
  };

  return (
    <div className="chat-fab">
      {open && (
        <section className="chat" aria-label="Atendimento">
          <header><b>Atendimento Casa Raiz</b><span className="small">Respostas rápidas · humanos de seg a sáb</span></header>
          <div className="msgs" aria-live="polite">
            {msgs.map((m, i) => <div key={i} className={`msg ${m.me ? "me" : "bot"}`}>{m.t}</div>)}
            <div ref={end} />
          </div>
          <div className="quick">
            {Object.keys(FAQ).map((k) => <button key={k} onClick={() => ask(k)}>{k}</button>)}
            <a className="btn sm" href={whatsappLink()} target="_blank" rel="noreferrer">Falar no WhatsApp (demo)</a>
          </div>
        </section>
      )}
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? "Fechar atendimento" : "Abrir atendimento"}>
        <ChatIcon size={26} />
      </button>
    </div>
  );
}
