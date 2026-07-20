import {
  Sun, Droplets, Utensils, Moon, Fish, Zap, Package, Leaf, type LucideIcon,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────
export type IconComp = LucideIcon
export interface MealOption { label: string; items: string[]; protein?: string; note?: string }
export interface MealSection {
  id: string; label: string; Icon: IconComp; color: string
  required: boolean; kcalShare: number; options: MealOption[]; note?: string
}
export interface InfoSection {
  id: string; Icon: IconComp; color: string; label: string; items: string[]; note?: string
}
export type DietSex = 'F' | 'M'

// ── Kcal + shares ─────────────────────────────────────────────────────────────
export const DIET_KCAL: Record<DietSex, number>    = { F: 1600, M: 2000 }
export const MEAL_SHARES: Record<string, number>   = {
  'cafe': 0.25, 'lanche-m': 0.10, 'almoco': 0.30,
  'lanche-t': 0.10, 'jantar': 0.20, 'ceia': 0.05,
}
export const MEAL_PROTEIN: Record<DietSex, Record<string, number>> = {
  F: { 'cafe': 28, 'lanche-m': 20, 'almoco': 40, 'lanche-t': 22, 'jantar': 35, 'ceia': 20 },
  M: { 'cafe': 33, 'lanche-m': 20, 'almoco': 45, 'lanche-t': 22, 'jantar': 43, 'ceia': 20 },
}

// Cores de cada refeição — mesmas do Dashboard (MEAL_SLOTS)
export const MEAL_COLOR: Record<string, string> = {
  'cafe': '#D97706', 'lanche-m': '#F59E0B', 'almoco': '#059669',
  'lanche-t': '#0891B2', 'jantar': '#7C3AED', 'ceia': '#1E40AF',
}
export const MEAL_ICON: Record<string, IconComp> = {
  'cafe': Sun, 'lanche-m': Droplets, 'almoco': Utensils,
  'lanche-t': Droplets, 'jantar': Moon, 'ceia': Moon,
}

// ── Dieta Feminina ────────────────────────────────────────────────────────────
export const DIET_F: MealSection[] = [
  {
    id: 'cafe', label: 'Café da Manhã', Icon: Sun, color: '#D97706', required: true, kcalShare: 0.25,
    options: [
      { label: 'Opção 1', protein: '25–30 g', items: ['1 pão francês', '2 ovos inteiros', '30 g de queijo branco', '1 fruta — mamão (120 g), banana (50 g), kiwi (90 g) ou melão'] },
      { label: 'Opção 2', protein: '28–30 g', items: ['1 pão francês', '1 ovo inteiro + 3 claras', '20 g de queijo branco ou requeijão light', '1 fruta'] },
      { label: 'Opção 3', protein: '25 g',    items: ['2 fatias de pão integral', '2 ovos inteiros', '1 fruta'] },
      { label: 'Opção 4 — Vitamina', protein: '30–35 g', items: ['200 ml de leite desnatado', '1 scoop de whey', '20 g de aveia', '1 fruta'] },
      { label: 'Opção 5', protein: '35–40 g', items: ['170 g de iogurte grego natural', '1 scoop de whey', 'Morangos ou banana'] },
    ],
  },
  {
    id: 'lanche-m', label: 'Lanche da Manhã', Icon: Droplets, color: '#F59E0B', required: false, kcalShare: 0.10,
    note: 'Opcional — complementa proteína do dia',
    options: [
      { label: 'Opção 1', items: ['1 scoop de whey com água'] },
      { label: 'Opção 2', items: ['1 iogurte proteico'] },
      { label: 'Opção 3', items: ['2 ovos cozidos'] },
      { label: 'Opção 4', protein: '15–25 g', items: ['1 fruta', '50 g de cottage ou ricota'] },
    ],
  },
  {
    id: 'almoco', label: 'Almoço', Icon: Utensils, color: '#059669', required: true, kcalShare: 0.30,
    options: [
      { label: 'Opção 1', protein: '35–45 g', items: ['Arroz branco cozido (90–120 g)', 'Feijão (70–100 g)', 'Frango grelhado (120–150 g)', 'Legumes cozidos', 'Pequena porção de salada'] },
      { label: 'Opção 2', items: ['Arroz branco (100–120 g)', 'Frango (120–150 g)', 'Legumes'], note: 'Chocolate ao leite (15 g) eventualmente, apenas para aderência' },
      { label: 'Opção 3', items: ['Baião de dois (100–130 g)', 'Frango ou carne magra (120–150 g)', 'Legumes'] },
      { label: 'Opção 4', items: ['Macarrão cozido (100–120 g)', 'Sardinha ou peixe (130–150 g)', 'Legumes'] },
      { label: 'Opção 5', items: ['Arroz branco (90–120 g)', 'Feijão (70–100 g)', 'Carne magra (100–120 g)', 'Legumes'] },
    ],
  },
  {
    id: 'lanche-t', label: 'Lanche da Tarde', Icon: Droplets, color: '#0891B2', required: false, kcalShare: 0.10,
    note: 'Opcional — complementa proteína do dia',
    options: [
      { label: 'Opção 1', items: ['1 scoop de whey', '1 fruta'] },
      { label: 'Opção 2 — Sanduíche', items: ['2 fatias de pão integral', '100 g de frango desfiado'] },
      { label: 'Opção 3', items: ['Iogurte proteico', '15 g de aveia'] },
      { label: 'Opção 4', items: ['2 ovos', '1 fruta'] },
      { label: 'Opção 5', items: ['120 g de cuscuz', '50 g de carne magra', '10 g de requeijão light'] },
    ],
  },
  {
    id: 'jantar', label: 'Jantar', Icon: Moon, color: '#7C3AED', required: true, kcalShare: 0.20,
    options: [
      { label: 'Opção 1', protein: '30–40 g', items: ['Arroz branco (100–120 g)', 'Carne magra ou frango (100–140 g)', 'Legumes cozidos'] },
      { label: 'Opção 2 — Sanduíche', items: ['1 pão francês', 'Frango desfiado (100–120 g)', '20 g de queijo branco', 'Pequena porção de salada'] },
      { label: 'Opção 3', items: ['Baião de dois (100–120 g)', 'Carne magra (100–120 g)'] },
      { label: 'Opção 4', items: ['Macarrão cozido', 'Frango ou atum (100–120 g)'] },
      { label: 'Opção 5 — Omelete', items: ['2 ovos inteiros + 3 claras', 'Pequena porção de arroz ou batata'] },
      { label: 'Opção 6 — Dias de pouca fome', protein: '35–40 g', items: ['170 g de iogurte grego natural', '1 scoop de whey', '20 g de aveia', 'Morangos ou banana'] },
    ],
  },
  {
    id: 'ceia', label: 'Ceia', Icon: Moon, color: '#1E40AF', required: false, kcalShare: 0.05,
    note: 'Somente se necessário',
    options: [
      { label: 'Opção 1', items: ['1 scoop de whey com água'] },
      { label: 'Opção 2', items: ['200 ml de leite desnatado', '20 g de whey'] },
      { label: 'Opção 3', items: ['Iogurte proteico'] },
      { label: 'Opção 4', items: ['Cottage ou ricota (80 g)'] },
    ],
  },
]

export const INFO_F: InfoSection[] = [
  { id: 'prot-subs',  Icon: Zap,     color: '#DC2626', label: 'Substituições das Proteínas',   items: ['Frango desfiado', 'Carne magra', 'Patinho moído', 'Peixe', 'Sardinha', 'Atum', 'Fígado (1× por semana)', '3 ovos', 'Iogurte grego', 'Whey protein'] },
  { id: 'carb-subs',  Icon: Package,  color: '#D97706', label: 'Substituições dos Carboidratos', items: ['Arroz branco', 'Macarrão', 'Cuscuz', 'Tapioca', 'Batata inglesa', 'Batata doce', 'Mandioca', 'Baião de dois'] },
  { id: 'frutas',     Icon: Leaf,     color: '#059669', label: 'Frutas Prioritárias',            items: ['Mamão', 'Kiwi', 'Banana', 'Morango', 'Melão', 'Maçã', 'Pera'] },
  { id: 'fibras',     Icon: Leaf,     color: '#16A34A', label: 'Fibras e Constipação',           items: ['Feijão', 'Frutas', 'Legumes', 'Vegetais', 'Água'], note: 'Se necessário: Psyllium 5 g inicialmente, podendo chegar a 10 g por dia. Sempre com boa hidratação.' },
  { id: 'peixes',     Icon: Fish,     color: '#0EA5E9', label: 'Peixes e Ômega-3',              items: ['Sardinha', 'Atum', 'Salmão', 'Cavalinha'],           note: 'Idealmente 2 vezes por semana.' },
]

// ── Dieta Masculina ───────────────────────────────────────────────────────────
export const DIET_M: MealSection[] = [
  {
    id: 'cafe', label: 'Café da Manhã', Icon: Sun, color: '#D97706', required: true, kcalShare: 0.25,
    options: [
      { label: 'Opção 1', protein: '30 g',    items: ['1 pão francês', '3 ovos', '30 g de queijo branco', '1 fruta — mamão (180 g), banana (70 g), kiwi (130 g) ou melão'] },
      { label: 'Opção 2', protein: '30–35 g', items: ['2 fatias de pão integral', '120 g de frango desfiado (ou 2 ovos + 3 claras)', '1 fruta'] },
      { label: 'Opção 3', protein: '35 g',    items: ['40 g de aveia', '1 scoop de whey', '200 ml de leite semidesnatado', '1 fruta'] },
      { label: 'Opção 4', protein: '35–40 g', items: ['170–200 g de iogurte grego natural', '1 scoop de whey', 'Morangos ou banana'] },
    ],
  },
  {
    id: 'lanche-m', label: 'Lanche da Manhã', Icon: Droplets, color: '#F59E0B', required: false, kcalShare: 0.10,
    note: 'Opcional — complementa proteína do dia',
    options: [
      { label: 'Opção 1', items: ['1 scoop de whey com água'] },
      { label: 'Opção 2', items: ['1 iogurte proteico'] },
      { label: 'Opção 3', items: ['2 ovos cozidos'] },
      { label: 'Opção 4', protein: '15–25 g', items: ['1 fruta', '50 g de cottage ou ricota'] },
    ],
  },
  {
    id: 'almoco', label: 'Almoço', Icon: Utensils, color: '#059669', required: true, kcalShare: 0.30,
    options: [
      { label: 'Opção 1', protein: '40–50 g', items: ['Arroz branco cozido (130–180 g)', 'Feijão (100 g)', 'Frango grelhado (150–200 g)', 'Legumes cozidos', 'Pequena porção de salada'] },
      { label: 'Opção 2', items: ['Macarrão cozido (150–180 g)', 'Patinho moído ou carne magra (150–180 g)', 'Legumes cozidos'] },
      { label: 'Opção 3', items: ['Baião de dois (180–220 g)', 'Frango desfiado ou carne magra (150–180 g)', 'Legumes', 'Salada'] },
      { label: 'Opção 4', items: ['Arroz (130 g)', 'Feijão (100 g)', 'Peixe (180 g)', 'Legumes cozidos'] },
      { label: 'Opção 5', items: ['Batata doce ou mandioca', 'Frango ou carne magra (150–180 g)', 'Legumes'] },
    ],
  },
  {
    id: 'lanche-t', label: 'Lanche da Tarde', Icon: Droplets, color: '#0891B2', required: false, kcalShare: 0.10,
    note: 'Opcional — complementa proteína do dia',
    options: [
      { label: 'Opção 1', items: ['1 scoop de whey', '1 fruta'] },
      { label: 'Opção 2 — Sanduíche', items: ['2 fatias de pão integral', '100–120 g de frango desfiado (ou 1 lata de atum em água)'] },
      { label: 'Opção 3', items: ['Iogurte proteico', '15 g de aveia'] },
      { label: 'Opção 4', items: ['2 ovos', '1 fruta'] },
    ],
  },
  {
    id: 'jantar', label: 'Jantar', Icon: Moon, color: '#7C3AED', required: true, kcalShare: 0.20,
    options: [
      { label: 'Opção 1', protein: '40–45 g', items: ['Arroz (120–160 g)', 'Carne magra ou frango (150–180 g)', 'Legumes cozidos'] },
      { label: 'Opção 2', items: ['1 pão francês', 'Frango desfiado (150 g)', '30 g de queijo branco', 'Legumes ou pequena salada'] },
      { label: 'Opção 3 — Omelete', items: ['3 ovos inteiros + 3 claras', 'Pequena porção de arroz ou batata'] },
      { label: 'Opção 4', items: ['Macarrão cozido', 'Atum ou frango (150–180 g)'] },
      { label: 'Opção 5 — Dias de pouca fome', protein: '40 g', items: ['170 g de iogurte grego', '1 scoop de whey', '1 banana', '20 g de aveia'] },
    ],
  },
  {
    id: 'ceia', label: 'Ceia', Icon: Moon, color: '#1E40AF', required: false, kcalShare: 0.05,
    note: 'Somente se necessário',
    options: [
      { label: 'Opção 1', items: ['1 scoop de whey com água'] },
      { label: 'Opção 2', items: ['200 ml de leite desnatado', '20 g de whey'] },
      { label: 'Opção 3', items: ['Iogurte proteico'] },
      { label: 'Opção 4', items: ['Cottage ou ricota (80 g)'] },
    ],
  },
]

export const INFO_M: InfoSection[] = [
  { id: 'prot-fontes', Icon: Zap,     color: '#DC2626', label: 'Fontes de Proteína para Rodízio', items: ['Frango', 'Patinho', 'Coxão mole', 'Peixes', 'Atum em água', 'Sardinha', 'Ovos', 'Iogurte grego', 'Cottage', 'Ricota', 'Whey protein'] },
  { id: 'carbs',       Icon: Package,  color: '#D97706', label: 'Carboidratos',                    items: ['Arroz', 'Feijão', 'Batata inglesa', 'Batata doce', 'Mandioca', 'Macarrão', 'Pão francês', 'Pão integral', 'Aveia', 'Cuscuz', 'Tapioca'] },
  { id: 'frutas',      Icon: Leaf,     color: '#059669', label: 'Frutas Prioritárias',             items: ['Mamão', 'Kiwi', 'Pera', 'Maçã', 'Morango', 'Banana', 'Melão'], note: 'Para o intestino e melhor tolerância.' },
  { id: 'fibras',      Icon: Leaf,     color: '#16A34A', label: 'Fibras e Constipação',            items: ['Feijão', 'Frutas', 'Legumes', 'Vegetais'], note: 'Se necessário: Psyllium 5 g inicialmente, podendo evoluir para 10 g por dia. Sempre associado ao aumento da ingestão de água.' },
  { id: 'peixes',      Icon: Fish,     color: '#0EA5E9', label: 'Peixes e Ômega-3',               items: ['Sardinha', 'Atum', 'Salmão', 'Cavalinha'], note: 'Idealmente duas vezes por semana.' },
]
