# Prompt: criar a apresentação do projeto "Casa Raiz"

> Cole este documento inteiro em uma IA (Claude, ChatGPT, Gamma, Canva Magic Design etc.) e peça:
> **"Crie a apresentação seguindo este briefing."**
> Tudo abaixo foi extraído do código real do projeto (nada inventado).

---

## 1. Papel e objetivo

Você é um designer de apresentações e storyteller de produto. Crie uma apresentação de **12 a 16 slides** sobre o projeto **Casa Raiz**, uma loja virtual de móveis feita como trabalho de aula (disciplina de desenvolvimento web/mobile).

- **Público:** professor(a) e colegas de turma (técnicos, mas não necessariamente conhecem o projeto).
- **Duração:** 8 a 12 minutos, incluindo uma demonstração ao vivo de ~3 minutos.
- **Tom:** profissional e claro, com orgulho dos diferenciais técnicos. Sem exageros de marketing.
- **Idioma:** português do Brasil, com acentuação correta.
- **Entregáveis:** (a) o roteiro slide a slide, (b) texto de cada slide (curto), (c) **notas do apresentador** para cada slide, (d) sugestão de visual/imagem para cada slide.

## 2. O que é o projeto (resumo em uma frase)

**Casa Raiz** é uma loja de móveis online, *mobile-first*, que ajuda a pessoa a **acertar na compra**: ela vê se o móvel *cabe*, se *combina* com o resto, se *passa na porta* e monta o ambiente num **planejador 2D/3D**, com preço final transparente e foco em acessibilidade e sustentabilidade.

**Problema que resolve:** comprar móvel online dá medo de errar: não cabe, não combina, não passa na porta, o preço final tem "susto" (frete + montagem).
**Proposta:** reduzir o arrependimento com ferramentas **explicáveis e verificáveis**, sem "IA mágica".

**Aviso honesto (deve aparecer na apresentação):** é uma **versão de demonstração**. Produtos, preços, avaliações e selos ecológicos são fictícios; imagens vêm do Unsplash; pagamento e frete são **simulados** (nenhuma cobrança real).

## 3. Números do projeto (use nos slides)

| Item | Valor |
|---|---|
| Produtos no catálogo | **35** (preços de R$ 149 a R$ 3.490) |
| Categorias | 9 (sofás, poltronas, camas, mesas, cadeiras, armários, estantes, balcões, complementos) |
| Públicos / contextos | 3: **residencial**, **home office**, **comercial** |
| Ambientes | 9 (sala, quarto, jantar, cozinha, home office, escritório, reunião, recepção, loja) |
| Kits de ambiente prontos | 5, com 7% a 12% de desconto |
| Páginas | 13 rotas + 5 endpoints de API |
| Testes automatizados | **86 testes** passando (Vitest) |
| Acessibilidade | Auditoria axe-core (WCAG 2.x A/AA): 0 violações no site; única exceção é o widget externo VLibras |
| Commits | 14 no histórico |
| Código | ~5.900 linhas de TypeScript/TSX |

## 4. Stack tecnológica

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Planejador 2D:** React Konva (canvas) + **Zustand** (estado)
- **Planejador 3D:** React Three Fiber + drei + three.js (carregado sob demanda para não pesar)
- **Banco de dados:** **Supabase** (Postgres com RLS): tabelas `orders` e `projects`
- **Deploy:** Vercel
- **Testes:** Vitest
- **Fontes:** Inter (corpo) e Fraunces (títulos). **Tema claro/escuro** automático.
- **Acessibilidade:** VLibras (tradutor de Libras do Governo Federal), skip link, landmarks, contraste revisado, `prefers-reduced-motion`

## 5. Mapa do site (estrutura de páginas)

