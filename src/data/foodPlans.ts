import {
  Sun, Droplets, Utensils, Moon, Fish, Zap, Package, Leaf, GlassWater, CupSoda, Milk,
  Egg, Apple, type LucideIcon,
} from 'lucide-react'
import type { AppetiteMode } from '../utils/foodUtils'

// Atalhos de registro de água (tela de Hidratação e widget do Início)
export const WATER_QUICK_ADD: { ml: number; label: string; Icon: LucideIcon }[] = [
  { ml: 200, label: 'Copo',        Icon: GlassWater },
  { ml: 300, label: 'Copo grande', Icon: CupSoda },
  { ml: 500, label: 'Garrafa',     Icon: Milk },
]

// Telas internas da seção de alimentação (com cabeçalho próprio no HealthHub).
// Hoje, Cardápio e Guia são abas dentro da própria seção.
export type FoodView = 'hydration'

export const FOOD_VIEWS: { id: FoodView; label: string; sub: string; Icon: LucideIcon }[] = [
  { id: 'hydration', label: 'Hidratação', sub: 'Registro de água', Icon: GlassWater },
]

export type FoodTab = 'today' | 'menu' | 'guide'
export const FOOD_TABS: { id: FoodTab; label: string }[] = [
  { id: 'today', label: 'Hoje' },
  { id: 'menu',  label: 'Cardápio' },
  { id: 'guide', label: 'Guia' },
]

// ── Modo do dia (fome) ────────────────────────────────────────────────────────
export const APPETITE_MODES: { id: AppetiteMode; label: string; hint: string }[] = [
  { id: 'normal',  label: 'Normal',     hint: 'Cardápio completo do seu plano.' },
  { id: 'low',     label: 'Pouca fome', hint: 'Refeições menores, com mais proteína em menos volume.' },
  { id: 'extreme', label: 'Sem fome',   hint: '3 refeições pequenas, foco total em proteína.' },
]

// Janela de horário de cada refeição (mesmos horários do card "Agora" do Início)
export const MEAL_WINDOW: Record<string, [number, number]> = {
  'cafe': [6, 9.5], 'lanche-m': [9.5, 12], 'almoco': [12, 14.5],
  'lanche-t': [14.5, 18], 'jantar': [18, 21], 'ceia': [21, 24],
}

// Ordem de montagem do prato
export const PLATE_ORDER = ['Proteína', 'Carboidrato', 'Legumes cozidos', 'Salada crua']

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
  'cafe': 'var(--cobalt)', 'lanche-m': 'var(--ink-2)', 'almoco': 'var(--teal-d)',
  'lanche-t': 'var(--ink-2)', 'jantar': 'var(--cobalt)', 'ceia': 'var(--navy)',
}
export const MEAL_ICON: Record<string, IconComp> = {
  'cafe': Sun, 'lanche-m': Droplets, 'almoco': Utensils,
  'lanche-t': Droplets, 'jantar': Moon, 'ceia': Moon,
}

