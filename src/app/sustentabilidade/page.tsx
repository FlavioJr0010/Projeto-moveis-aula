import type { Metadata } from "next";
import Link from "next/link";
import { LeafIcon, TruckIcon, ShieldIcon, HomeIcon } from "@/components/Icons";
export const metadata: Metadata = { title: "Sustentabilidade" };

const items = [
  { i: <LeafIcon />, t: "Madeira de origem conhecida", d: "Estruturas em madeira de reflorestamento e manejo, com rastreio de origem." },
  { i: <ShieldIcon />, t: "Painéis de baixa emissão", d: "MDF E1, que emite menos formaldeído e é melhor para o ar da sua casa." },
  { i: <TruckIcon />, t: "Entrega consolidada", d: "Agrupamos pedidos por região para rodar menos e emitir menos." },
  { i: <HomeIcon />, t: "Segunda vida (em estudo)", d: "Estudamos recolher o móvel antigo para doação ou reciclagem. Ainda não é um serviço disponível e não há data prevista." },
];

export default function Sust() {
  return (
    <div className="container section">
      <h1>Móveis que duram e respeitam o planeta</h1>
      <p className="muted" style={{ maxWidth: 640 }}>O móvel mais sustentável é o que você não precisa trocar daqui a dois anos. Por isso projetamos para durar e mostramos, em cada produto, de que ele é feito.</p>
      <h2 className="sr-only">Nossos compromissos</h2>
      <div className="grid cols-2 stack" style={{ margin: "32px 0" }}>
        {items.map((x) => <div key={x.t} className="card idea"><div className="ico">{x.i}</div><h3>{x.t}</h3><p className="muted" style={{ margin: 0 }}>{x.d}</p></div>)}
      </div>
      <div className="alert demo">Página de demonstração: os selos, percentuais e programas descritos são fictícios e precisam ser substituídos por dados reais e certificações verificáveis antes de qualquer uso comercial.</div>
      <p style={{ marginTop: 24 }}><Link className="btn" href="/produtos?eco=1">Ver produtos eco</Link></p>
    </div>
  );
}