| Rota | O que faz |
|---|---|
| `/` | Home: hero, 3 públicos, ferramentas, categorias, ambientes prontos, destaques, sustentabilidade, chat/WhatsApp |
| `/produtos` | Listagem filtrável (categoria, contexto, ambiente, perfil, preço, medidas do vão, eco) + busca com sugestões |
| `/produto/[slug]` | Detalhe: galeria, cores, preço (Pix/parcelas), montagem, frete por CEP, "Cabe no meu espaço", "Combina com", avaliações |
| `/ambientes` e `/ambientes/[slug]` | Kits prontos com desconto no conjunto |
| `/quiz` | Quiz de estilo (4 perguntas + 2 opcionais) com recomendação explicada |
| `/planejador` | **Planejador de ambientes 2D e 3D** (destaque do projeto) |
| `/carrinho` | Carrinho + análise de harmonia + alertas de compatibilidade |
| `/checkout` | Dados, endereço, entrega, pagamento (Pix, cartão, boleto simulados) |
| `/pedido` | Confirmação do pedido |
| `/sustentabilidade` | Compromissos ambientais (conteúdo demonstrativo) |
| `/api/produtos`, `/api/frete`, `/api/pedidos`, `/api/combina`, `/api/health` | Endpoints; o servidor **recalcula tudo** e ignora preço vindo do cliente |

Componentes globais em todas as páginas: Header com menu hambúrguer, Footer, **Chat de atendimento** (FAQ rápido + WhatsApp), **VLibras**.

## 6. Funcionalidades: o coração da apresentação

### 6.1 "Cabe no meu espaço"
Filtro por medida do vão (largura, profundidade, altura) e planta baixa em escala na página do produto.

### 6.2 "Combina ou não?" (`lib/match.ts`)
Enquanto o cliente compra, cada produto é avaliado contra o carrinho e recebe selo **Combina / Com ressalvas / Não combina bem**, com os motivos. Regras: repetição de peça de uso único (2 sofás), estilo, **harmonia de cores** (cálculo HSL: neutras, análogas, complementares, choque), complementaridade de ambiente, espaço e kits. O resultado muda conforme a cor escolhida.

### 6.3 Conecta Compatível (`lib/compat.ts`)
Regra técnica verificável: **altura do tampo da mesa − altura do assento** deve ficar entre **25 e 30 cm**. Se faltar dado, o sistema diz **"não foi possível verificar"** em vez de inventar. Sugere alternativas compatíveis.

### 6.4 Conecta Rota (`lib/access.ts`)
Triagem **opcional** de entrega: compara o menor lado da embalagem com a largura da passagem informada (margem mínima de 5 cm; considera escadas). Conservador por desenho: nunca "garante" passagem.

### 6.5 Quiz + recomendação por regras (`lib/advisor.ts`)
Perfil, ambiente, estilo, orçamento, pets/crianças e limpeza fácil. Cada sugestão traz **motivos, ressalvas e dados ausentes** e uma alternativa mais barata.

### 6.6 Planejador de ambientes (`lib/planner/*`, `components/planner/*`)
O diferencial técnico do projeto:
- Usuário define o cômodo (tipo, largura, profundidade, pé-direito) e **arrasta móveis em escala** (medidas em cm, grade de 50 cm, zoom por pinça no celular).
- **Alertas automáticos:** não cabe, ultrapassa paredes, colisão, altura maior que o pé-direito, estoque, **folga de uso** (espaço para puxar cadeira/abrir porta), **porta no caminho**, móvel alto cobrindo a janela.
- **Portas e janelas** nas paredes; móveis encostam na parede automaticamente.
- **Desfazer/refazer**, salvamento automático no navegador (localStorage).
- **Sugestões** ("o que completa este móvel"): papéis complementares + **score 0–100** (estilo 30, cor 25, material 15, tags 15, acabamento 5, ambiente 10), sempre com os motivos.
- **Visualização 3D:** modelo em caixas por categoria, câmera orbital e modo "dentro do ambiente" 360°, parede branca ou palha.
- **Compartilhar por link** via Supabase: quem recebe abre uma **cópia** (nunca altera o original); a chave de edição fica só no aparelho de quem criou.
- Totais do projeto (preço dos móveis posicionados).

### 6.7 Compra transparente
- **Preço final sem susto:** produto + montagem + frete antes do carrinho.
- Pix com **5% de desconto**, até **10x sem juros** (parcela mínima R$ 50), frete grátis acima de **R$ 1.999** (SP, Sul e Sudeste).
- Frete simulado por faixa de CEP, 3 opções (econômica, agendada, retirada em ponto parceiro).
- Checkout com cartão de teste (`4111 1111 1111 1111` aprova; `4000 0000 0000 0002` recusa). Dados de cartão nunca são gravados.

## 7. Decisões de engenharia (bons argumentos para a banca)

