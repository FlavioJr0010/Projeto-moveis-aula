import Link from "next/link";
import { categories } from "@/data/products";

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="cols">
          <div>
            <h4>🌿 CasaRaiz</h4>
            <p>Móveis próprios, feitos para o primeiro lar, para a família e para o apartamento pequeno. Atendimento de gente de verdade.</p>
          </div>
          <div><h4>Comprar</h4><ul>{categories.map((c) => <li key={c.slug}><Link href={`/produtos?categoria=${c.slug}`}>{c.label}</Link></li>)}</ul></div>
          <div><h4>Ideias</h4><ul>
            <li><Link href="/produtos">Cabe no meu espaço</Link></li>
            <li><Link href="/ambientes">Ambientes completos</Link></li>
            <li><Link href="/quiz">Quiz de estilo</Link></li>
            <li><Link href="/sustentabilidade">Sustentabilidade</Link></li>
          </ul></div>
          <div><h4>Atendimento</h4><ul>
            <li>WhatsApp e chat (demo)</li><li>Seg a sáb, das 8h às 20h</li><li>Troca e devolução em até 30 dias (demo)</li>
          </ul></div>
        </div>
        <p className="legal">
          Projeto de demonstração: produtos, preços, avaliações e certificações são fictícios; as imagens vêm do Unsplash; pagamento e frete são simulados e nenhuma cobrança é feita.
        </p>
      </div>
    </footer>
  );
}