// ── Dieta Feminina ────────────────────────────────────────────────────────────
export const DIET_F: MealSection[] = [
  {
    id: 'cafe', label: 'Café da Manhã', Icon: Sun, color: 'var(--cobalt)', required: true, kcalShare: 0.25,
    options: [
      { label: 'Opção 1', protein: '25–30 g', items: ['1 pão francês', '2 ovos inteiros', '30 g de queijo branco', '1 fruta — mamão (120 g), banana (50 g), kiwi (90 g) ou melão'] },
      { label: 'Opção 2', protein: '28–30 g', items: ['1 pão francês', '1 ovo inteiro + 3 claras', '20 g de queijo branco ou requeijão light', '1 fruta'] },
      { label: 'Opção 3', protein: '25 g',    items: ['2 fatias de pão integral', '2 ovos inteiros', '1 fruta'] },
      { label: 'Opção 4 — Vitamina', protein: '30–35 g', items: ['200 ml de leite desnatado', '1 scoop de whey', '20 g de aveia', '1 fruta'] },
      { label: 'Opção 5', protein: '35–40 g', items: ['170 g de iogurte grego natural', '1 scoop de whey', 'Morangos ou banana'] },
    ],
  },
  {
    id: 'lanche-m', label: 'Lanche da Manhã', Icon: Droplets, color: 'var(--ink-2)', required: false, kcalShare: 0.10,
    note: 'Opcional — complementa proteína do dia',
    options: [
      { label: 'Opção 1', items: ['1 scoop de whey com água'] },
      { label: 'Opção 2', items: ['1 iogurte proteico'] },
      { label: 'Opção 3', items: ['2 ovos cozidos'] },
      { label: 'Opção 4', protein: '15–25 g', items: ['1 fruta', '50 g de cottage ou ricota'] },
    ],
  },
  {
    id: 'almoco', label: 'Almoço', Icon: Utensils, color: 'var(--teal-d)', required: true, kcalShare: 0.30,
    options: [
      { label: 'Opção 1', protein: '35–45 g', items: ['Arroz branco cozido (90–120 g)', 'Feijão (70–100 g)', 'Frango grelhado (120–150 g)', 'Legumes cozidos', 'Pequena porção de salada'] },
      { label: 'Opção 2', items: ['Arroz branco (100–120 g)', 'Frango (120–150 g)', 'Legumes'], note: 'Chocolate ao leite (15 g) eventualmente, apenas para aderência' },
      { label: 'Opção 3', items: ['Baião de dois (100–130 g)', 'Frango ou carne magra (120–150 g)', 'Legumes'] },
      { label: 'Opção 4', items: ['Macarrão cozido (100–120 g)', 'Sardinha ou peixe (130–150 g)', 'Legumes'] },
      { label: 'Opção 5', items: ['Arroz branco (90–120 g)', 'Feijão (70–100 g)', 'Carne magra (100–120 g)', 'Legumes'] },
    ],
  },
  {
    id: 'lanche-t', label: 'Lanche da Tarde', Icon: Droplets, color: 'var(--ink-2)', required: false, kcalShare: 0.10,
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
    id: 'jantar', label: 'Jantar', Icon: Moon, color: 'var(--cobalt)', required: true, kcalShare: 0.20,
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
    id: 'ceia', label: 'Ceia', Icon: Moon, color: 'var(--navy)', required: false, kcalShare: 0.05,
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
  { id: 'prot-subs',  Icon: Zap,     color: 'var(--navy)', label: 'Substituições das Proteínas',   items: ['Frango desfiado', 'Carne magra', 'Patinho moído', 'Peixe', 'Sardinha', 'Atum', 'Fígado (1× por semana)', '3 ovos', 'Iogurte grego', 'Whey protein'] },
  { id: 'carb-subs',  Icon: Package,  color: 'var(--ink-2)', label: 'Substituições dos Carboidratos', items: ['Arroz branco', 'Macarrão', 'Cuscuz', 'Tapioca', 'Batata inglesa', 'Batata doce', 'Mandioca', 'Baião de dois'] },
  { id: 'frutas',     Icon: Leaf,     color: 'var(--teal-d)', label: 'Frutas Prioritárias',            items: ['Mamão', 'Kiwi', 'Banana', 'Morango', 'Melão', 'Maçã', 'Pera'] },
  { id: 'fibras',     Icon: Leaf,     color: 'var(--teal-d)', label: 'Fibras e Constipação',           items: ['Feijão', 'Frutas', 'Legumes', 'Vegetais', 'Água'], note: 'Se necessário: Psyllium 5 g inicialmente, podendo chegar a 10 g por dia. Sempre com boa hidratação.' },
  { id: 'peixes',     Icon: Fish,     color: 'var(--cobalt)', label: 'Peixes e Ômega-3',              items: ['Sardinha', 'Atum', 'Salmão', 'Cavalinha'],           note: 'Idealmente 2 vezes por semana.' },
]

// ── Dieta Masculina ───────────────────────────────────────────────────────────
export const DIET_M: MealSection[] = [
  {
    id: 'cafe', label: 'Café da Manhã', Icon: Sun, color: 'var(--cobalt)', required: true, kcalShare: 0.25,
    options: [
      { label: 'Opção 1', protein: '30 g',    items: ['1 pão francês', '3 ovos', '30 g de queijo branco', '1 fruta — mamão (180 g), banana (70 g), kiwi (130 g) ou melão'] },
      { label: 'Opção 2', protein: '30–35 g', items: ['2 fatias de pão integral', '120 g de frango desfiado (ou 2 ovos + 3 claras)', '1 fruta'] },
      { label: 'Opção 3', protein: '35 g',    items: ['40 g de aveia', '1 scoop de whey', '200 ml de leite semidesnatado', '1 fruta'] },
      { label: 'Opção 4', protein: '35–40 g', items: ['170–200 g de iogurte grego natural', '1 scoop de whey', 'Morangos ou banana'] },
    ],
  },
  {
    id: 'lanche-m', label: 'Lanche da Manhã', Icon: Droplets, color: 'var(--ink-2)', required: false, kcalShare: 0.10,
    note: 'Opcional — complementa proteína do dia',
    options: [
      { label: 'Opção 1', items: ['1 scoop de whey com água'] },
      { label: 'Opção 2', items: ['1 iogurte proteico'] },
      { label: 'Opção 3', items: ['2 ovos cozidos'] },
      { label: 'Opção 4', protein: '15–25 g', items: ['1 fruta', '50 g de cottage ou ricota'] },
    ],
  },
  {
    id: 'almoco', label: 'Almoço', Icon: Utensils, color: 'var(--teal-d)', required: true, kcalShare: 0.30,
    options: [
      { label: 'Opção 1', protein: '40–50 g', items: ['Arroz branco cozido (130–180 g)', 'Feijão (100 g)', 'Frango grelhado (150–200 g)', 'Legumes cozidos', 'Pequena porção de salada'] },
      { label: 'Opção 2', items: ['Macarrão cozido (150–180 g)', 'Patinho moído ou carne magra (150–180 g)', 'Legumes cozidos'] },
      { label: 'Opção 3', items: ['Baião de dois (180–220 g)', 'Frango desfiado ou carne magra (150–180 g)', 'Legumes', 'Salada'] },
      { label: 'Opção 4', items: ['Arroz (130 g)', 'Feijão (100 g)', 'Peixe (180 g)', 'Legumes cozidos'] },
      { label: 'Opção 5', items: ['Batata doce ou mandioca', 'Frango ou carne magra (150–180 g)', 'Legumes'] },
    ],
  },
  {
    id: 'lanche-t', label: 'Lanche da Tarde', Icon: Droplets, color: 'var(--ink-2)', required: false, kcalShare: 0.10,
    note: 'Opcional — complementa proteína do dia',
    options: [
      { label: 'Opção 1', items: ['1 scoop de whey', '1 fruta'] },
      { label: 'Opção 2 — Sanduíche', items: ['2 fatias de pão integral', '100–120 g de frango desfiado (ou 1 lata de atum em água)'] },
      { label: 'Opção 3', items: ['Iogurte proteico', '15 g de aveia'] },
      { label: 'Opção 4', items: ['2 ovos', '1 fruta'] },
    ],
  },
  {
    id: 'jantar', label: 'Jantar', Icon: Moon, color: 'var(--cobalt)', required: true, kcalShare: 0.20,
    options: [
      { label: 'Opção 1', protein: '40–45 g', items: ['Arroz (120–160 g)', 'Carne magra ou frango (150–180 g)', 'Legumes cozidos'] },
      { label: 'Opção 2', items: ['1 pão francês', 'Frango desfiado (150 g)', '30 g de queijo branco', 'Legumes ou pequena salada'] },
      { label: 'Opção 3 — Omelete', items: ['3 ovos inteiros + 3 claras', 'Pequena porção de arroz ou batata'] },
      { label: 'Opção 4', items: ['Macarrão cozido', 'Atum ou frango (150–180 g)'] },
      { label: 'Opção 5 — Dias de pouca fome', protein: '40 g', items: ['170 g de iogurte grego', '1 scoop de whey', '1 banana', '20 g de aveia'] },
    ],
  },
  {
    id: 'ceia', label: 'Ceia', Icon: Moon, color: 'var(--navy)', required: false, kcalShare: 0.05,
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
  { id: 'prot-fontes', Icon: Zap,     color: 'var(--navy)', label: 'Fontes de Proteína para Rodízio', items: ['Frango', 'Patinho', 'Coxão mole', 'Peixes', 'Atum em água', 'Sardinha', 'Ovos', 'Iogurte grego', 'Cottage', 'Ricota', 'Whey protein'] },
  { id: 'carbs',       Icon: Package,  color: 'var(--ink-2)', label: 'Carboidratos',                    items: ['Arroz', 'Feijão', 'Batata inglesa', 'Batata doce', 'Mandioca', 'Macarrão', 'Pão francês', 'Pão integral', 'Aveia', 'Cuscuz', 'Tapioca'] },
  { id: 'frutas',      Icon: Leaf,     color: 'var(--teal-d)', label: 'Frutas Prioritárias',             items: ['Mamão', 'Kiwi', 'Pera', 'Maçã', 'Morango', 'Banana', 'Melão'], note: 'Para o intestino e melhor tolerância.' },
  { id: 'fibras',      Icon: Leaf,     color: 'var(--teal-d)', label: 'Fibras e Constipação',            items: ['Feijão', 'Frutas', 'Legumes', 'Vegetais'], note: 'Se necessário: Psyllium 5 g inicialmente, podendo evoluir para 10 g por dia. Sempre associado ao aumento da ingestão de água.' },
  { id: 'peixes',      Icon: Fish,     color: 'var(--cobalt)', label: 'Peixes e Ômega-3',               items: ['Sardinha', 'Atum', 'Salmão', 'Cavalinha'], note: 'Idealmente duas vezes por semana.' },
]

export const PRINCIPLES: Record<DietSex, string[]> = {
  F: [
    'Preservação de massa muscular',
    'Maior saciedade com menor volume alimentar',
    'Prevenção de queda de cabelo',
    'Melhor tolerância gastrointestinal',
    'Redução da constipação',
    'Facilidade de adesão por 30 dias',
    'Flexibilidade e praticidade',
  ],
  M: [
    'Preservação de massa muscular',
    'Alta saciedade',
    'Melhor tolerância gastrointestinal',
    'Menor risco de náusea e refluxo',
    'Prevenção de constipação',
    'Facilidade de adesão por longo prazo',
  ],
}

// ── Semanas de pouca fome ─────────────────────────────────────────────────────
const LOW_SNACKS: MealOption[] = [
  { label: 'Whey com água',     items: ['1 scoop de whey com água'] },
  { label: 'Iogurte proteico',  items: ['1 iogurte proteico'] },
  { label: 'Cottage ou ricota', items: ['Cottage ou ricota'] },
]

// Opções no modo "Pouca fome". Refeição sem lista aqui usa o cardápio normal.
export const LOW_APPETITE_OPTIONS: Record<string, MealOption[]> = {
  'cafe': [
    { label: 'Opção 1', protein: '35–40 g', items: ['170 g de iogurte grego', '1 scoop de whey', 'Morangos ou banana'] },
    { label: 'Opção 2 — Vitamina', protein: '30–35 g', items: ['200 ml de leite semidesnatado', '1 scoop de whey', '20 g de aveia', '1 banana'] },
    { label: 'Opção 3', protein: '25–30 g', items: ['2 ovos', '2 claras', '1 fatia de pão'] },
  ],
  'lanche-m': LOW_SNACKS,
  'almoco': [
    { label: 'Prato pequeno', items: ['100–130 g de arroz', '150–180 g de frango ou carne magra', 'Legumes cozidos', 'Sem exagerar na salada crua'], note: 'Coma primeiro a proteína' },
  ],
  'lanche-t': LOW_SNACKS,
  'jantar': [
    { label: 'Opção 1 — Omelete', items: ['3 ovos', '3 claras', 'Pequena porção de arroz'] },
    { label: 'Opção 2 — Sanduíche', items: ['1 pão francês', '150 g de frango desfiado', '30 g de queijo branco'] },
    { label: 'Opção 3', protein: '40 g', items: ['Iogurte grego', '1 scoop de whey', '20 g de aveia'] },
  ],
}

// Dias extremos: só as 3 refeições principais, ~120 g de proteína no total
export const EXTREME_OPTIONS: Record<string, MealOption[]> = {
  'cafe':   [{ label: 'Iogurte + whey',   protein: '40 g', items: ['Iogurte grego', 'Whey'] }],
  'almoco': [{ label: 'Frango com arroz', protein: '45 g', items: ['180 g de frango', '100 g de arroz'] }],
  'jantar': [{ label: 'Vitamina proteica', protein: '35 g', items: ['Whey', 'Leite desnatado', 'Banana'] }],
}

// Opções de uma refeição conforme o modo do dia
export function mealOptions(meal: MealSection, mode: AppetiteMode): MealOption[] {
  if (mode === 'extreme') return EXTREME_OPTIONS[meal.id] ?? LOW_APPETITE_OPTIONS[meal.id] ?? meal.options
  if (mode === 'low')     return LOW_APPETITE_OPTIONS[meal.id] ?? meal.options
  return meal.options
}

// No modo "Sem fome" só as refeições principais aparecem
export function mealsForMode(diet: MealSection[], mode: AppetiteMode): MealSection[] {
  return mode === 'extreme' ? diet.filter(m => m.required) : diet
}

export const LOW_SIGNS = [
  'Saciedade com poucas colheradas', 'Náusea', 'Empachamento',
  'Sensação de comida parada no estômago', 'Refluxo', 'Falta de vontade de comer',
  'Pular refeições sem perceber',
]

export const TOLERATED: { label: string; items: string[] }[] = [
  { label: 'Proteínas',    items: ['Frango desfiado', 'Peixe', 'Atum em água', 'Ovos', 'Iogurte grego', 'Cottage', 'Whey'] },
  { label: 'Carboidratos', items: ['Arroz branco', 'Batata inglesa', 'Batata doce', 'Cuscuz', 'Pão francês', 'Banana', 'Mamão'] },
]

export const LOW_PRIORITIES = [
  'Bater a meta de proteína', 'Manter hidratação adequada',
  'Treinar musculação regularmente', 'Ser consistente por 30 dias',
]

// ── Extras de um toque (valores aproximados por porção) ───────────────────────
export interface QuickExtra { id: string; label: string; portion: string; protein: number; kcal: number; Icon: IconComp }
export const QUICK_EXTRAS: QuickExtra[] = [
  { id: 'whey',    label: 'Whey',             portion: '1 scoop',    protein: 24, kcal: 120, Icon: Zap },
  { id: 'iogurte', label: 'Iogurte proteico', portion: '1 pote',     protein: 15, kcal: 110, Icon: Milk },
  { id: 'ovos',    label: 'Ovos cozidos',     portion: '2 unidades', protein: 12, kcal: 150, Icon: Egg },
  { id: 'cottage', label: 'Cottage',          portion: '50 g',       protein: 6,  kcal: 50,  Icon: Milk },
  { id: 'fruta',   label: 'Fruta',            portion: '1 unidade',  protein: 1,  kcal: 70,  Icon: Apple },
]
