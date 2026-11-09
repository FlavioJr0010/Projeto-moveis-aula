export type Category = "sofas" | "poltronas" | "camas" | "mesas" | "armarios" | "complementos";
export type Ambiente = "sala" | "quarto" | "jantar";
export type Perfil = "primeira-casa" | "familia" | "apartamento-pequeno";

export interface Product {
  slug: string;
  name: string;
  category: Category;
  ambientes: Ambiente[];
  perfis: Perfil[];
  style: "moderno" | "classico" | "natural";
  short: string;
  description: string;
  listPrice: number; // preço "de" (riscado)
  price: number; // preço atual no cartão/boleto
  dims: { w: number; h: number; d: number }; // cm
  weightKg: number;
  material: string;
  colors: { name: string; hex: string }[];
  images: string[]; // ids Unsplash
  assemblyPrice: number; // 0 = não precisa de montagem
  rating: number;
  reviews: number;
  stock: number;
  eco: { cert: string; recycledPct: number; note: string };
}

export const img = (id: string, w = 800, h?: number) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}${h ? `&h=${h}` : ""}&q=75`;

const eco = (cert: string, recycledPct: number, note: string) => ({ cert, recycledPct, note });

export const products: Product[] = [
  {
    slug: "sofa-mata-3-lugares",
    name: "Sofá Mata 3 lugares em veludo",
    category: "sofas",
    ambientes: ["sala"],
    perfis: ["familia"],
    style: "moderno",
    short: "Veludo verde-floresta, pés em madeira e espuma D-33.",
    description:
      "Sofá de três lugares com assento firme e encosto macio, pensado para famílias. Tecido em veludo de fácil limpeza, estrutura em madeira de reflorestamento e pés palito em madeira maciça.",
    listPrice: 3490, price: 2890,
    dims: { w: 210, h: 85, d: 90 }, weightKg: 48,
    material: "Madeira de reflorestamento, veludo, espuma D-33",
    colors: [{ name: "Verde Mata", hex: "#1f5a45" }, { name: "Cinza Pedra", hex: "#8a8f94" }, { name: "Areia", hex: "#d8c6a8" }],
    images: ["1555041469-a586c61ea9bc"],
    assemblyPrice: 0, rating: 4.8, reviews: 214, stock: 18,
    eco: eco("Madeira certificada (demo)", 35, "Estrutura em madeira de reflorestamento e embalagem 100% reciclável."),
  },
  {
    slug: "sofa-nuvem-2-lugares",
    name: "Sofá Nuvem 2 lugares compacto",
    category: "sofas",
    ambientes: ["sala"],
    perfis: ["apartamento-pequeno", "primeira-casa"],
    style: "moderno",
    short: "Só 160 cm de largura: cabe em sala pequena sem perder conforto.",
    description:
      "Sofá compacto com capitonê leve, ideal para apartamentos. Chega desmontado (pés e encosto) para passar em elevadores e escadas estreitas.",
    listPrice: 2190, price: 1790,
    dims: { w: 160, h: 85, d: 85 }, weightKg: 34,
    material: "Madeira de reflorestamento, linho, espuma D-28",
    colors: [{ name: "Cinza Nuvem", hex: "#a9afb8" }, { name: "Grafite", hex: "#4a4f57" }],
    images: ["1493663284031-b7e3aefcae8e"],
    assemblyPrice: 90, rating: 4.7, reviews: 168, stock: 25,
    eco: eco("Madeira certificada (demo)", 30, "Entrega desmontada reduz o volume transportado em 40%."),
  },
  {
    slug: "sofa-brisa-2-lugares",
    name: "Sofá Brisa 2 lugares azul",
    category: "sofas",
    ambientes: ["sala"],
    perfis: ["primeira-casa", "apartamento-pequeno"],
    style: "moderno",
    short: "Azul-claro, 150 cm, ótimo custo-benefício para a primeira casa.",
    description: "Sofá de dois lugares com botões no encosto e braços baixos. Leve de mover e fácil de limpar.",
    listPrice: 1790, price: 1490,
    dims: { w: 150, h: 82, d: 80 }, weightKg: 28,
    material: "Madeira de reflorestamento, tecido sintético reciclado",
    colors: [{ name: "Azul Brisa", hex: "#9fb3cc" }, { name: "Verde Sálvia", hex: "#a8b5a0" }],
    images: ["1484101403633-562f891dc89a"],
    assemblyPrice: 90, rating: 4.6, reviews: 97, stock: 30,
    eco: eco("Tecido de garrafas PET (demo)", 60, "Tecido produzido com fio de PET reciclado."),
  },
  {
    slug: "poltrona-sol",
    name: "Poltrona Sol amarela",
    category: "poltronas",
    ambientes: ["sala", "quarto"],
    perfis: ["primeira-casa", "familia"],
    style: "moderno",
    short: "Um toque de cor com pés palito em madeira.",
    description: "Poltrona com encosto alto e assento confortável para leitura. Pés em madeira maciça com acabamento natural.",
    listPrice: 890, price: 690,
    dims: { w: 75, h: 90, d: 78 }, weightKg: 12,
    material: "Madeira maciça, tecido, espuma D-26",
    colors: [{ name: "Mostarda", hex: "#d9a21b" }, { name: "Terracota", hex: "#b8593b" }, { name: "Verde Oliva", hex: "#7c8148" }],
    images: ["1586023492125-27b2c045efd7"],
    assemblyPrice: 0, rating: 4.9, reviews: 342, stock: 40,
    eco: eco("Madeira certificada (demo)", 20, "Embalagem de papelão reciclado, sem isopor."),
  },
  {
    slug: "poltrona-pluma",
    name: "Poltrona Pluma capitonê",
    category: "poltronas",
    ambientes: ["sala", "quarto"],
    perfis: ["apartamento-pequeno"],
    style: "classico",
    short: "Só 62 cm de largura, perfeita para cantinhos.",
    description: "Poltrona compacta com capitonê e pés torneados. Funciona como cadeira de apoio no quarto ou na sala.",
    listPrice: 620, price: 520,
    dims: { w: 62, h: 80, d: 60 }, weightKg: 8,
    material: "Madeira de reflorestamento, tecido bouclé",
    colors: [{ name: "Off-white", hex: "#efe9dd" }, { name: "Rosé", hex: "#d9b7ab" }],
    images: ["1567538096630-e0c55bd6374c"],
    assemblyPrice: 0, rating: 4.5, reviews: 76, stock: 22,
    eco: eco("Madeira certificada (demo)", 15, "Sem cola à base de solventes."),
  },
  {
    slug: "criado-mudo-ipe",
    name: "Criado-mudo Ipê 2 gavetas",
    category: "complementos",
    ambientes: ["quarto"],
    perfis: ["primeira-casa", "familia", "apartamento-pequeno"],
    style: "natural",
    short: "Madeira clara, gavetas com corrediça soft.",
    description: "Criado-mudo com duas gavetas e pés inclinados. Compacto para quartos pequenos.",
    listPrice: 490, price: 390,
    dims: { w: 50, h: 55, d: 40 }, weightKg: 11,
    material: "MDF de reflorestamento E1, pés em madeira maciça",
    colors: [{ name: "Carvalho Claro", hex: "#d7b98e" }, { name: "Branco", hex: "#f2f0ea" }],
    images: ["1550226891-ef816aed4a98"],
    assemblyPrice: 60, rating: 4.7, reviews: 188, stock: 60,
    eco: eco("MDF baixa emissão E1 (demo)", 45, "Painéis com baixa emissão de formaldeído."),
  },
  {
    slug: "banqueta-carvalho",
    name: "Banqueta Carvalho alta",
    category: "complementos",
    ambientes: ["jantar"],
    perfis: ["primeira-casa", "apartamento-pequeno"],
    style: "natural",
    short: "Madeira maciça, 65 cm, empilhável.",
    description: "Banqueta robusta para bancada ou balcão. Assento com furo para facilitar o transporte.",
    listPrice: 290, price: 240,
    dims: { w: 38, h: 65, d: 38 }, weightKg: 4,
    material: "Madeira maciça de carvalho de manejo",
    colors: [{ name: "Natural", hex: "#d9c3a0" }],
    images: ["1503602642458-232111445657"],
    assemblyPrice: 0, rating: 4.6, reviews: 120, stock: 80,
    eco: eco("Manejo florestal (demo)", 0, "Madeira de manejo com rastreio de origem."),
  },
  {
    slug: "cama-queen-aurora",
    name: "Cama Queen Aurora com cabeceira capitonê",
    category: "camas",
    ambientes: ["quarto"],
    perfis: ["familia"],
    style: "classico",
    short: "Cabeceira estofada, base com baú opcional.",
    description: "Cama queen com cabeceira alta capitonê e base reforçada para colchões de até 40 cm.",
    listPrice: 2990, price: 2390,
    dims: { w: 168, h: 120, d: 208 }, weightKg: 62,
    material: "Madeira de reflorestamento, linho, espuma D-23",
    colors: [{ name: "Bege", hex: "#cdbfa8" }, { name: "Cinza", hex: "#9a9ea3" }],
    images: ["1505693416388-ac5ce068fe85"],
    assemblyPrice: 190, rating: 4.8, reviews: 256, stock: 12,
    eco: eco("Madeira certificada (demo)", 25, "Peças numeradas para facilitar a montagem e evitar desperdício."),
  },
  {
    slug: "cama-casal-savana",
    name: "Cama de casal Savana",
    category: "camas",
    ambientes: ["quarto"],
    perfis: ["primeira-casa"],
    style: "moderno",
    short: "Linhas retas, base baixa e cabeceira lisa.",
    description: "Cama de casal com acabamento em madeira clara. Cabe em quartos de 9 m².",
    listPrice: 1890, price: 1590,
    dims: { w: 150, h: 100, d: 205 }, weightKg: 44,
    material: "Madeira de reflorestamento e MDF E1",
    colors: [{ name: "Carvalho", hex: "#cfae7e" }, { name: "Nogueira", hex: "#6e4b33" }],
    images: ["1540518614846-7eded433c457"],
    assemblyPrice: 160, rating: 4.6, reviews: 143, stock: 20,
    eco: eco("MDF baixa emissão E1 (demo)", 40, "Resíduo de produção reaproveitado como biomassa."),
  },
  {
    slug: "cama-queen-linho-curvo",
    name: "Cama Queen Linho com cabeceira canelada",
    category: "camas",
    ambientes: ["quarto"],
    perfis: ["familia"],
    style: "moderno",
    short: "Cabeceira canelada em linho, acabamento premium.",
    description: "Cama queen com cabeceira canelada e pés metálicos dourados. Visual de hotel boutique.",
    listPrice: 3290, price: 2690,
    dims: { w: 170, h: 115, d: 210 }, weightKg: 58,
    material: "Madeira de reflorestamento, linho, metal",
    colors: [{ name: "Cru", hex: "#e6ddca" }],
    images: ["1616594039964-ae9021a400a0"],
    assemblyPrice: 190, rating: 4.7, reviews: 61, stock: 8,
    eco: eco("Madeira certificada (demo)", 20, "Embalagem reciclável e sem plástico bolha."),
  },
  {
    slug: "mesa-jantar-ipe-6",
    name: "Mesa de jantar Ipê 6 lugares",
    category: "mesas",
    ambientes: ["jantar"],
    perfis: ["familia"],
    style: "natural",
    short: "Tampo em madeira maciça, 180 cm.",
    description: "Mesa retangular para seis pessoas com tampo de madeira maciça e acabamento fosco resistente a manchas.",
    listPrice: 2490, price: 1990,
    dims: { w: 180, h: 76, d: 90 }, weightKg: 52,
    material: "Madeira maciça de manejo, verniz à base d'água",
    colors: [{ name: "Natural", hex: "#c9a574" }, { name: "Imbuia", hex: "#5b3e2b" }],
    images: ["1617806118233-18e1de247200"],
    assemblyPrice: 120, rating: 4.9, reviews: 305, stock: 10,
    eco: eco("Manejo florestal (demo)", 0, "Verniz à base d'água, sem solventes."),
  },
  {
    slug: "mesa-redonda-lua",
    name: "Mesa redonda Lua 4 lugares",
    category: "mesas",
    ambientes: ["jantar"],
    perfis: ["apartamento-pequeno", "primeira-casa"],
    style: "natural",
    short: "110 cm de diâmetro, sem quinas, ótima para espaços pequenos.",
    description: "Mesa redonda com pé central e tampo claro. Aproveita melhor a circulação que mesas retangulares.",
    listPrice: 1190, price: 890,
    dims: { w: 110, h: 75, d: 110 }, weightKg: 24,
    material: "MDF E1 e madeira maciça",
    colors: [{ name: "Branco/Natural", hex: "#ece4d3" }],
    images: ["1519710164239-da123dc03ef4"],
    assemblyPrice: 90, rating: 4.7, reviews: 211, stock: 35,
    eco: eco("MDF baixa emissão E1 (demo)", 45, "Sobras de produção reaproveitadas."),
  },
  {
    slug: "rack-suspenso-prateleira",
    name: "Rack suspenso com nichos",
    category: "armarios",
    ambientes: ["sala"],
    perfis: ["apartamento-pequeno", "primeira-casa"],
    style: "moderno",
    short: "Suspenso: libera o chão e deixa a sala mais ampla.",
    description: "Rack com nichos abertos e caixas em branco e madeira. Suporta TV de até 55\".",
    listPrice: 990, price: 790,
    dims: { w: 180, h: 40, d: 35 }, weightKg: 26,
    material: "MDF E1 revestido",
    colors: [{ name: "Branco/Carvalho", hex: "#e5d8bf" }],
    images: ["1594026112284-02bb6f3352fe"],
    assemblyPrice: 120, rating: 4.5, reviews: 132, stock: 28,
    eco: eco("MDF baixa emissão E1 (demo)", 50, "Painéis com 50% de madeira reaproveitada."),
  },
  {
    slug: "armario-nichos-carvalho",
    name: "Armário alto com nichos",
    category: "armarios",
    ambientes: ["sala", "quarto"],
    perfis: ["familia", "apartamento-pequeno"],
    style: "natural",
    short: "Muito espaço em pouca largura: 90 cm.",
    description: "Armário vertical com nichos e portas. Ótimo para organizar casa pequena sem ocupar chão.",
    listPrice: 1590, price: 1290,
    dims: { w: 90, h: 200, d: 40 }, weightKg: 45,
    material: "MDF E1 com acabamento amadeirado",
    colors: [{ name: "Carvalho", hex: "#c9ab82" }, { name: "Branco", hex: "#f1efe9" }],
    images: ["1595428774223-ef52624120d2"],
    assemblyPrice: 150, rating: 4.6, reviews: 89, stock: 15,
    eco: eco("MDF baixa emissão E1 (demo)", 40, "Fixação sem cola, facilita reciclagem."),
  },
  {
    slug: "aparador-dourado",
    name: "Aparador Ouro 150 cm",
    category: "armarios",
    ambientes: ["sala", "jantar"],
    perfis: ["familia", "primeira-casa"],
    style: "classico",
    short: "Portas ripadas e detalhes dourados.",
    description: "Aparador com duas portas e prateleira interna. Combina com mesa de jantar e hall de entrada.",
    listPrice: 1690, price: 1390,
    dims: { w: 150, h: 80, d: 40 }, weightKg: 36,
    material: "MDF E1, metal pintado",
    colors: [{ name: "Ouro/Nogueira", hex: "#b88a3b" }],
    images: ["1618220179428-22790b461013"],
    assemblyPrice: 120, rating: 4.7, reviews: 74, stock: 14,
    eco: eco("MDF baixa emissão E1 (demo)", 40, "Metal reciclado em 30% da composição."),
  },
];

export const bySlug = (slug: string) => products.find((p) => p.slug === slug);

export const categories: { slug: Category; label: string }[] = [
  { slug: "sofas", label: "Sofás" },
  { slug: "poltronas", label: "Poltronas" },
  { slug: "camas", label: "Camas" },
  { slug: "mesas", label: "Mesas" },
  { slug: "armarios", label: "Racks e armários" },
  { slug: "complementos", label: "Complementos" },
];

export const ambientesList: { slug: Ambiente; label: string }[] = [
  { slug: "sala", label: "Sala de estar" },
  { slug: "quarto", label: "Quarto" },
  { slug: "jantar", label: "Sala de jantar" },
];

export const perfisList: { slug: Perfil; label: string }[] = [
  { slug: "primeira-casa", label: "Primeira casa" },
  { slug: "familia", label: "Família" },
  { slug: "apartamento-pequeno", label: "Apartamento pequeno" },
];

export interface Bundle {
  slug: string;
  name: string;
  perfil: Perfil;
  ambiente: Ambiente | "casa";
  description: string;
  image: string;
  discountPct: number;
  items: { slug: string; qty: number; color?: string }[];
}

export const bundles: Bundle[] = [
  {
    slug: "sala-compacta",
    name: "Sala compacta",
    perfil: "apartamento-pequeno",
    ambiente: "sala",
    description: "Sofá de 160 cm, poltrona de canto e rack suspenso: sala completa em menos de 5 m de parede.",
    image: "1522708323590-d24dbb6b0267",
    discountPct: 8,
    items: [{ slug: "sofa-nuvem-2-lugares", qty: 1 }, { slug: "poltrona-pluma", qty: 1 }, { slug: "rack-suspenso-prateleira", qty: 1 }],
  },
  {
    slug: "sala-familia",
    name: "Sala da família",
    perfil: "familia",
    ambiente: "sala",
    description: "Sofá grande de veludo, poltrona de leitura e aparador para receber bem.",
    image: "1556228453-efd6c1ff04f6",
    discountPct: 8,
    items: [{ slug: "sofa-mata-3-lugares", qty: 1 }, { slug: "poltrona-sol", qty: 1 }, { slug: "aparador-dourado", qty: 1 }],
  },
  {
    slug: "quarto-casal",
    name: "Quarto de casal",
    perfil: "familia",
    ambiente: "quarto",
    description: "Cama queen, dois criados-mudos e poltrona de apoio para um quarto de hotel em casa.",
    image: "1615874959474-d609969a20ed",
    discountPct: 10,
    items: [{ slug: "cama-queen-aurora", qty: 1 }, { slug: "criado-mudo-ipe", qty: 2 }, { slug: "poltrona-pluma", qty: 1 }],
  },
  {
    slug: "jantar-aconchego",
    name: "Jantar aconchego",
    perfil: "familia",
    ambiente: "jantar",
    description: "Mesa de seis lugares e aparador para reunir a família toda.",
    image: "1617806118233-18e1de247200",
    discountPct: 7,
    items: [{ slug: "mesa-jantar-ipe-6", qty: 1 }, { slug: "aparador-dourado", qty: 1 }, { slug: "banqueta-carvalho", qty: 2 }],
  },
  {
    slug: "primeira-casa",
    name: "Kit primeira casa",
    perfil: "primeira-casa",
    ambiente: "casa",
    description: "O essencial para morar: sofá, mesa redonda com banquetas, cama de casal e criado-mudo.",
    image: "1600585154340-be6161a56a0c",
    discountPct: 12,
    items: [
      { slug: "sofa-brisa-2-lugares", qty: 1 }, { slug: "mesa-redonda-lua", qty: 1 }, { slug: "banqueta-carvalho", qty: 2 },
      { slug: "cama-casal-savana", qty: 1 }, { slug: "criado-mudo-ipe", qty: 1 },
    ],
  },
];

export const bundleBySlug = (slug: string) => bundles.find((b) => b.slug === slug);
