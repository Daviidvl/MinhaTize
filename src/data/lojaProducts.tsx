import { Syringe, Pill, Dumbbell, Sparkles, Scale } from 'lucide-react'

// ── Loja: categorias e produtos ──────────────────────────────────────────────
export interface LojaProduct {
  name: string; description?: string
  price?: string; originalPrice?: string
  discountPercent?: number; priceNote?: string
  url?: string; image?: string
}
export interface LojaGroup {
  label: string
  products: LojaProduct[]
}
export interface LojaCategory {
  title: string; sub: string; gradient: string; shadowColor: string; accent: string
  icon: (color: string, size: number) => React.ReactNode
  groups: LojaGroup[]
}

// Links de afiliado da Shopee (formato curto)
const shopee = (id: string) => `https://s.shopee.com.br/${id}`

export const LOJA_CATEGORIES: Record<string, LojaCategory> = {
  aplicacao: {
    title: 'Aplicação & Insumos',
    sub: 'Agulhas, seringas e descarte',
    gradient: 'var(--g-midnight)',
    shadowColor: 'rgba(var(--shadow-rgb),0.28)',
    accent: 'var(--cobalt)',
    icon: (color, size) => <Syringe size={size} strokeWidth={1.75} color={color} />,
    groups: [
      {
        label: 'Seringas',
        products: [
          { name: 'Seringa de Insulina 1ml Agulha Fixa 8mm (30G) — 100 un', description: 'Kit com 100 seringas SR de 1 ml, agulha fixa 8 mm x 0,30 mm.', price: 'R$ 156,75', url: shopee('7faCdwTU5h'), image: 'https://down-br.img.susercontent.com/file/br-11134207-820ma-mmgc343lrxmu4c@resize_w900_nl.webp' },
        ],
      },
    ],
  },
  suplementos: {
    title: 'Suplementos & Vitaminas',
    sub: 'Reposição e suporte nutricional',
    gradient: 'var(--g-midnight)',
    shadowColor: 'rgba(var(--shadow-rgb),0.28)',
    accent: 'var(--cobalt)',
    icon: (color, size) => <Pill size={size} strokeWidth={1.75} color={color} />,
    groups: [
      {
        label: 'Multivitamínicos',
        products: [
          { name: 'Multivitamínico 90 cápsulas — Dux Nutrition', description: 'Vitaminas e minerais em cápsula concentrada, sem sabor.', price: 'R$ 81,14', url: shopee('6fhfSvuTqV'), image: 'https://down-br.img.susercontent.com/file/sg-11134201-820oa-mnftejvoac5idd@resize_w900_nl.webp' },
          { name: 'Multivitamínico 120 cápsulas — Growth', description: 'Mais de 20 vitaminas e minerais por porção.', price: 'R$ 56,90', url: shopee('7ptcr7OQg8'), image: 'https://down-br.img.susercontent.com/file/br-11134207-820m3-msvvjsgevj0mc1@resize_w900_nl.webp' },
          { name: 'Multivitamínico de A a Z 120 tabletes — 3VS', description: '100% da IDR de vitaminas; 120 tabletes para 4 meses.', price: 'R$ 59,72', originalPrice: 'R$ 79,00', discountPercent: 24, url: shopee('W727g2wYm'), image: 'https://down-br.img.susercontent.com/file/br-11134207-820m1-mt4eqp5geznq34@resize_w900_nl.webp' },
        ],
      },
      {
        label: 'Vitamina D',
        products: [
          { name: 'Vitamina D3 2000 UI com TCM 75 cápsulas — 3VS', description: 'Vitamina D3 2.000 UI por cápsula, com TCM como veículo.', price: 'R$ 29,90', url: shopee('113IiyDbvN'), image: 'https://down-br.img.susercontent.com/file/br-11134207-820m3-mto8wmfx7e2r48@resize_w900_nl.webp' },
          { name: 'Vitamina D3 + K2 + Colágeno Tipo II 60 cápsulas', description: 'Vitamina D3 2.000 UI, K2 120 mcg e colágeno tipo II 40 mg.', price: 'R$ 69,90', url: shopee('3B7nIzQcbu'), image: 'https://down-br.img.susercontent.com/file/br-11134207-820lz-mtogx5p5613657@resize_w900_nl.webp' },
          { name: 'Vitamina D Addera 2000 UI 30 cápsulas', description: 'Vitamina D3 2.000 UI em cápsulas gelatinosas, sem açúcares.', price: 'R$ 66,23', url: shopee('8AWTGIMMJp'), image: 'https://down-br.img.susercontent.com/file/sg-11134201-825ab-ms4pnrwpfz0oaf@resize_w900_nl.webp' },
        ],
      },
      {
        label: 'Ômega 3',
        products: [
          { name: 'Ômega 3 Plus EPA 540 / DHA 360 75 cápsulas — 3VS', description: 'Ômega 3 em cápsulas com EPA 540 e DHA 360.', price: 'R$ 39,90', originalPrice: 'R$ 49,90', discountPercent: 20, url: shopee('6L4p54lYyL'), image: 'https://down-br.img.susercontent.com/file/br-11134207-7r98o-lqp2bvdzmh37f4@resize_w900_nl.webp' },
          { name: 'Ômega 3 Ultra 1100 75 softgels — Growth', description: 'Óleo de peixe em softgel, sem sabor.', price: 'R$ 82,90', priceNote: 'R$ 78,76 no Pix', url: shopee('3LRDVbDm73'), image: 'https://down-br.img.susercontent.com/file/sg-11134201-825a9-ms2tx9szk1kxe8@resize_w900_nl.webp' },
          { name: 'Ômega 3 EPA DHA 120 cápsulas 1g — Vitafor', description: 'Óleo de peixe de águas frias com EPA, DHA e vitamina E.', price: 'R$ 148,98', url: shopee('7faCfezSe6'), image: 'https://down-br.img.susercontent.com/file/sg-11134201-7qvda-lgnsnbb5u1dsb4@resize_w900_nl.webp' },
        ],
      },
      {
        label: 'Magnésio',
        products: [
          { name: 'Pro3 Magnésio 60 cápsulas — AlwaysFit', description: 'Magnésio dimalato, magnésio quelato e L-treonina.', price: 'R$ 49,90', originalPrice: 'R$ 69,90', discountPercent: 29, priceNote: 'até R$ 209,90, conforme a opção', url: shopee('8pmA3w9JoO'), image: 'https://down-br.img.susercontent.com/file/br-11134207-820mg-mqzh3e8qfbwmf1.webp' },
          { name: 'Mix Magnesium — Dimalato + Bisglicinato + Citrato', description: 'Combina três formas de magnésio em uma fórmula.', price: 'R$ 52,90', priceNote: 'até R$ 73,90, conforme a opção', url: shopee('113IjbbWUU'), image: 'https://down-br.img.susercontent.com/file/br-11134207-7r98o-mcw3mab35k4yeb@resize_w900_nl.webp' },
          { name: 'Cloreto de Magnésio 120 comprimidos — Growth', description: 'Cloreto de magnésio em comprimidos para o dia a dia.', price: 'R$ 74,90', url: shopee('7KxMHIlT1N'), image: 'https://down-br.img.susercontent.com/file/sg-11134201-825a2-ms61cwg6pamfba@resize_w900_nl.webp' },
        ],
      },
      {
        label: 'NAD+ & PQQ',
        products: [
          { name: 'NAD Nasal 30ml — Farmalabe', description: 'Fórmula manipulada de NAD para administração nasal.', price: 'R$ 58,00', originalPrice: 'R$ 75,00', discountPercent: 23, url: shopee('3LROXYPoxN'), image: 'https://down-br.img.susercontent.com/file/br-11134207-820m6-mr7hpsi9xgqv44@resize_w900_nl.webp' },
          { name: 'NAD+ 300mg 60 cápsulas', description: 'NAD+ 300 mg em cápsulas.', price: 'R$ 34,90', priceNote: 'até R$ 134,90, conforme a opção', url: shopee('5q8jWJKzgU'), image: 'https://down-br.img.susercontent.com/file/br-11134207-81z1k-mi4lxa8csr2982@resize_w900_nl.webp' },
          { name: 'PQQ 10mg 30 cápsulas — Biostévi', description: 'Pirroloquinolina quinona (PQQ) 10 mg por cápsula.', price: 'R$ 59,90', url: shopee('qk3ZIZW4j'), image: 'https://down-br.img.susercontent.com/file/br-11134207-7r98o-m7kvww1l8o5e83@resize_w900_nl.webp' },
        ],
      },
    ],
  },
  treino: {
    title: 'Treino & Bem-estar',
    sub: 'Proteína, creatina e massa magra',
    gradient: 'var(--g-midnight)',
    shadowColor: 'rgba(var(--shadow-rgb),0.28)',
    accent: 'var(--cobalt)',
    icon: (color, size) => <Dumbbell size={size} strokeWidth={1.75} color={color} />,
    groups: [
      {
        label: 'Whey Protein',
        products: [
          { name: 'Whey Concentrado Zero Lactose 1kg — Growth', description: 'Proteína concentrada do soro do leite em fórmula zero lactose.', price: 'R$ 151,91', url: shopee('9AP0R8uj63'), image: 'https://down-br.img.susercontent.com/file/sg-11134201-8259m-ms64mk0jvda8d4@resize_w900_nl.webp' },
          { name: '100% Whey Protein Refil 900g — FTW', description: 'Proteína concentrada do soro do leite (WPC) em refil de 900 g.', price: 'R$ 149,90', originalPrice: 'R$ 189,90', discountPercent: 21, url: shopee('4qG1HDjgJv'), image: 'https://down-br.img.susercontent.com/file/br-11134207-81z1k-mi9nfazk7x8h46@resize_w900_nl.webp' },
          { name: 'Whey 100% Concentrado 900g — Max Titanium', description: 'Proteína concentrada do soro do leite (WPC) em pote de 900 g.', price: 'R$ 169,09', url: shopee('80D335S0zX'), image: 'https://down-br.img.susercontent.com/file/br-11134207-820ma-mn0759l8qakh46@resize_w900_nl.webp' },
          { name: 'Whey Protein Isolado 1kg — Growth', description: 'Proteína isolada do soro do leite em pó, embalagem de 1 kg.', price: 'R$ 378,85', url: shopee('7faCeWWTIt'), image: 'https://down-br.img.susercontent.com/file/sg-11134201-8258f-ms606qdjc4clda@resize_w900_nl.webp' },
          { name: 'Whey 100% Pure Concentrado 900g — Probiótica', description: 'Proteína concentrada do soro do leite, de preparo instantâneo.', price: 'R$ 164,35', url: shopee('1Lg96yRgwC'), image: 'https://down-br.img.susercontent.com/file/br-11134207-820lh-mnyiyl4bc9363f@resize_w900_nl.webp' },
        ],
      },
      {
        label: 'Creatina',
        products: [
          { name: 'Creatina Micronizada Mesh 500 300g — FTW', description: 'Creatina monohidratada micronizada, cerca de 60 porções de 5 g.', price: 'R$ 99,90', url: shopee('9KiQdxclZF'), image: 'https://down-br.img.susercontent.com/file/br-11134207-81ztc-mj9xdvlpvthic7@resize_w900_nl.webp' },
          { name: 'Creatina Monohidratada 100% Pura 300g (100 doses)', description: 'Creatina monohidratada pura em pó, pote de 300 g.', price: 'R$ 31,90', url: shopee('5VVi4wv1KD'), image: 'https://down-br.img.susercontent.com/file/br-11134207-820lx-mts28b489gjmf0@resize_w900_nl.webp' },
          { name: 'Creatina Monohidratada — Growth', description: 'Creatina monohidratada pura em pó, sem sabor.', price: 'R$ 45,90', url: shopee('1gIzVvvbd9'), image: 'https://down-br.img.susercontent.com/file/sg-11134201-825a9-msdjsvxoyvi9ce.webp' },
          { name: 'Creatina Monohidratada 300g — Dux Nutrition', description: 'Creatina monohidratada sem sabor, pote de 300 g.', price: 'R$ 55,00', url: shopee('3LRDV3IurW'), image: 'https://down-br.img.susercontent.com/file/sg-11134201-81ztp-mn0ekspti96t6f@resize_w900_nl.webp' },
          { name: 'Creatina Pura 300g — Max Titanium', description: 'Creatina monohidratada pura, pote de 300 g.', price: 'R$ 46,20', originalPrice: 'R$ 180,00', discountPercent: 74, url: shopee('7Adw497ViT'), image: 'https://down-br.img.susercontent.com/file/62bdf1ae241f85a810dc8bd11bd6bf82.webp' },
          { name: 'Pure Creatine Saborizada 300g (85 doses)', description: 'Creatina monohidratada saborizada, pote de 300 g.', price: 'R$ 39,90', url: shopee('AKaxq3SQXV'), image: 'https://down-br.img.susercontent.com/file/sg-11134201-7rd4w-luza9lgwl5tkfc@resize_w900_nl.webp' },
        ],
      },
      {
        label: 'Massa magra & performance',
        products: [
          { name: 'ProGo 1,5g 120 cápsulas — Capim Limão', description: 'Peptídeos bioativos de colágeno; 120 cápsulas (30 doses).', price: 'R$ 245,06', priceNote: 'R$ 220,55 no Pix com cupom', url: shopee('2BFG5nXYuM'), image: 'https://down-br.img.susercontent.com/file/sg-11134201-824i7-mpicruzkk6wxd5.webp' },
          { name: 'LiveStrong PeptiStrong Frutas Tropicais 180g — Essential', description: 'Bebida em pó com proteína hidrolisada da fava, sem açúcar.', price: 'R$ 350,91', url: shopee('5AsrfREVh8'), image: 'https://down-br.img.susercontent.com/file/br-11134207-820li-mt6w03febsp1ef@resize_w900_nl.webp' },
          { name: 'Peptistrong 2,4g + Peptan 30 doses', description: 'Proteína vegetal Peptistrong combinada com Peptan.', price: 'R$ 225,72', url: shopee('W726u4b51'), image: 'https://down-br.img.susercontent.com/file/sg-11134201-7reo7-m2i3m06xky60a2@resize_w900_nl.webp' },
          { name: 'Peptistrong 2,4g + Peptan 150g Limão — Dhermativos', description: 'Suplemento em pó com Peptistrong e Peptan, 30 doses.', price: 'R$ 256,00', originalPrice: 'R$ 320,00', discountPercent: 20, priceNote: 'R$ 230,40 no Pix com cupom', url: shopee('70KVqueNEr'), image: 'https://down-br.img.susercontent.com/file/br-11134207-81z1k-mhqcht80w2de8f@resize_w900_nl.webp' },
          { name: 'Cindura 800mg 30 doses', description: 'Extratos vegetais para a rotina de treinos de força e resistência.', price: 'R$ 151,05', url: shopee('8KptRQ2oav'), image: 'https://down-br.img.susercontent.com/file/br-11134207-820le-mnzziyu0pix089@resize_w900_nl.webp' },
          { name: 'Cindura HMB + Turkesterone', description: 'Combinação de HMB e turkesterone para a rotina de treino.', price: 'R$ 126,35', url: shopee('7ptcqZ32A8'), image: 'https://down-br.img.susercontent.com/file/sg-11134201-822x2-mi96yswlmkug6c@resize_w900_nl.webp' },
        ],
      },
    ],
  },
  pele: {
    title: 'Pele & Corpo',
    sub: 'Cuidados durante o emagrecimento',
    gradient: 'var(--g-midnight)',
    shadowColor: 'rgba(var(--shadow-rgb),0.28)',
    accent: 'var(--cobalt)',
    icon: (color, size) => <Sparkles size={size} strokeWidth={1.75} color={color} />,
    groups: [
      {
        // Produtos de exemplo — ainda sem links reais
        label: 'Produtos selecionados',
        products: [
          { name: 'Creme Firmador Corporal', price: 'R$ 54,90', originalPrice: 'R$ 69,90', discountPercent: 21, priceNote: 'R$18,30 em 3x sem juros' },
          { name: 'Óleo Corporal Hidratante', price: 'R$ 44,90', originalPrice: 'R$ 54,90', discountPercent: 18, priceNote: 'R$22,45 em 2x sem juros' },
          { name: 'Escova de Massagem Anticelulite', price: 'R$ 34,90', originalPrice: 'R$ 44,90', discountPercent: 22, priceNote: 'R$17,45 em 2x sem juros' },
        ],
      },
    ],
  },
  monitoramento: {
    title: 'Monitoramento',
    sub: 'Acompanhe sua evolução',
    gradient: 'var(--g-midnight)',
    shadowColor: 'rgba(var(--shadow-rgb),0.28)',
    accent: 'var(--cobalt)',
    icon: (color, size) => <Scale size={size} strokeWidth={1.75} color={color} />,
    groups: [
      {
        label: 'Balanças',
        products: [
          { name: 'Balança Digital LED até 180kg USB — Gaabor', description: 'Visor LED, vidro temperado e recarga via USB.', price: 'R$ 59,00', originalPrice: 'R$ 199,00', discountPercent: 70, url: shopee('2LYgNjbD2L'), image: 'https://down-br.img.susercontent.com/file/br-11134207-820l9-mmh71uo4pa87a8@resize_w900_nl.webp' },
          { name: 'Balança de Bioimpedância Smart (25 análises)', description: 'Balança inteligente com Bluetooth e app.', price: 'R$ 169,78', url: shopee('6fhfXj2EnM'), image: 'https://down-br.img.susercontent.com/file/br-11134207-81ztc-mk0g9z6pcnpc43@resize_w900_nl.webp' },
          { name: 'Balança Digital de Vidro até 180kg', description: 'Vidro temperado e visor LCD iluminado.', price: 'R$ 34,99', url: shopee('3B7nNN4fpX'), image: 'https://down-br.img.susercontent.com/file/br-11134207-820l7-mr092rpnk5j87a@resize_w900_nl.webp' },
          { name: 'Balança Digital de Cozinha 10kg', description: 'Pesa alimentos de 1 g a 10 kg, em gramas ou onças.', price: 'R$ 20,99', url: shopee('30oNB7zQkZ'), image: 'https://down-br.img.susercontent.com/file/br-11134207-820lk-mrvplioja9zb38@resize_w900_nl.webp' },
        ],
      },
    ],
  },
}