1. **Regras explicáveis em vez de "IA caixa-preta":** todo selo, score ou alerta mostra o porquê. Pesos ficam em um arquivo, fáceis de ajustar.
2. **Honestidade de dados** (`data/tech.ts`): campo ausente = "informação não disponível"; dados fictícios são rotulados como "demo". Ex.: a altura total de uma banqueta **não** vira altura do assento por aproximação.
3. **Servidor como fonte da verdade:** a API recalcula preço, frete e parcelas a partir do catálogo; o preço enviado pelo cliente é ignorado. Linhas de carrinho são validadas (slug, cor, quantidade, kit).
4. **Lógica pura e testável:** regras em `src/lib` sem dependência de interface, compartilhadas entre site e API; 86 testes cobrem planejador, recomendação, compatibilidade e acesso.
5. **Segurança no banco:** RLS permite só INSERT anônimo em `orders`; `projects` sem policies e acesso por RPCs (`publish_project`, `get_shared_project`); projeto salva só slug + posição (preço e medidas vêm do catálogo).
6. **Performance:** Konva e Three.js carregados sob demanda (`dynamic`, `ssr: false`), não pesam nas outras páginas.
7. **Acessibilidade como requisito:** tokens de contraste, skip link, `sr-only`, VLibras, auditoria axe em claro/escuro e desktop/mobile.
8. **Endpoint `/api/health`:** teste rápido de conexão com o banco (útil para checar antes da apresentação).

## 8. Estrutura de pastas

```
src/
  app/            páginas (App Router) e rotas de API
  components/     interface; components/planner/ = planejador
  data/           products.ts (catálogo, kits, listas) e tech.ts (dados técnicos)
  lib/            regras de preço, frete, busca, match, compat, access, advisor, recommend
  lib/planner/    geometria, validação, 3D, histórico, nuvem, serialização, testes
```

## 9. Evolução do projeto (linha do tempo, para um slide)

1. Loja base (catálogo, carrinho, checkout simulado, "cabe/combina").
2. Catálogo estendido para 3 públicos + Supabase (pedidos).
3. **Planejador 2D** (Konva + Zustand) + recomendações por score.
4. Fase 2: desfazer/refazer, encostar na parede, compartilhar por link, portas/janelas, folga de uso.
5. **Planejador 3D** (R3F).
6. Acessibilidade (auditoria axe, VLibras).
7. Auditoria "Conecta": Compatível, Rota, Sem Arrependimento (por regras) e correções de honestidade.

## 10. Limitações e próximos passos (slide final, com transparência)

- Dados fictícios; falta validar marca/região/frete comercialmente.
- Pagamento e frete são simulados (próximo: gateway e transportadora reais).
- Modelos 3D são caixas simples (próximo: modelos `.glb`, realidade aumentada).
- Planejador no celular pode ganhar *bottom sheet* real.
- "Conecta Decisão" (listas colaborativas) pendente: exige autenticação e RPC com limite de tentativas.
- Login e histórico de pedidos; fotos e certificações reais; programa "Segunda vida" (ainda em estudo, não é serviço disponível).

## 11. Roteiro sugerido de slides

| # | Slide | Conteúdo-chave |
|---|---|---|
| 1 | Capa | "Casa Raiz: móveis que cabem na sua casa e na sua vida" + nome da turma/autor |
| 2 | O problema | Medo de errar: não cabe, não combina, não passa na porta, preço com susto |
| 3 | A solução | Reduzir arrependimento com ferramentas explicáveis |
| 4 | Visão geral do site | Mapa de páginas + 3 públicos (casa, home office, empresa) |
| 5 | Jornada do cliente | Descobrir (quiz) → Escolher → Conferir (cabe/combina/passa) → Planejar → Comprar |
| 6 | Cabe e Combina | Filtro por vão, selo de combinação com motivos, harmonia de cores |
| 7 | Conecta Compatível e Rota | Regra 25–30 cm; triagem de porta; "não sei" é resposta válida |
| 8 | **Planejador 2D** | Arrastar em escala, alertas (colisão, folga, porta/janela), sugestões com score |
| 9 | **Planejador 3D e compartilhamento** | Visão orbital/360°, link que abre cópia |
| 10 | Compra transparente | Preço final, Pix 5%, 10x, frete por CEP, checkout simulado |
| 11 | Arquitetura e stack | Diagrama: Next.js → lib (regras puras) → API → Supabase |
| 12 | Qualidade | 86 testes, axe 0 violações, RLS, servidor recalcula preço |
| 13 | Acessibilidade e sustentabilidade | VLibras, contraste, tema escuro; madeira de reflorestamento (demo) |
| 14 | **Demonstração ao vivo** | Roteiro abaixo |
| 15 | Limitações e próximos passos | Seção 10 |
| 16 | Encerramento | Aprendizados + perguntas |

