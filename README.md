# Projeto-moveis-aula — Casa Raiz

Loja virtual de móveis feita com **Next.js 16 (App Router) + React 19 + TypeScript**, desenvolvida **mobile-first**.
Foco: primeira casa, família e apartamento pequeno, com atendimento e sustentabilidade como diferenciais.

> **Versão de demonstração.** Produtos, preços, avaliações e selos eco são fictícios; as imagens vêm do Unsplash;
> pagamento e frete são **simulados** (nenhuma cobrança real).

## Como rodar

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
npm run typecheck
```

## O que já existe

- **Cabe no meu espaço**: filtro por medida do vão e planta baixa em escala na página do produto (com checagem de porta/elevador)
- **Quiz de estilo** e **ambientes completos** com desconto no conjunto
- **Preço final transparente**: produto + montagem + frete antes do carrinho
- Carrinho (salvo no navegador), checkout com Pix, cartão e boleto simulados, confirmação do pedido
- Chat de atendimento com respostas rápidas e WhatsApp (número de exemplo)
- Busca com sugestões, listagem filtrável, tema claro/escuro, acessibilidade básica

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `src/app` | Páginas e API (`/api/produtos`, `/api/frete`, `/api/pedidos`) |
| `src/components` | Componentes de interface |
| `src/data/products.ts` | Catálogo e ambientes (dados de exemplo) |
| `src/lib` | Regras de preço, frete, busca e checkout (usadas pelo site **e** pela API) |

O servidor recalcula todos os valores a partir do catálogo: o preço enviado pelo cliente é ignorado.
Cartão de teste aprovado: `4111 1111 1111 1111`; recusado: `4000 0000 0000 0002`.

## Próximos passos sugeridos

Banco de dados (ex.: Supabase) no lugar de `products.ts`, gateway de pagamento real, transportadora real,
login/histórico de pedidos, fotos e certificações reais, e visualização em realidade aumentada (exige modelos 3D).