## 12. Roteiro da demonstração ao vivo (~3 min)

1. Home → clicar em **"Descobrir meu estilo"** e responder o quiz (mostrar motivos e ressalvas).
2. Abrir um produto → mostrar **"Cabe no meu espaço"** e **"Combina com este móvel"**.
3. Adicionar ao carrinho → mostrar selo de **harmonia** e alerta de **compatibilidade mesa + cadeira**.
4. Abrir **/planejador** → criar sala (ex.: 4 × 3 m), arrastar sofá e rack, provocar um **alerta** (colisão), usar **Sugestões**, alternar para **3D**.
5. Se houver tempo: **Compartilhar link** e checkout com cartão de teste.
6. Plano B se a internet falhar: `/api/health` indica o estado do banco; o site funciona sem Supabase (só pedidos e compartilhamento ficam indisponíveis).

## 13. Diretrizes visuais

- **Paleta (do site):** verde-floresta `#2f5d46` (marca), terracota `#b9532c` (destaque), fundo creme `#faf7f2`, verde-claro `#eef2ea`, texto `#1d2a24`. Versão escura: fundo `#111613`, marca `#5fa583`, destaque `#e08a62`.
- **Tipografia:** Fraunces (títulos, serifada e acolhedora) + Inter (texto).
- **Estilo:** limpo, orgânico, muito espaço em branco, ícones de linha, cantos arredondados (14 px).
- **Imagens:** capturas de tela reais do site (home, produto, planejador 2D/3D, carrinho com selo de harmonia) e fotos de ambientes claros com plantas.
- **Diagramas sugeridos:** (a) fluxo da jornada; (b) arquitetura em camadas; (c) pesos do score de recomendação (gráfico de barras/rosca: 30/25/15/15/5/10); (d) linha do tempo da evolução.
- **Regras de design:** máx. 6 linhas por slide, fonte mínima 24 pt, um conceito por slide, contraste AA, nada de blocos de texto longos (detalhes vão nas notas do apresentador).

## 14. Capturas de tela a tirar antes (checklist)

- [ ] Home (hero + três públicos)
- [ ] Página de produto com "Combina com" e "Cabe no meu espaço"
- [ ] Carrinho com selo de harmonia e alerta de compatibilidade
- [ ] Planejador 2D com alertas visíveis e zona de folga tracejada
- [ ] Planejador 3D (órbita e dentro do ambiente)
- [ ] Quiz com resultado e motivos
- [ ] Terminal com `npm test` (86 passando)
- [ ] Relatório do axe-core (0 violações)

## 15. Regras para a IA que gerar a apresentação

1. **Não invente** números, funcionalidades ou tecnologias além das descritas aqui.
2. Mantenha o aviso de **demonstração/dados fictícios** visível (rodapé de um slide ou slide de limitações).
3. Destaque o **planejador 2D/3D** e as **regras explicáveis**: são os diferenciais.
4. Para cada slide, entregue: **título**, **até 5 tópicos curtos**, **notas do apresentador (2 a 4 frases)** e **sugestão visual**.
5. Ao final, ofereça: (a) versão de 5 minutos (7 slides) e (b) lista de 5 perguntas prováveis da banca com respostas curtas.

### Perguntas prováveis da banca (para já preparar)

1. *Por que regras e não IA?* Transparência, testabilidade, custo zero e nada de "alucinação" em decisão de compra.
2. *Como evita fraude de preço?* O servidor recalcula tudo a partir do catálogo e valida cada linha do carrinho.
3. *O que acontece sem internet/banco?* O catálogo e o planejador funcionam localmente; só pedidos e links compartilhados dependem do Supabase.
4. *Como garantem que não quebra?* 86 testes automatizados e `typecheck` em TypeScript.
5. *O que falta para virar produto real?* Dados reais, gateway, transportadora, autenticação, modelos 3D e validação comercial.
