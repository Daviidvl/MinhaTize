import { useState, useRef, useEffect, type CSSProperties } from 'react'
import { Utensils, Info, ChevronDown, RotateCcw, Droplets, Leaf, AlertCircle, Check, Plus, X } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

type DietSex         = 'M' | 'F'
type DietTab         = 'hoje' | 'cardapio' | 'pouca-fome'
type Goal            = 'lose' | 'maintain' | 'gain'
type Activity        = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
type ProtocolPhase   = 'beginning' | 'adaptation' | 'maintenance'
type MealFrequency   = '2' | '3' | '4' | '5-6'

interface DietProfile {
  sex:            DietSex
  age:            number
  height:         number
  weight:         number
  goalWeight:     number
  goal:           Goal
  activity:       Activity
  protocolPhase:  ProtocolPhase
  mealFrequency:  MealFrequency
  challenges:     string[]    // nausea, constipation, low_appetite, protein_difficulty, reflux
  comorbidities:  string[]    // diabetes2, prediabetes, hypertension, hypothyroidism, none
  restrictions:   string[]
  dailyKcal:      number
}

interface ManualItem { id: string; name: string; kcal: number }
interface DayLog     { meals: string[]; manual: ManualItem[] }
type FoodLog = Record<string, DayLog>

interface Option      { label?: string; items: string[]; protein?: string; note?: string }
interface MealSection { id: string; label: string; sublabel?: string; color: string; kcalShare: number; options: Option[] }
interface ListSection { id: string; label: string; items: string[]; note?: string }

interface AIDietCache {
  meals:      MealSection[]
  lowHunger:  MealSection[]
  lists:      ListSection[]
  profileHash: string
}

// ── Storage ───────────────────────────────────────────────────────────────────

const STORAGE_KEY   = 'tizetrack_diet'
const LOG_KEY       = 'tizetrack_food_log'
const AI_DIET_KEY   = 'tizetrack_ai_diet'

function dietProfileHash(p: DietProfile): string {
  return `${p.sex}-${p.mealFrequency}-${p.restrictions.sort().join(',')}-${p.goal}-${Math.round(p.dailyKcal / 50) * 50}`
}

function toDateStr(d = new Date()) { return d.toISOString().split('T')[0] }

// ── Calorie calculation ───────────────────────────────────────────────────────

const ACTIVITY_FACTOR: Record<Activity, number> = {
  sedentary:  1.2,
  light:      1.375,
  moderate:   1.55,
  active:     1.725,
  very_active:1.9,
}

// Phase adjustment: beginning phase = gentler deficit (body adapting to drug)
const PHASE_ADJ: Record<ProtocolPhase, number> = {
  beginning:   -200,
  adaptation:  -400,
  maintenance: -300,
}

function calcTDEE(p: Omit<DietProfile, 'dailyKcal'>): number {
  const bmr = p.sex === 'M'
    ? 10 * p.weight + 6.25 * p.height - 5 * p.age + 5
    : 10 * p.weight + 6.25 * p.height - 5 * p.age - 161
  const tdee = Math.round(bmr * ACTIVITY_FACTOR[p.activity])
  const goalAdj = p.goal === 'gain' ? 300 : PHASE_ADJ[p.protocolPhase ?? 'adaptation']
  return Math.max(1200, tdee + goalAdj)
}

// ── Meal data ─────────────────────────────────────────────────────────────────
// kcalShare: proportion of dailyKcal assigned to this meal

const FEMALE_MEALS: MealSection[] = [
  {
    id: 'f-cafe', label: 'Café da Manhã', color: '#D97706', kcalShare: 0.22,
    options: [
      { items: ['1 pão francês', '2 ovos inteiros', '30 g de queijo branco', '1 fruta: mamão (120 g), banana (50 g), kiwi (90 g) ou melão'], protein: '25–30 g' },
      { items: ['1 pão francês', '1 ovo inteiro + 3 claras', '20 g de queijo branco ou requeijão light', '1 fruta'], protein: '28–30 g' },
      { items: ['2 fatias de pão integral', '2 ovos inteiros', '1 fruta'], protein: '25 g' },
      { label: 'Vitamina', items: ['200 ml de leite desnatado', '1 scoop de whey', '20 g de aveia', '1 fruta'], protein: '30–35 g' },
      { items: ['170 g de iogurte grego natural', '1 scoop de whey', 'Morangos ou banana'], protein: '35–40 g' },
    ],
  },
  {
    id: 'f-lanche-m', label: 'Lanche da Manhã', sublabel: 'Opcional', color: '#F59E0B', kcalShare: 0.09,
    options: [
      { items: ['1 scoop de whey com água'] },
      { items: ['1 iogurte proteico'] },
      { items: ['2 ovos cozidos'] },
      { items: ['1 fruta', '50 g de cottage ou ricota'], protein: '15–25 g (média)' },
    ],
  },
  {
    id: 'f-almoco', label: 'Almoço', color: '#059669', kcalShare: 0.32,
    options: [
      { items: ['Arroz branco cozido (90–120 g)', 'Feijão (70–100 g)', 'Frango grelhado (120–150 g)', 'Legumes cozidos', 'Pequena porção de salada'], protein: '35–45 g' },
      { items: ['Arroz branco (100–120 g)', 'Frango (120–150 g)', 'Legumes'] },
      { items: ['Baião de dois (100–130 g)', 'Frango ou carne magra (120–150 g)', 'Legumes'] },
      { items: ['Macarrão cozido (100–120 g)', 'Sardinha ou peixe (130–150 g)', 'Legumes'] },
      { items: ['Arroz branco (90–120 g)', 'Feijão (70–100 g)', 'Carne magra (100–120 g)', 'Legumes'] },
    ],
  },
  {
    id: 'f-lanche-t', label: 'Lanche da Tarde', sublabel: 'Opcional', color: '#0891B2', kcalShare: 0.09,
    options: [
      { items: ['1 scoop de whey', '1 fruta'] },
      { label: 'Sanduíche', items: ['2 fatias de pão integral', '100 g de frango desfiado'] },
      { items: ['Iogurte proteico', '15 g de aveia'] },
      { items: ['2 ovos', '1 fruta'] },
      { items: ['120 g de cuscuz', '50 g de carne magra', '10 g de requeijão light'] },
    ],
  },
  {
    id: 'f-jantar', label: 'Jantar', color: '#7C3AED', kcalShare: 0.23,
    options: [
      { items: ['Arroz branco (100–120 g)', 'Carne magra ou frango (100–140 g)', 'Legumes cozidos'], protein: '30–40 g' },
      { label: 'Sanduíche', items: ['1 pão francês', 'Frango desfiado (100–120 g)', '20 g de queijo branco', 'Pequena porção de salada'] },
      { items: ['Baião de dois (100–120 g)', 'Carne magra (100–120 g)'] },
      { items: ['Macarrão cozido', 'Frango ou atum (100–120 g)'] },
      { label: 'Omelete', items: ['2 ovos inteiros + 3 claras', 'Pequena porção de arroz ou batata'] },
    ],
  },
  {
    id: 'f-ceia', label: 'Ceia', sublabel: 'Somente se necessário', color: '#1E40AF', kcalShare: 0.05,
    options: [
      { items: ['1 scoop de whey com água'] },
      { items: ['200 ml de leite desnatado', '20 g de whey'] },
      { items: ['Iogurte proteico'] },
      { items: ['Cottage ou ricota (80 g)'] },
    ],
  },
]

const MALE_MEALS: MealSection[] = [
  {
    id: 'm-cafe', label: 'Café da Manhã', color: '#D97706', kcalShare: 0.22,
    options: [
      { items: ['1 pão francês', '3 ovos', '30 g de queijo branco', '1 fruta: mamão (180 g), banana (70 g), kiwi (130 g) ou melão'], protein: '30 g' },
      { items: ['2 fatias de pão integral', '120 g de frango desfiado (ou 2 ovos + 3 claras)', '1 fruta'], protein: '30–35 g' },
      { items: ['40 g de aveia', '1 scoop de whey', '200 ml de leite semidesnatado', '1 fruta'], protein: '35 g' },
      { items: ['170–200 g de iogurte grego natural', '1 scoop de whey', 'Morangos ou banana'], protein: '35–40 g' },
    ],
  },
  {
    id: 'm-lanche-m', label: 'Lanche da Manhã', sublabel: 'Opcional', color: '#F59E0B', kcalShare: 0.09,
    options: [
      { items: ['1 scoop de whey com água'] },
      { items: ['1 iogurte proteico'] },
      { items: ['2 ovos cozidos'] },
      { items: ['1 fruta', '50 g de cottage ou ricota'], protein: '15–25 g (média)' },
    ],
  },
  {
    id: 'm-almoco', label: 'Almoço', color: '#059669', kcalShare: 0.32,
    options: [
      { items: ['Arroz branco cozido (130–180 g)', 'Feijão (100 g)', 'Frango grelhado (150–200 g)', 'Legumes cozidos', 'Pequena porção de salada'], protein: '40–50 g' },
      { items: ['Macarrão cozido (150–180 g)', 'Patinho moído ou carne magra (150–180 g)', 'Legumes cozidos'] },
      { items: ['Baião de dois (180–220 g)', 'Frango desfiado ou carne magra (150–180 g)', 'Legumes', 'Salada'] },
      { items: ['Arroz (130 g)', 'Feijão (100 g)', 'Peixe (180 g)', 'Legumes cozidos'] },
      { items: ['Batata doce ou mandioca', 'Frango ou carne magra (150–180 g)', 'Legumes'] },
    ],
  },
  {
    id: 'm-lanche-t', label: 'Lanche da Tarde', sublabel: 'Opcional', color: '#0891B2', kcalShare: 0.09,
    options: [
      { items: ['1 scoop de whey', '1 fruta'] },
      { label: 'Sanduíche', items: ['2 fatias de pão integral', '100–120 g de frango desfiado (ou 1 lata de atum em água)'] },
      { items: ['Iogurte proteico', '15 g de aveia'] },
      { items: ['2 ovos', '1 fruta'] },
    ],
  },
  {
    id: 'm-jantar', label: 'Jantar', color: '#7C3AED', kcalShare: 0.23,
    options: [
      { items: ['Arroz (120–160 g)', 'Carne magra ou frango (150–180 g)', 'Legumes cozidos'], protein: '40–45 g' },
      { items: ['1 pão francês', 'Frango desfiado (150 g)', '30 g de queijo branco', 'Legumes ou pequena salada'] },
      { label: 'Omelete', items: ['3 ovos inteiros + 3 claras', 'Pequena porção de arroz ou batata'] },
      { items: ['Macarrão cozido', 'Atum ou frango (150–180 g)'] },
    ],
  },
  {
    id: 'm-ceia', label: 'Ceia', sublabel: 'Somente se necessário', color: '#1E40AF', kcalShare: 0.05,
    options: [
      { items: ['1 scoop de whey com água'] },
      { items: ['200 ml de leite desnatado', '20 g de whey'] },
      { items: ['Iogurte proteico'] },
      { items: ['Cottage ou ricota (80 g)'] },
    ],
  },
]

const FEMALE_LISTS: ListSection[] = [
  { id: 'f-prot-sub', label: 'Substituições das Proteínas', items: ['Frango desfiado', 'Carne magra', 'Patinho moído', 'Peixe', 'Sardinha', 'Atum', 'Fígado (1×/sem)', '3 ovos', 'Iogurte grego', 'Whey protein'] },
  { id: 'f-carb-sub', label: 'Substituições dos Carboidratos', items: ['Arroz branco', 'Macarrão', 'Cuscuz', 'Tapioca', 'Batata inglesa', 'Batata doce', 'Mandioca', 'Baião de dois'] },
  { id: 'f-frutas',   label: 'Frutas Prioritárias', items: ['Mamão', 'Kiwi', 'Banana', 'Morango', 'Melão', 'Maçã', 'Pera'] },
  { id: 'f-fibras',   label: 'Fibras e Constipação', items: ['Feijão', 'Frutas', 'Legumes', 'Vegetais', 'Água'], note: 'Se necessário: Psyllium 5 g inicialmente, podendo chegar a 10 g/dia. Sempre acompanhado de boa hidratação.' },
  { id: 'f-peixes',   label: 'Peixes e Ômega-3', items: ['Sardinha', 'Atum', 'Salmão', 'Cavalinha'], note: 'Idealmente 2 vezes por semana.' },
]

const MALE_LISTS: ListSection[] = [
  { id: 'm-prot-sub', label: 'Substituições das Proteínas', items: ['Frango desfiado', 'Carne magra', 'Patinho moído', 'Peixe', 'Sardinha', 'Atum', 'Fígado (1×/sem)', '3 ovos', 'Iogurte grego', 'Whey protein'] },
  { id: 'm-carb-sub', label: 'Substituições dos Carboidratos', items: ['Arroz branco', 'Macarrão', 'Cuscuz', 'Tapioca', 'Batata inglesa', 'Batata doce', 'Mandioca', 'Baião de dois'] },
  { id: 'm-frutas',   label: 'Frutas Prioritárias', items: ['Mamão', 'Kiwi', 'Banana', 'Morango', 'Melão', 'Maçã', 'Pera'] },
  { id: 'm-fibras',   label: 'Fibras e Constipação', items: ['Feijão', 'Frutas', 'Legumes', 'Vegetais', 'Água'], note: 'Se necessário: Psyllium 5 g inicialmente, podendo chegar a 10 g/dia. Sempre acompanhado de boa hidratação.' },
  { id: 'm-peixes',   label: 'Peixes e Ômega-3', items: ['Sardinha', 'Atum', 'Salmão', 'Cavalinha'], note: 'Idealmente 2 vezes por semana.' },
]

const VEGETARIAN_FEMALE_MEALS: MealSection[] = [
  {
    id: 'vtf-cafe', label: 'Café da Manhã', color: '#D97706', kcalShare: 0.22,
    options: [
      { items: ['1 pão francês', '2 ovos inteiros', '30 g de queijo branco', '1 fruta: mamão (120 g), banana (50 g), kiwi (90 g) ou melão'], protein: '25–30 g' },
      { items: ['2 fatias de pão integral', '2 ovos + 30 g ricota', '1 fruta'], protein: '25 g' },
      { label: 'Vitamina', items: ['200 ml de leite', '1 scoop de whey', '20 g de aveia', '1 fruta'], protein: '30–35 g' },
      { items: ['170 g de iogurte grego natural', '1 scoop de whey', 'Morangos ou banana'], protein: '35–40 g' },
      { label: 'Tapioca', items: ['2 tapiocas', '2 ovos mexidos', '30 g de queijo branco', '1 fruta'], protein: '28–33 g' },
    ],
  },
  {
    id: 'vtf-lanche-m', label: 'Lanche da Manhã', sublabel: 'Opcional', color: '#F59E0B', kcalShare: 0.09,
    options: [
      { items: ['1 scoop de whey com leite ou água'] },
      { items: ['1 iogurte proteico'] },
      { items: ['2 ovos cozidos'] },
      { items: ['1 fruta', '50 g de cottage ou ricota'], protein: '15–20 g' },
    ],
  },
  {
    id: 'vtf-almoco', label: 'Almoço', color: '#059669', kcalShare: 0.32,
    options: [
      { items: ['Arroz (90–120 g)', 'Feijão (80–100 g)', 'Tofu grelhado temperado (120 g)', 'Legumes cozidos', 'Salada'], protein: '30–35 g' },
      { items: ['Arroz (90–120 g)', 'Lentilha (80 g)', '2 ovos cozidos ou omelete', 'Legumes'], protein: '30–35 g' },
      { items: ['Arroz (90–120 g)', 'Grão-de-bico (80 g)', 'Tempeh (100 g)', 'Legumes e salada'], protein: '28–34 g' },
      { items: ['Macarrão (100 g)', 'Molho de tomate + soja texturizada (80 g)', 'Legumes'], protein: '25–30 g' },
      { items: ['Baião de dois (100 g)', '2 ovos ou tofu grelhado (100 g)', 'Legumes'] },
    ],
  },
  {
    id: 'vtf-lanche-t', label: 'Lanche da Tarde', sublabel: 'Opcional', color: '#0891B2', kcalShare: 0.09,
    options: [
      { items: ['1 scoop de whey', '1 fruta'] },
      { label: 'Sanduíche', items: ['2 fatias de pão integral', '50 g de ricota ou cottage', '1 ovo'] },
      { items: ['Iogurte proteico', '15 g de aveia'] },
      { items: ['2 ovos', '1 fruta'] },
    ],
  },
  {
    id: 'vtf-jantar', label: 'Jantar', color: '#7C3AED', kcalShare: 0.23,
    options: [
      { items: ['Arroz (100 g)', 'Tofu grelhado (120 g)', 'Legumes cozidos'], protein: '28–35 g' },
      { label: 'Omelete', items: ['3 ovos', 'Queijo branco (30 g)', 'Pequena porção de arroz ou batata'] },
      { items: ['Macarrão (100 g)', 'Molho de tomate com soja texturizada', 'Legumes'] },
      { label: 'Sanduíche', items: ['1 pão francês', '2 ovos mexidos', 'Queijo prato (20 g)', 'Salada'] },
    ],
  },
  {
    id: 'vtf-ceia', label: 'Ceia', sublabel: 'Somente se necessário', color: '#1E40AF', kcalShare: 0.05,
    options: [
      { items: ['1 scoop de whey com leite'] },
      { items: ['Iogurte grego (170 g)'] },
      { items: ['Cottage ou ricota (80 g)'] },
    ],
  },
]

const VEGETARIAN_MALE_MEALS: MealSection[] = [
  {
    id: 'vtm-cafe', label: 'Café da Manhã', color: '#D97706', kcalShare: 0.22,
    options: [
      { items: ['1 pão francês', '3 ovos inteiros', '30 g de queijo branco', '1 fruta: mamão (180 g), banana (70 g), kiwi (130 g) ou melão'], protein: '30 g' },
      { items: ['2 fatias de pão integral', '3 ovos + 30 g ricota', '20 g aveia', '1 fruta'], protein: '30–35 g' },
      { label: 'Vitamina', items: ['200 ml de leite', '1 scoop de whey', '40 g de aveia', '1 fruta'], protein: '35 g' },
      { items: ['170–200 g de iogurte grego natural', '1 scoop de whey', 'Morangos ou banana'], protein: '35–40 g' },
    ],
  },
  {
    id: 'vtm-lanche-m', label: 'Lanche da Manhã', sublabel: 'Opcional', color: '#F59E0B', kcalShare: 0.09,
    options: [
      { items: ['1 scoop de whey com água'] },
      { items: ['1 iogurte proteico'] },
      { items: ['2 ovos cozidos'] },
      { items: ['1 fruta', '50 g de cottage ou ricota'], protein: '15–25 g (média)' },
    ],
  },
  {
    id: 'vtm-almoco', label: 'Almoço', color: '#059669', kcalShare: 0.32,
    options: [
      { items: ['Arroz (130–180 g)', 'Feijão (100 g)', 'Tofu grelhado (150–180 g)', 'Legumes cozidos', 'Salada'], protein: '40–45 g' },
      { items: ['Arroz (130 g)', 'Lentilha (100 g)', '3 ovos cozidos ou omelete', 'Legumes'], protein: '38–42 g' },
      { items: ['Macarrão (150–180 g)', 'Molho de tomate + soja texturizada (120 g)', 'Legumes cozidos'] },
      { items: ['Baião de dois (180–220 g)', 'Tempeh (150 g)', 'Legumes', 'Salada'] },
      { items: ['Batata doce (150 g)', 'Grão-de-bico (100 g)', 'Tofu (150 g)', 'Legumes'] },
    ],
  },
  {
    id: 'vtm-lanche-t', label: 'Lanche da Tarde', sublabel: 'Opcional', color: '#0891B2', kcalShare: 0.09,
    options: [
      { items: ['1 scoop de whey', '1 fruta'] },
      { label: 'Sanduíche', items: ['2 fatias de pão integral', '60 g de ricota ou cottage', '1 ovo cozido'] },
      { items: ['Iogurte proteico', '15 g de aveia'] },
      { items: ['2–3 ovos', '1 fruta'] },
    ],
  },
  {
    id: 'vtm-jantar', label: 'Jantar', color: '#7C3AED', kcalShare: 0.23,
    options: [
      { items: ['Arroz (120–160 g)', 'Tofu ou tempeh (150–180 g)', 'Legumes cozidos'], protein: '38–45 g' },
      { label: 'Omelete', items: ['3 ovos + 3 claras', 'Queijo branco (30 g)', 'Batata (100 g)'] },
      { items: ['Macarrão (150 g)', 'Molho de tomate + soja texturizada (100 g)', 'Legumes'] },
      { label: 'Sanduíche', items: ['1 pão francês', '2 ovos mexidos', 'Queijo prato (30 g)', 'Salada'] },
    ],
  },
  {
    id: 'vtm-ceia', label: 'Ceia', sublabel: 'Somente se necessário', color: '#1E40AF', kcalShare: 0.05,
    options: [
      { items: ['1 scoop de whey com leite ou água'] },
      { items: ['200 ml de leite', '20 g de whey'] },
      { items: ['Iogurte proteico'] },
      { items: ['Cottage ou ricota (80 g)'] },
    ],
  },
]

const VEGAN_FEMALE_MEALS: MealSection[] = [
  {
    id: 'vgf-cafe', label: 'Café da Manhã', color: '#D97706', kcalShare: 0.22,
    options: [
      { label: 'Aveia cremosa', items: ['50 g de aveia', '200 ml de leite de aveia', '1 scoop de proteína vegetal', '1 fruta'], protein: '30–35 g' },
      { label: 'Smoothie proteico', items: ['200 ml de leite vegetal', '1 scoop de proteína vegetal', '20 g de pasta de amendoim', '1 banana'], protein: '28–32 g' },
      { label: 'Tapioca vegana', items: ['2 tapiocas', 'Pasta de amendoim (30 g)', '1 fruta', 'Sementes de chia (10 g)'], protein: '20–25 g' },
      { items: ['Pão integral (2 fatias)', 'Pasta de amendoim (30 g)', 'Banana', 'Sementes de linhaça (10 g)'], protein: '18–22 g' },
    ],
  },
  {
    id: 'vgf-lanche-m', label: 'Lanche da Manhã', sublabel: 'Opcional', color: '#F59E0B', kcalShare: 0.09,
    options: [
      { items: ['1 scoop de proteína vegetal com água ou leite vegetal'] },
      { items: ['Iogurte de coco (170 g)', 'Granola sem mel (20 g)'] },
      { items: ['1 fruta', 'Mix de castanhas (30 g)'] },
      { items: ['Edamame cozido (100 g)'], protein: '11 g' },
    ],
  },
  {
    id: 'vgf-almoco', label: 'Almoço', color: '#059669', kcalShare: 0.32,
    options: [
      { items: ['Arroz (90–120 g)', 'Feijão (80–100 g)', 'Tofu grelhado temperado (120 g)', 'Legumes cozidos', 'Salada'], protein: '30–35 g' },
      { items: ['Arroz (90 g)', 'Lentilha (80–100 g)', 'Tempeh (100 g)', 'Legumes cozidos'], protein: '32–37 g' },
      { items: ['Quinoa (80 g)', 'Grão-de-bico (80 g)', 'Tofu (100 g)', 'Legumes assados', 'Azeite'], protein: '28–33 g' },
      { items: ['Macarrão (100 g)', 'Bolonhesa de soja texturizada (80 g)', 'Legumes'], protein: '25–30 g' },
      { items: ['Batata doce (150 g)', 'Feijão preto (80 g)', 'Tempeh (100 g)', 'Couve refogada'], protein: '28–32 g' },
    ],
  },
  {
    id: 'vgf-lanche-t', label: 'Lanche da Tarde', sublabel: 'Opcional', color: '#0891B2', kcalShare: 0.09,
    options: [
      { items: ['1 scoop de proteína vegetal com leite vegetal', '1 fruta'] },
      { label: 'Sanduíche', items: ['2 fatias de pão integral', 'Homus (50 g)', 'Tomate e rúcula'] },
      { items: ['Iogurte de coco (170 g)', '15 g de chia ou linhaça'] },
      { items: ['Mix de castanhas e frutas secas (30 g)'] },
    ],
  },
  {
    id: 'vgf-jantar', label: 'Jantar', color: '#7C3AED', kcalShare: 0.23,
    options: [
      { items: ['Arroz (100 g)', 'Tofu grelhado com molho shoyu (120 g)', 'Brócolis e cenoura cozidos'], protein: '28–33 g' },
      { items: ['Macarrão (100 g)', 'Molho de tomate com soja texturizada (80 g)', 'Abobrinha e pimentão'], protein: '25–30 g' },
      { items: ['Batata doce (120 g)', 'Tempeh grelhado (100 g)', 'Couve-flor ou brócolis'], protein: '26–30 g' },
      { label: 'Bowl vegano', items: ['Quinoa (80 g)', 'Grão-de-bico (80 g)', 'Abacate (40 g)', 'Legumes', 'Molho de tahine'] },
    ],
  },
  {
    id: 'vgf-ceia', label: 'Ceia', sublabel: 'Somente se necessário', color: '#1E40AF', kcalShare: 0.05,
    options: [
      { items: ['1 scoop de proteína vegetal com leite de aveia ou água'] },
      { items: ['Iogurte de coco (170 g)'] },
      { items: ['Leite vegetal morno (200 ml)', 'Pasta de amendoim (20 g)'] },
    ],
  },
]

const VEGAN_MALE_MEALS: MealSection[] = [
  {
    id: 'vgm-cafe', label: 'Café da Manhã', color: '#D97706', kcalShare: 0.22,
    options: [
      { label: 'Aveia cremosa', items: ['70 g de aveia', '250 ml de leite de aveia', '1 scoop de proteína vegetal', '1 banana', '20 g de pasta de amendoim'], protein: '35–40 g' },
      { label: 'Smoothie proteico', items: ['250 ml de leite vegetal', '1–2 scoops de proteína vegetal', '30 g de pasta de amendoim', '1 banana'], protein: '35–40 g' },
      { label: 'Tapioca vegana', items: ['3 tapiocas', 'Pasta de amendoim (40 g)', '1 fruta', 'Sementes de chia (15 g)'], protein: '25–30 g' },
      { items: ['Pão integral (3 fatias)', '40 g de pasta de amendoim', 'Banana', 'Proteína vegetal (1 scoop) com água'], protein: '35 g' },
    ],
  },
  {
    id: 'vgm-lanche-m', label: 'Lanche da Manhã', sublabel: 'Opcional', color: '#F59E0B', kcalShare: 0.09,
    options: [
      { items: ['1–2 scoops de proteína vegetal com água ou leite vegetal'] },
      { items: ['Iogurte de coco (200 g)', 'Granola sem mel (30 g)'] },
      { items: ['Edamame cozido (150 g)', '1 fruta'], protein: '15 g' },
      { items: ['Mix de castanhas (40 g)', '1 fruta'] },
    ],
  },
  {
    id: 'vgm-almoco', label: 'Almoço', color: '#059669', kcalShare: 0.32,
    options: [
      { items: ['Arroz (130–180 g)', 'Feijão (100 g)', 'Tofu grelhado (150–180 g)', 'Legumes cozidos', 'Salada'], protein: '40–48 g' },
      { items: ['Arroz (130 g)', 'Lentilha (100 g)', 'Tempeh (150 g)', 'Legumes cozidos'], protein: '40–45 g' },
      { items: ['Quinoa (100 g)', 'Grão-de-bico (100 g)', 'Tofu (150 g)', 'Legumes assados', 'Azeite'], protein: '38–42 g' },
      { items: ['Macarrão (150–180 g)', 'Bolonhesa de soja texturizada (120 g)', 'Legumes cozidos'], protein: '35–40 g' },
      { items: ['Batata doce (200 g)', 'Feijão preto (100 g)', 'Tempeh (150 g)', 'Couve refogada'], protein: '38–42 g' },
    ],
  },
  {
    id: 'vgm-lanche-t', label: 'Lanche da Tarde', sublabel: 'Opcional', color: '#0891B2', kcalShare: 0.09,
    options: [
      { items: ['1–2 scoops de proteína vegetal com leite vegetal', '1 fruta'] },
      { label: 'Sanduíche', items: ['3 fatias de pão integral', 'Homus (70 g)', 'Tomate e rúcula'] },
      { items: ['Iogurte de coco (200 g)', '20 g de chia ou linhaça', '1 fruta'] },
      { items: ['Mix de castanhas (50 g)', '1 fruta'] },
    ],
  },
  {
    id: 'vgm-jantar', label: 'Jantar', color: '#7C3AED', kcalShare: 0.23,
    options: [
      { items: ['Arroz (120–160 g)', 'Tofu ou tempeh (150–180 g)', 'Legumes cozidos'], protein: '38–45 g' },
      { items: ['Macarrão (150 g)', 'Molho de tomate com soja texturizada (120 g)', 'Legumes'], protein: '35–40 g' },
      { items: ['Batata doce (180 g)', 'Tempeh (150 g)', 'Brócolis e couve-flor cozidos'], protein: '34–38 g' },
      { label: 'Bowl vegano', items: ['Quinoa (100 g)', 'Grão-de-bico (100 g)', 'Abacate (60 g)', 'Legumes', 'Molho de tahine'] },
    ],
  },
  {
    id: 'vgm-ceia', label: 'Ceia', sublabel: 'Somente se necessário', color: '#1E40AF', kcalShare: 0.05,
    options: [
      { items: ['1 scoop de proteína vegetal com leite de aveia ou água'] },
      { items: ['250 ml de leite vegetal', '30 g de pasta de amendoim'] },
      { items: ['Iogurte de coco (200 g)'] },
    ],
  },
]

const VEGETARIAN_LISTS: ListSection[] = [
  { id: 'vt-prot-sub', label: 'Fontes de Proteína', items: ['Ovos inteiros', 'Clara de ovo', 'Tofu', 'Tempeh', 'Soja texturizada (PTS)', 'Cottage', 'Ricota', 'Queijo branco', 'Iogurte grego', 'Whey protein', 'Lentilha', 'Grão-de-bico', 'Feijão'] },
  { id: 'vt-carb-sub', label: 'Carboidratos', items: ['Arroz branco ou integral', 'Macarrão', 'Pão integral', 'Tapioca', 'Batata doce', 'Mandioca', 'Aveia', 'Quinoa'] },
  { id: 'vt-frutas',  label: 'Frutas Prioritárias', items: ['Mamão', 'Kiwi', 'Banana', 'Morango', 'Melão', 'Maçã', 'Pera'] },
  { id: 'vt-fibras',  label: 'Fibras e Constipação', items: ['Feijão', 'Lentilha', 'Grão-de-bico', 'Frutas', 'Legumes', 'Vegetais', 'Água'], note: 'Se necessário: Psyllium 5 g inicialmente, podendo chegar a 10 g/dia.' },
  { id: 'vt-omega3',  label: 'Ômega-3 (sem peixe)', items: ['Linhaça', 'Chia', 'Nozes', 'Edamame'], note: 'Consuma diariamente em pelo menos uma das refeições.' },
]

const VEGAN_LISTS: ListSection[] = [
  { id: 'vg-prot-sub',  label: 'Fontes de Proteína Vegetal', items: ['Tofu', 'Tempeh', 'Soja texturizada (PTS)', 'Proteína de ervilha', 'Proteína de arroz', 'Lentilha', 'Grão-de-bico', 'Feijão', 'Edamame', 'Quinoa', 'Seitan'] },
  { id: 'vg-carb-sub',  label: 'Carboidratos', items: ['Arroz branco ou integral', 'Macarrão', 'Pão integral', 'Batata doce', 'Aveia', 'Quinoa', 'Tapioca'] },
  { id: 'vg-gorduras',  label: 'Gorduras Boas', items: ['Azeite extra virgem', 'Abacate', 'Pasta de amendoim', 'Castanhas', 'Nozes', 'Amêndoas', 'Sementes de girassol', 'Tahine'] },
  { id: 'vg-latic-veg', label: 'Laticínios Vegetais', items: ['Leite de aveia', 'Leite de amêndoa', 'Leite de coco', 'Iogurte de coco'] },
  { id: 'vg-omega3',    label: 'Ômega-3 e Micronutrientes', items: ['Linhaça', 'Chia', 'Nozes', 'Algas marinhas'], note: 'Considere suplementar B12, vitamina D, zinco e ferro — consulte seu médico.' },
]

const LOW_HUNGER_MEALS: MealSection[] = [
  {
    id: 'lh-cafe', label: 'Café da Manhã', color: '#D97706', kcalShare: 0,
    options: [
      { items: ['170 g de iogurte grego natural', '1 scoop de whey', '1 fruta pequena'], protein: '35–40 g' },
      { items: ['1 ovo mexido', '1 fatia de pão integral', '1 fruta pequena'], protein: '15–20 g' },
    ],
  },
  {
    id: 'lh-almoco', label: 'Almoço', color: '#059669', kcalShare: 0,
    options: [
      { items: ['Arroz branco (80 g)', 'Frango desfiado (100 g)', 'Legumes cozidos (pouca fibra)'], protein: '25–30 g' },
      { items: ['Caldo de frango com frango desfiado e macarrão (80 g)'], protein: '20–25 g' },
    ],
  },
  {
    id: 'lh-jantar', label: 'Jantar', color: '#7C3AED', kcalShare: 0,
    options: [
      { items: ['170 g de iogurte grego', '1 scoop de whey', '1 banana', '20 g de aveia'], protein: '35–40 g' },
      { items: ['Omelete (2 ovos)', 'Pequena porção de arroz ou batata'] },
    ],
  },
]

const VEGETARIAN_LOW_HUNGER_MEALS: MealSection[] = [
  {
    id: 'lh-cafe', label: 'Café da Manhã', color: '#D97706', kcalShare: 0,
    options: [
      { items: ['170 g de iogurte grego natural', '1 scoop de whey', '1 fruta pequena'], protein: '35–40 g' },
      { items: ['Omelete de 2 ovos', '1 fatia de pão integral', '1 fruta pequena'], protein: '18–22 g' },
    ],
  },
  {
    id: 'lh-almoco', label: 'Almoço', color: '#059669', kcalShare: 0,
    options: [
      { items: ['Arroz branco (80 g)', 'Tofu macio cozido (100 g)', 'Legumes cozidos macios (pouca fibra)'], protein: '20–25 g' },
      { items: ['Sopa de legumes com lentilha vermelha (80 g) e arroz (60 g)'], protein: '15–18 g' },
    ],
  },
  {
    id: 'lh-jantar', label: 'Jantar', color: '#7C3AED', kcalShare: 0,
    options: [
      { items: ['170 g de iogurte grego', '1 scoop de whey', '1 banana', '20 g de aveia'], protein: '35–40 g' },
      { items: ['Omelete (2 ovos)', 'Queijo branco (30 g)', 'Pequena porção de arroz'] },
    ],
  },
]

const VEGAN_LOW_HUNGER_MEALS: MealSection[] = [
  {
    id: 'lh-cafe', label: 'Café da Manhã', color: '#D97706', kcalShare: 0,
    options: [
      { items: ['1 scoop de proteína vegetal com 200 ml de leite de aveia', '1 fruta pequena'], protein: '25–30 g' },
      { items: ['50 g de aveia cozida com leite vegetal', '1 banana amassada'], protein: '10–12 g' },
    ],
  },
  {
    id: 'lh-almoco', label: 'Almoço', color: '#059669', kcalShare: 0,
    options: [
      { items: ['Arroz branco (80 g)', 'Tofu macio (100 g)', 'Legumes cozidos macios (cenoura, abobrinha)'], protein: '18–22 g' },
      { items: ['Caldo de legumes com lentilha vermelha (80 g) e macarrão (60 g)'], protein: '14–17 g' },
    ],
  },
  {
    id: 'lh-jantar', label: 'Jantar', color: '#7C3AED', kcalShare: 0,
    options: [
      { items: ['Iogurte de coco (170 g)', '1 scoop de proteína vegetal', '1 banana', '20 g de aveia'], protein: '28–32 g' },
      { items: ['250 ml de leite de aveia morno', '30 g de pasta de amendoim', '1 banana pequena'] },
    ],
  },
]

const PROTOCOL_PHASES: { id: ProtocolPhase; label: string; sub: string }[] = [
  { id: 'beginning',   label: 'Início',        sub: 'Semanas 1–4 · adaptação à medicação' },
  { id: 'adaptation',  label: 'Adaptação',     sub: 'Semanas 5–12 · dose em escalonamento' },
  { id: 'maintenance', label: 'Manutenção',    sub: 'Acima de 3 meses · dose estável' },
]

const MEAL_FREQUENCY: { id: MealFrequency; label: string; sub: string }[] = [
  { id: '2',   label: '2 refeições',   sub: 'Pouca fome, consigo comer poucas vezes' },
  { id: '3',   label: '3 refeições',   sub: 'Café, almoço e jantar' },
  { id: '4',   label: '4 refeições',   sub: 'Café, almoço, lanche e jantar' },
  { id: '5-6', label: '5–6 refeições', sub: 'Incluo lanches da manhã e/ou ceia' },
]

const CHALLENGES = [
  { id: 'nausea',             label: 'Náusea ou enjoo' },
  { id: 'constipation',       label: 'Constipação intestinal' },
  { id: 'low_appetite',       label: 'Falta de apetite intensa' },
  { id: 'protein_difficulty', label: 'Dificuldade em bater a proteína' },
  { id: 'reflux',             label: 'Refluxo ou empachamento' },
  { id: 'none',               label: 'Nenhum por enquanto' },
]

const COMORBIDITIES = [
  { id: 'diabetes2',     label: 'Diabetes tipo 2' },
  { id: 'prediabetes',   label: 'Pré-diabetes' },
  { id: 'hypertension',  label: 'Hipertensão arterial' },
  { id: 'hypothyroid',   label: 'Hipotireoidismo' },
  { id: 'dyslipidemia',  label: 'Dislipidemia (colesterol/triglicérides)' },
  { id: 'none',          label: 'Nenhuma' },
]

const RESTRICTIONS = [
  { id: 'none',       label: 'Nenhuma' },
  { id: 'lactose',    label: 'Intolerância à lactose' },
  { id: 'gluten',     label: 'Intolerância ao glúten' },
  { id: 'vegetarian', label: 'Vegetariano' },
  { id: 'vegan',      label: 'Vegano' },
]

const ACTIVITY_OPTIONS: { id: Activity; label: string; sub: string }[] = [
  { id: 'sedentary',   label: 'Sedentário',    sub: 'Pouco ou nenhum exercício' },
  { id: 'light',       label: 'Leve',          sub: '1–3× por semana' },
  { id: 'moderate',    label: 'Moderado',      sub: '3–5× por semana' },
  { id: 'active',      label: 'Ativo',         sub: '6–7× por semana' },
  { id: 'very_active', label: 'Muito ativo',   sub: 'Exercício intenso diário' },
]

// ── Sub-components ────────────────────────────────────────────────────────────

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: '10px 8px', borderRadius: '12px', cursor: 'pointer',
        fontFamily: 'Inter, -apple-system, sans-serif', fontWeight: 700, fontSize: '13px',
        border: active ? '2px solid #16A34A' : '1.5px solid var(--border)',
        background: active ? 'rgba(22,163,74,0.12)' : 'var(--surface-2)',
        color: active ? '#16A34A' : 'var(--text-secondary)',
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  )
}

function Divider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 2px' }}>
      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
      <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap', margin: 0 }}>
        {label}
      </p>
      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function FoodGuide() {
  // ── Profile ──
  const [profile, setProfile] = useState<DietProfile | null>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') }
    catch { return null }
  })

  // ── Food log ──
  const [log, setLog] = useState<FoodLog>(() => {
    try { return JSON.parse(localStorage.getItem(LOG_KEY) || '{}') }
    catch { return {} }
  })

  // ── Quiz form ──
  const [step, setStep]               = useState(1)
  const [formSex, setFormSex]         = useState<DietSex | null>(() => {
    try {
      const p = JSON.parse(localStorage.getItem('tizetrack_profile') || 'null')
      if (p?.sex === 'male' || p?.sex === 'M') return 'M'
      if (p?.sex === 'female' || p?.sex === 'F') return 'F'
    } catch { /* */ }
    return null
  })
  const [formAge, setFormAge]         = useState(() => {
    try { return JSON.parse(localStorage.getItem('tizetrack_profile') || 'null')?.age?.toString() || '' }
    catch { return '' }
  })
  const [formHeight, setFormHeight]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('tizetrack_profile') || 'null')?.height?.toString() || '' }
    catch { return '' }
  })
  const [formWeight, setFormWeight]   = useState(() => {
    try {
      const p = JSON.parse(localStorage.getItem('tizetrack_profile') || 'null')
      return (p?.currentWeight ?? p?.startWeight)?.toString() || ''
    } catch { return '' }
  })
  const [formGoalWeight, setFormGoalWeight] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tizetrack_profile') || 'null')?.goalWeight?.toString() || '' }
    catch { return '' }
  })
  const [formActivity, setFormActivity]       = useState<Activity | null>(null)
  const [formPhase, setFormPhase]             = useState<ProtocolPhase | null>(null)
  const [formMealFreq, setFormMealFreq]       = useState<MealFrequency | null>(null)
  const [formChallenges, setFormChallenges]   = useState<string[]>([])
  const [formComorbidities, setFormComorbidities] = useState<string[]>([])
  const [formRestrictions, setFormRestrictions]   = useState<string[]>([])

  // ── AI Diet ──
  const [aiDiet, setAiDiet]       = useState<AIDietCache | null>(() => {
    try { return JSON.parse(localStorage.getItem(AI_DIET_KEY) || 'null') }
    catch { return null }
  })
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError]     = useState('')

  async function generateDiet(p: DietProfile) {
    setAiLoading(true)
    setAiError('')
    try {
      const res = await fetch('/api/generate-diet', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(p),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as { meals?: MealSection[]; lowHunger?: MealSection[]; lists?: ListSection[]; error?: string }
      if (data.error) throw new Error(data.error)
      const cache: AIDietCache = {
        meals:      data.meals ?? [],
        lowHunger:  data.lowHunger ?? [],
        lists:      data.lists ?? [],
        profileHash: dietProfileHash(p),
      }
      localStorage.setItem(AI_DIET_KEY, JSON.stringify(cache))
      setAiDiet(cache)
    } catch (err) {
      console.error('[generateDiet]', err)
      setAiError('Não foi possível gerar o plano com IA. Usando plano padrão.')
    } finally {
      setAiLoading(false)
    }
  }

  // Auto-generate when profile exists but AI diet is missing or stale
  useEffect(() => {
    if (!profile) return
    const hash = dietProfileHash(profile)
    if (!aiDiet || aiDiet.profileHash !== hash) {
      generateDiet(profile)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.sex, profile?.mealFrequency, profile?.restrictions?.join(','), profile?.goal, profile?.dailyKcal])

  // ── Plan view ──
  const [activeTab, setActiveTab]   = useState<DietTab>('hoje')
  const [expanded, setExpanded]     = useState<Set<string>>(new Set())
  const [manualName, setManualName] = useState('')
  const [manualKcal, setManualKcal] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)

  // ── Log helpers ──
  const today    = toDateStr()
  const dayLog   = log[today] ?? { meals: [], manual: [] }

  function saveLog(next: DayLog) {
    const updated = { ...log, [today]: next }
    setLog(updated)
    localStorage.setItem(LOG_KEY, JSON.stringify(updated))
  }

  function toggleMeal(mealId: string) {
    const meals = dayLog.meals.includes(mealId)
      ? dayLog.meals.filter(m => m !== mealId)
      : [...dayLog.meals, mealId]
    saveLog({ ...dayLog, meals })
  }

  function addManual() {
    const name = manualName.trim()
    const kcal = parseInt(manualKcal)
    if (!name || !kcal || kcal <= 0) return
    const item: ManualItem = { id: Date.now().toString(), name, kcal }
    saveLog({ ...dayLog, manual: [...dayLog.manual, item] })
    setManualName(''); setManualKcal('')
    nameRef.current?.focus()
  }

  function removeManual(id: string) {
    saveLog({ ...dayLog, manual: dayLog.manual.filter(m => m.id !== id) })
  }

  const step1Ok = !!(formSex && formAge && formHeight && formWeight && formGoalWeight &&
    Number(formAge) > 0 && Number(formHeight) > 0 && Number(formWeight) > 0 && Number(formGoalWeight) > 0)
  const step2Ok = !!formActivity
  const step3Ok = !!(formPhase && formMealFreq)

  function inferGoal(weight: number, goalWeight: number): Goal {
    const diff = weight - goalWeight
    if (diff > 2)  return 'lose'
    if (diff < -2) return 'gain'
    return 'maintain'
  }

  function toggleMulti(list: string[], setList: (v: string[]) => void, id: string, noneId = 'none') {
    if (id === noneId) { setList([noneId]); return }
    const without = list.filter(r => r !== noneId)
    setList(without.includes(id) ? without.filter(r => r !== id) : [...without, id])
  }

  function saveProfile() {
    if (!step1Ok || !step2Ok || !step3Ok || !formSex || !formActivity || !formPhase || !formMealFreq) return
    const w = Number(formWeight), gw = Number(formGoalWeight)
    const draft = {
      sex: formSex, age: Number(formAge), height: Number(formHeight),
      weight: w, goalWeight: gw,
      goal: inferGoal(w, gw), activity: formActivity,
      protocolPhase: formPhase, mealFrequency: formMealFreq,
      challenges:    formChallenges.length    ? formChallenges    : ['none'],
      comorbidities: formComorbidities.length ? formComorbidities : ['none'],
      restrictions:  formRestrictions.length  ? formRestrictions  : ['none'],
      dailyKcal: 0,
    }
    const p: DietProfile = { ...draft, dailyKcal: calcTDEE(draft) }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
    localStorage.removeItem(AI_DIET_KEY)
    setAiDiet(null)
    setProfile(p)
    setExpanded(new Set())
    setActiveTab('hoje')
    generateDiet(p)
  }

  function resetProfile() {
    localStorage.removeItem(STORAGE_KEY)
    setProfile(null); setStep(1)
    setFormActivity(null); setFormPhase(null); setFormMealFreq(null)
    setFormChallenges([]); setFormComorbidities([]); setFormRestrictions([])
  }

  function toggle(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  // ── Sub-components (defined inside to access toggle/state) ──

  function MealCard({ section }: { section: MealSection }) {
    const isOpen = expanded.has(section.id)
    return (
      <div style={{
        borderRadius: '16px',
        border: `1.5px solid ${isOpen ? section.color + '35' : 'var(--border)'}`,
        background: isOpen ? section.color + '07' : 'var(--surface)',
        overflow: 'hidden', transition: 'all 0.2s ease', boxShadow: 'var(--card-shadow)',
      }}>
        <button
          onClick={() => toggle(section.id)}
          style={{ width: '100%', padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'Inter, -apple-system, sans-serif' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, background: section.color }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <p style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>{section.label}</p>
                {section.sublabel && (
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '99px', background: section.color + '18', color: section.color }}>
                    {section.sublabel}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, marginTop: '1px' }}>
                {section.options.length} {section.options.length === 1 ? 'opção' : 'opções'}
              </p>
            </div>
          </div>
          <span style={{ color: 'var(--text-muted)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', display: 'inline-flex', flexShrink: 0 }}>
            <ChevronDown size={16} strokeWidth={2} />
          </span>
        </button>
        {isOpen && (
          <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {section.options.map((opt, idx) => (
              <div key={idx} style={{ padding: '10px 12px', borderRadius: '11px', background: 'var(--surface)', border: `1px solid ${section.color}22` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '6px' }}>
                  <span style={{ width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0, background: section.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color: section.color }}>
                    {idx + 1}
                  </span>
                  {opt.label && <span style={{ fontSize: '11px', fontWeight: 700, color: section.color }}>{opt.label}</span>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', paddingLeft: '4px' }}>
                  {opt.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px' }}>
                      <span style={{ width: '4px', height: '4px', borderRadius: '50%', flexShrink: 0, background: section.color + 'aa', marginTop: '7px' }} />
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>{item}</p>
                    </div>
                  ))}
                </div>
                {opt.protein && (
                  <div style={{ marginTop: '8px', paddingTop: '7px', borderTop: `1px solid ${section.color}18` }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: section.color }}>Proteína aprox.: {opt.protein}</span>
                  </div>
                )}
                {opt.note && <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', fontStyle: 'italic', lineHeight: 1.4, margin: '6px 0 0' }}>{opt.note}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  function ListCard({ section }: { section: ListSection }) {
    const isOpen = expanded.has(section.id)
    return (
      <div style={{ borderRadius: '16px', border: `1.5px solid ${isOpen ? 'rgba(22,163,74,0.22)' : 'var(--border)'}`, background: isOpen ? 'rgba(22,163,74,0.04)' : 'var(--surface)', overflow: 'hidden', transition: 'all 0.2s ease', boxShadow: 'var(--card-shadow)' }}>
        <button onClick={() => toggle(section.id)} style={{ width: '100%', padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'Inter, -apple-system, sans-serif' }}>
          <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', margin: 0 }}>{section.label}</p>
          <span style={{ color: 'var(--text-muted)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', display: 'inline-flex', flexShrink: 0 }}>
            <ChevronDown size={16} strokeWidth={2} />
          </span>
        </button>
        {isOpen && (
          <div style={{ padding: '0 14px 14px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {section.items.map(item => (
                <span key={item} style={{ padding: '4px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600, background: 'rgba(22,163,74,0.12)', color: '#16A34A', border: '1px solid rgba(22,163,74,0.20)' }}>
                  {item}
                </span>
              ))}
            </div>
            {section.note && <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '10px', lineHeight: 1.5 }}>{section.note}</p>}
          </div>
        )}
      </div>
    )
  }

  // ── QUIZ ─────────────────────────────────────────────────────────────────────

  if (!profile) {
    const inputStyle: CSSProperties = {
      width: '100%', padding: '11px 14px', borderRadius: '12px',
      border: '1.5px solid var(--border)', background: 'var(--surface-2)',
      fontFamily: 'Inter, -apple-system, sans-serif', fontSize: '14px', fontWeight: 600,
      color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box',
    }
    const labelStyle: CSSProperties = {
      fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)',
      textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px', display: 'block',
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Banner */}
        <div style={{ background: 'linear-gradient(135deg, #16653A 0%, #0E4A29 100%)', borderRadius: '20px', padding: '18px 20px', color: '#fff', boxShadow: '0 8px 28px rgba(22,101,58,0.35)' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
            Avaliação nutricional · Passo {step} de 4
          </p>
          <p style={{ fontSize: '17px', fontWeight: 800, lineHeight: 1.3, letterSpacing: '-0.3px', marginBottom: '4px' }}>
            {step === 1 ? 'Seus dados corporais' : step === 2 ? 'Nível de atividade' : step === 3 ? 'Sobre o protocolo' : 'Restrições alimentares'}
          </p>
          {/* Step indicator */}
          <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
            {[1,2,3,4].map(s => (
              <div key={s} style={{ height: '4px', flex: 1, borderRadius: '99px', background: s <= step ? '#fff' : 'rgba(255,255,255,0.3)', transition: 'all 0.3s' }} />
            ))}
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Step 1 */}
          {step === 1 && (
            <>
              <div>
                <span style={labelStyle}>Sexo biológico</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Pill active={formSex === 'M'} onClick={() => setFormSex('M')}>Masculino</Pill>
                  <Pill active={formSex === 'F'} onClick={() => setFormSex('F')}>Feminino</Pill>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <span style={labelStyle}>Idade</span>
                  <input style={inputStyle} type="number" placeholder="Ex: 35" min={10} max={100} value={formAge} onChange={e => setFormAge(e.target.value)} />
                </div>
                <div>
                  <span style={labelStyle}>Altura (cm)</span>
                  <input style={inputStyle} type="number" placeholder="Ex: 168" min={100} max={250} value={formHeight} onChange={e => setFormHeight(e.target.value)} />
                </div>
                <div>
                  <span style={labelStyle}>Peso atual (kg)</span>
                  <input style={inputStyle} type="number" placeholder="Ex: 82" min={30} max={300} step={0.1} value={formWeight} onChange={e => setFormWeight(e.target.value)} />
                </div>
                <div>
                  <span style={labelStyle}>Peso objetivo (kg)</span>
                  <input style={inputStyle} type="number" placeholder="Ex: 65" min={30} max={300} step={0.1} value={formGoalWeight} onChange={e => setFormGoalWeight(e.target.value)} />
                </div>
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!step1Ok}
                style={{
                  width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
                  fontFamily: 'Inter, -apple-system, sans-serif', fontWeight: 800, fontSize: '15px',
                  cursor: step1Ok ? 'pointer' : 'not-allowed',
                  background: step1Ok ? 'linear-gradient(135deg, #16653A 0%, #059669 100%)' : 'var(--surface-3)',
                  color: step1Ok ? '#fff' : 'var(--text-muted)',
                  opacity: step1Ok ? 1 : 0.5, transition: 'all 0.2s',
                  boxShadow: step1Ok ? '0 4px 14px rgba(22,101,58,0.4)' : 'none',
                }}
              >
                Próximo
              </button>
            </>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <>
              <div>
                <span style={labelStyle}>Nível de atividade física</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {ACTIVITY_OPTIONS.map(a => (
                    <button
                      key={a.id}
                      onClick={() => setFormActivity(a.id)}
                      style={{
                        padding: '11px 14px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                        fontFamily: 'Inter, -apple-system, sans-serif', textAlign: 'left',
                        background: formActivity === a.id ? 'rgba(22,163,74,0.12)' : 'var(--surface-2)',
                        outline: formActivity === a.id ? '2px solid #16A34A' : '1.5px solid var(--border)',
                        transition: 'all 0.15s',
                      }}
                    >
                      <p style={{ fontWeight: 700, fontSize: '13px', color: formActivity === a.id ? '#16A34A' : 'var(--text-primary)', margin: 0 }}>{a.label}</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0' }}>{a.sub}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1.5px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', fontFamily: 'Inter, -apple-system, sans-serif', fontWeight: 700, fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Voltar
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!step2Ok}
                  style={{
                    flex: 2, padding: '12px', borderRadius: '12px', border: 'none',
                    fontFamily: 'Inter, -apple-system, sans-serif', fontWeight: 800, fontSize: '14px',
                    cursor: step2Ok ? 'pointer' : 'not-allowed',
                    background: step2Ok ? 'linear-gradient(135deg, #16653A 0%, #059669 100%)' : 'var(--surface-3)',
                    color: step2Ok ? '#fff' : 'var(--text-muted)',
                    opacity: step2Ok ? 1 : 0.5, transition: 'all 0.2s',
                  }}
                >
                  Próximo
                </button>
              </div>
            </>
          )}

          {/* Step 3 — Protocol */}
          {step === 3 && (
            <>
              <div>
                <span style={labelStyle}>Fase do protocolo</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {PROTOCOL_PHASES.map(ph => (
                    <button
                      key={ph.id}
                      onClick={() => setFormPhase(ph.id)}
                      style={{
                        padding: '11px 14px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                        fontFamily: 'Inter, -apple-system, sans-serif', textAlign: 'left',
                        background: formPhase === ph.id ? 'rgba(22,163,74,0.12)' : 'var(--surface-2)',
                        outline: formPhase === ph.id ? '2px solid #16A34A' : '1.5px solid var(--border)',
                        transition: 'all 0.15s',
                      }}
                    >
                      <p style={{ fontWeight: 700, fontSize: '13px', color: formPhase === ph.id ? '#16A34A' : 'var(--text-primary)', margin: 0 }}>{ph.label}</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0' }}>{ph.sub}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span style={labelStyle}>Quantas refeições costuma fazer</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {MEAL_FREQUENCY.map(mf => (
                    <button
                      key={mf.id}
                      onClick={() => setFormMealFreq(mf.id)}
                      style={{
                        padding: '11px 14px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                        fontFamily: 'Inter, -apple-system, sans-serif', textAlign: 'left',
                        background: formMealFreq === mf.id ? 'rgba(22,163,74,0.12)' : 'var(--surface-2)',
                        outline: formMealFreq === mf.id ? '2px solid #16A34A' : '1.5px solid var(--border)',
                        transition: 'all 0.15s',
                      }}
                    >
                      <p style={{ fontWeight: 700, fontSize: '13px', color: formMealFreq === mf.id ? '#16A34A' : 'var(--text-primary)', margin: 0 }}>{mf.label}</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0' }}>{mf.sub}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span style={labelStyle}>Principais desafios</span>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 8px' }}>Selecione todos que se aplicam</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {CHALLENGES.map(c => {
                    const active = formChallenges.includes(c.id)
                    return (
                      <button key={c.id} onClick={() => toggleMulti(formChallenges, setFormChallenges, c.id)}
                        style={{ padding: '10px 14px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontFamily: 'Inter, -apple-system, sans-serif', textAlign: 'left', background: active ? 'rgba(22,163,74,0.12)' : 'var(--surface-2)', outline: active ? '2px solid #16A34A' : '1.5px solid var(--border)', fontWeight: 700, fontSize: '13px', color: active ? '#16A34A' : 'var(--text-primary)', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {c.label}
                        {active && <Check size={14} strokeWidth={3} />}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <span style={labelStyle}>Condições de saúde</span>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 8px' }}>Selecione todas que se aplicam</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {COMORBIDITIES.map(c => {
                    const active = formComorbidities.includes(c.id)
                    return (
                      <button key={c.id} onClick={() => toggleMulti(formComorbidities, setFormComorbidities, c.id)}
                        style={{ padding: '10px 14px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontFamily: 'Inter, -apple-system, sans-serif', textAlign: 'left', background: active ? 'rgba(22,163,74,0.12)' : 'var(--surface-2)', outline: active ? '2px solid #16A34A' : '1.5px solid var(--border)', fontWeight: 700, fontSize: '13px', color: active ? '#16A34A' : 'var(--text-primary)', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {c.label}
                        {active && <Check size={14} strokeWidth={3} />}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setStep(2)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1.5px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', fontFamily: 'Inter, -apple-system, sans-serif', fontWeight: 700, fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Voltar
                </button>
                <button
                  onClick={() => setStep(4)}
                  disabled={!step3Ok}
                  style={{
                    flex: 2, padding: '12px', borderRadius: '12px', border: 'none',
                    fontFamily: 'Inter, -apple-system, sans-serif', fontWeight: 800, fontSize: '14px',
                    cursor: step3Ok ? 'pointer' : 'not-allowed',
                    background: step3Ok ? 'linear-gradient(135deg, #16653A 0%, #059669 100%)' : 'var(--surface-3)',
                    color: step3Ok ? '#fff' : 'var(--text-muted)',
                    opacity: step3Ok ? 1 : 0.5, transition: 'all 0.2s',
                  }}
                >
                  Próximo
                </button>
              </div>
            </>
          )}

          {/* Step 4 — Restrictions */}
          {step === 4 && (
            <>
              <div>
                <span style={labelStyle}>Restrições alimentares</span>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>Selecione todas que se aplicam</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {RESTRICTIONS.map(r => {
                    const active = formRestrictions.includes(r.id)
                    return (
                      <button
                        key={r.id}
                        onClick={() => toggleMulti(formRestrictions, setFormRestrictions, r.id)}
                        style={{
                          padding: '11px 14px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                          fontFamily: 'Inter, -apple-system, sans-serif', textAlign: 'left',
                          background: active ? 'rgba(22,163,74,0.12)' : 'var(--surface-2)',
                          outline: active ? '2px solid #16A34A' : '1.5px solid var(--border)',
                          fontWeight: 700, fontSize: '13px', color: active ? '#16A34A' : 'var(--text-primary)',
                          transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}
                      >
                        {r.label}
                        {active && <Check size={14} strokeWidth={3} />}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setStep(3)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1.5px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', fontFamily: 'Inter, -apple-system, sans-serif', fontWeight: 700, fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Voltar
                </button>
                <button
                  onClick={saveProfile}
                  style={{
                    flex: 2, padding: '12px', borderRadius: '12px', border: 'none',
                    fontFamily: 'Inter, -apple-system, sans-serif', fontWeight: 800, fontSize: '14px',
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, #16653A 0%, #059669 100%)',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                    boxShadow: '0 4px 14px rgba(22,101,58,0.4)',
                  }}
                >
                  <Utensils size={15} strokeWidth={2.5} />
                  Gerar meu plano
                </button>
              </div>
            </>
          )}
        </div>

        <div className="card-warning">
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <Info size={13} strokeWidth={2} style={{ flexShrink: 0, marginTop: '1px', color: 'var(--warn-text)' }} />
            <p style={{ fontSize: '11px', color: 'var(--warn-text)', lineHeight: 1.6, margin: 0 }}>
              Plano elaborado por nutricionista para uso com Tirzepatida. Não substitui acompanhamento nutricional individualizado.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── PLAN VIEW ────────────────────────────────────────────────────────────────

  const _aiMatch = !!(aiDiet && aiDiet.profileHash === dietProfileHash(profile))
  const isVegan = profile.restrictions.includes('vegan')
  const isVegetarian = profile.restrictions.includes('vegetarian')
  const _staticBase = isVegan
    ? (profile.sex === 'F' ? VEGAN_FEMALE_MEALS : VEGAN_MALE_MEALS)
    : isVegetarian
      ? (profile.sex === 'F' ? VEGETARIAN_FEMALE_MEALS : VEGETARIAN_MALE_MEALS)
      : (profile.sex === 'F' ? FEMALE_MEALS : MALE_MEALS)
  const lists = _aiMatch ? aiDiet!.lists : (isVegan ? VEGAN_LISTS : isVegetarian ? VEGETARIAN_LISTS : (profile.sex === 'F' ? FEMALE_LISTS : MALE_LISTS))
  const lowHungerMeals = _aiMatch ? aiDiet!.lowHunger : (isVegan ? VEGAN_LOW_HUNGER_MEALS : isVegetarian ? VEGETARIAN_LOW_HUNGER_MEALS : LOW_HUNGER_MEALS)
  const FREQ_SUFFIXES: Record<MealFrequency, string[]> = {
    '2':   ['-cafe', '-almoco'],
    '3':   ['-cafe', '-almoco', '-jantar'],
    '4':   ['-cafe', '-almoco', '-lanche-t', '-jantar'],
    '5-6': ['-cafe', '-lanche-m', '-almoco', '-lanche-t', '-jantar', '-ceia'],
  }
  const meals = _aiMatch ? aiDiet!.meals : _staticBase.filter(m =>
    (FREQ_SUFFIXES[profile.mealFrequency] ?? FREQ_SUFFIXES['5-6']).some(s => m.id.endsWith(s))
  )

  // Calorie stats
  const mealKcalMap: Record<string, number> = {}
  meals.forEach(m => { mealKcalMap[m.id] = Math.round(profile.dailyKcal * m.kcalShare) })

  const mealConsumed   = dayLog.meals.reduce((acc, id) => acc + (mealKcalMap[id] ?? 0), 0)
  const manualConsumed = dayLog.manual.reduce((acc, m) => acc + m.kcal, 0)
  const consumed       = mealConsumed + manualConsumed
  const remaining      = Math.max(0, profile.dailyKcal - consumed)
  const pct            = Math.min(100, Math.round((consumed / profile.dailyKcal) * 100))



  const goalLabel = profile.goal === 'lose' ? 'Emagrecimento' : profile.goal === 'gain' ? 'Ganho de massa' : 'Manutenção'

  const phaseLabel = profile.protocolPhase === 'beginning' ? 'Início'
    : profile.protocolPhase === 'adaptation' ? 'Adaptação' : 'Manutenção'
  const arcR        = 34
  const arcCirc     = 2 * Math.PI * arcR
  const arcOffset   = arcCirc * (1 - pct / 100)
  const arcColor    = pct >= 100 ? '#FBBF24' : 'rgba(255,255,255,0.90)'
  const heroMessage = pct === 0 ? 'Vamos começar!'
    : pct < 30  ? 'Bom início, continue assim'
    : pct < 60  ? 'Você está no ritmo'
    : pct < 90  ? 'Quase lá!'
    : pct < 100 ? 'Meta quase atingida'
    : 'Meta diária concluída!'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* ── AI status bar ── */}
      {aiLoading && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '12px 16px', borderRadius: '14px',
          background: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.18)',
        }}>
          <div style={{
            width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
            border: '2px solid rgba(37,99,235,0.25)', borderTopColor: 'var(--primary)',
            animation: 'spin 0.7s linear infinite',
          }} />
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary)', margin: 0 }}>
            Gerando seu plano personalizado com IA...
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}
      {!aiLoading && aiError && (
        <div style={{
          padding: '10px 14px', borderRadius: '12px',
          background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.22)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
        }}>
          <p style={{ fontSize: '12px', color: '#92400E', margin: 0, flex: 1 }}>{aiError}</p>
          <button
            onClick={() => generateDiet(profile)}
            style={{
              padding: '5px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              background: '#D97706', color: '#fff', fontSize: '11px', fontWeight: 700,
              fontFamily: 'Inter, -apple-system, sans-serif', whiteSpace: 'nowrap',
            }}
          >
            Tentar novamente
          </button>
        </div>
      )}
      {!aiLoading && _aiMatch && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '9px 14px', borderRadius: '12px',
          background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.20)',
        }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#059669', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/><path d="m9 12 2 2 4-4"/></svg>
            Plano gerado por IA para o seu perfil
          </p>
          <button
            onClick={() => generateDiet(profile)}
            style={{
              padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.30)',
              background: 'transparent', cursor: 'pointer', color: '#059669',
              fontSize: '11px', fontWeight: 700, fontFamily: 'Inter, -apple-system, sans-serif',
            }}
          >
            Regenerar
          </button>
        </div>
      )}

      {/* ── Calorie hero ── */}
      <div style={{
        background: 'linear-gradient(155deg, #1A6B3C 0%, #0F4E2C 55%, #0A3820 100%)',
        borderRadius: '24px', padding: '20px 20px 18px', color: '#fff',
        boxShadow: '0 16px 48px rgba(10,56,32,0.50), 0 4px 12px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.08)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative layers */}
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-30px', left: '15%', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.025)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.14) 50%, transparent 100%)', pointerEvents: 'none' }} />

        {/* Top row: label + phase badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <p style={{ fontSize: '9px', fontWeight: 700, opacity: 0.55, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 3px' }}>Meta diária</p>
            <p style={{ fontSize: '13px', fontWeight: 700, opacity: 0.92, margin: 0 }}>{goalLabel}</p>
          </div>
          <span style={{
            fontSize: '10px', fontWeight: 700, padding: '4px 11px', borderRadius: '99px',
            background: 'rgba(255,255,255,0.13)', border: '1px solid rgba(255,255,255,0.18)',
            backdropFilter: 'blur(8px)', letterSpacing: '0.02em',
          }}>
            {phaseLabel}
          </span>
        </div>

        {/* Main: SVG arc + calorie number */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          {/* Circular progress arc */}
          <div style={{ position: 'relative', flexShrink: 0, width: '82px', height: '82px' }}>
            <svg width="82" height="82" viewBox="0 0 82 82" style={{ display: 'block' }}>
              <circle cx="41" cy="41" r={arcR} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="6" />
              <circle cx="41" cy="41" r={arcR} fill="none" stroke={arcColor} strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={arcCirc}
                strokeDashoffset={arcOffset}
                transform="rotate(-90 41 41)"
                style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1), stroke 0.4s ease' }}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: '19px', fontWeight: 800, letterSpacing: '-0.5px', margin: 0, lineHeight: 1 }}>{pct}%</p>
              <p style={{ fontSize: '8px', opacity: 0.60, margin: '2px 0 0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>meta</p>
            </div>
          </div>

          {/* Numbers */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '44px', fontWeight: 800, lineHeight: 1, letterSpacing: '-2px', margin: '0 0 2px' }}>
              {consumed}<span style={{ fontSize: '15px', fontWeight: 600, opacity: 0.65, marginLeft: '3px' }}>kcal</span>
            </p>
            <p style={{ fontSize: '11px', opacity: 0.65, margin: 0, fontWeight: 500 }}>consumidas hoje</p>
            <p style={{ fontSize: '12px', fontWeight: 700, margin: '5px 0 0', opacity: 0.92 }}>
              {pct >= 100
                ? 'Meta atingida!'
                : <>Faltam <span style={{ color: '#FCD34D' }}>{remaining} kcal</span></>
              }
            </p>
          </div>
        </div>

        {/* Progress bar — thin + elegant */}
        <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '99px', height: '4px', overflow: 'hidden', marginBottom: '5px' }}>
          <div style={{
            width: `${pct}%`, height: '100%',
            background: pct >= 100
              ? 'linear-gradient(90deg, #F59E0B, #FBBF24)'
              : 'linear-gradient(90deg, rgba(255,255,255,0.7), rgba(255,255,255,0.95))',
            borderRadius: '99px',
            transition: 'width 0.9s cubic-bezier(0.22,1,0.36,1)',
          }} />
        </div>
        <p style={{ fontSize: '10px', opacity: 0.55, margin: '0 0 14px', fontWeight: 500 }}>{heroMessage}</p>

        {/* Stat pills — glassmorphic */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '7px' }}>
          {[
            { label: 'Meta', value: `${profile.dailyKcal}`, unit: 'kcal' },
            { label: 'Proteína', value: `${Math.round(profile.weight * 1.8)}`, unit: 'g/dia' },
            { label: 'Água', value: `${Math.round(profile.weight * 0.035 * 10) / 10}`, unit: 'L/dia' },
          ].map(stat => (
            <div key={stat.label} style={{
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderRadius: '12px', padding: '9px 10px',
              border: '1px solid rgba(255,255,255,0.10)',
            }}>
              <p style={{ fontSize: '8px', fontWeight: 700, opacity: 0.55, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>{stat.label}</p>
              <p style={{ fontSize: '13px', fontWeight: 800, margin: '3px 0 0', lineHeight: 1 }}>
                {stat.value}<span style={{ fontSize: '9px', fontWeight: 600, opacity: 0.65, marginLeft: '2px' }}>{stat.unit}</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: '4px', padding: '4px', background: 'var(--surface-2)', borderRadius: '14px', border: '1px solid var(--border)' }}>
        {([
          { id: 'hoje' as DietTab,       label: 'Hoje' },
          { id: 'cardapio' as DietTab,   label: 'Cardápio' },
          { id: 'pouca-fome' as DietTab, label: 'Pouca Fome' },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, padding: '9px 6px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              fontFamily: 'Inter, -apple-system, sans-serif', fontWeight: 700, fontSize: '12px',
              background: activeTab === tab.id ? 'var(--surface)' : 'transparent',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: activeTab === tab.id
                ? '0 2px 8px rgba(15,23,42,0.06), 0 0 0 1px var(--border)'
                : 'none',
              transition: 'all 0.18s ease',
              letterSpacing: '-0.01em',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── HOJE tab ─────────────────────────────────────────────────────────── */}
      {activeTab === 'hoje' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Adherence summary */}
          {(() => {
            const done = dayLog.meals.length
            const total = meals.length
            const adh = Math.round((done / total) * 100)
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '14px', background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {meals.map(m => (
                    <div key={m.id} style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: dayLog.meals.includes(m.id) ? m.color : 'var(--border)',
                      transition: 'background 0.3s ease',
                    }} />
                  ))}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    {done}/{total} refeições registradas
                  </p>
                </div>
                <span style={{
                  fontSize: '10px', fontWeight: 800, padding: '3px 9px', borderRadius: '99px',
                  background: adh >= 80 ? 'rgba(16,185,129,0.10)' : 'var(--primary-light)',
                  color: adh >= 80 ? '#059669' : '#16A34A',
                }}>
                  {adh}%
                </span>
              </div>
            )
          })()}

          {/* Meal checklist */}
          <div style={{ background: 'var(--surface)', borderRadius: '20px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
                Refeições de hoje
              </p>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0 }}>
                {consumed > 0 && `${consumed} kcal consumidas`}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', padding: '0 10px 12px', gap: '6px' }}>
              {meals.map(meal => {
                const done     = dayLog.meals.includes(meal.id)
                const mealKcal = mealKcalMap[meal.id]
                return (
                  <div
                    key={meal.id}
                    className="meal-row"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 12px', borderRadius: '14px',
                      background: done ? `${meal.color}0c` : 'var(--surface-2)',
                      border: `1px solid ${done ? meal.color + '25' : 'transparent'}`,
                      borderLeft: `3px solid ${done ? meal.color : 'transparent'}`,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontWeight: 700, fontSize: '13px', margin: 0, lineHeight: 1.3,
                        color: done ? meal.color : 'var(--text-primary)',
                        opacity: done ? 0.85 : 1,
                        transition: 'color 0.22s, opacity 0.22s',
                      }}>
                        {meal.label}
                        {meal.sublabel && <span style={{ fontSize: '10px', marginLeft: '6px', opacity: 0.5, fontWeight: 600 }}>({meal.sublabel})</span>}
                      </p>
                      <p style={{ fontSize: '11px', color: done ? `${meal.color}99` : 'var(--text-muted)', margin: '2px 0 0', fontWeight: 600, transition: 'color 0.22s' }}>
                        ~{mealKcal} kcal
                      </p>
                    </div>
                    <button
                      onClick={() => toggleMeal(meal.id)}
                      className={`check-btn${done ? ' is-done' : ''}`}
                      style={{
                        width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0,
                        background: done ? meal.color : 'transparent',
                        border: `1.5px solid ${done ? meal.color : 'var(--border-strong)'}`,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: done ? '#fff' : 'var(--text-muted)',
                        boxShadow: done ? `0 3px 10px ${meal.color}45` : 'none',
                      }}
                    >
                      <Check size={13} strokeWidth={3} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Manual items */}
          <div style={{ background: 'var(--surface)', borderRadius: '20px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
                Alimentos manuais
              </p>
              {manualConsumed > 0 && (
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#16A34A' }}>{manualConsumed} kcal</span>
              )}
            </div>

            <div style={{ padding: '0 10px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {/* Existing manual items */}
              {dayLog.manual.map(item => (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '9px 12px', borderRadius: '12px',
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  animation: 'fade-up 0.2s ease both',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)', margin: 0 }}>{item.name}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '1px 0 0' }}>{item.kcal} kcal</p>
                  </div>
                  <button
                    onClick={() => removeManual(item.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '5px', borderRadius: '8px', display: 'flex', alignItems: 'center', transition: 'color 0.15s, background 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--error)'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none' }}
                  >
                    <X size={14} strokeWidth={2.5} />
                  </button>
                </div>
              ))}

              {/* Add form */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', marginTop: dayLog.manual.length > 0 ? '4px' : 0 }}>
                <div style={{ flex: 2 }}>
                  <p style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Alimento</p>
                  <input
                    ref={nameRef}
                    type="text"
                    placeholder="Ex: Banana"
                    value={manualName}
                    onChange={e => setManualName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addManual()}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: '11px',
                      border: '1.5px solid var(--border)', background: 'var(--surface-2)',
                      fontFamily: 'Inter, -apple-system, sans-serif', fontSize: '13px', fontWeight: 600,
                      color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#16A34A'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.18)' }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>kcal</p>
                  <input
                    type="number"
                    placeholder="90"
                    value={manualKcal}
                    onChange={e => setManualKcal(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addManual()}
                    min={1} max={9999}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: '11px',
                      border: '1.5px solid var(--border)', background: 'var(--surface-2)',
                      fontFamily: 'Inter, -apple-system, sans-serif', fontSize: '13px', fontWeight: 600,
                      color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#16A34A'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.18)' }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
                  />
                </div>
                <button
                  onClick={addManual}
                  style={{
                    width: '43px', height: '43px', borderRadius: '11px', flexShrink: 0,
                    background: 'linear-gradient(135deg, #16653A 0%, #16A34A 100%)',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                    boxShadow: '0 3px 10px rgba(22,163,74,0.25)',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(22,163,74,0.35)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 3px 10px rgba(22,163,74,0.25)' }}
                >
                  <Plus size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CARDÁPIO tab ──────────────────────────────────────────────────────── */}
      {activeTab === 'cardapio' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Plate priority */}
          <div className="card" style={{ padding: '12px 14px' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>
              Ordem de prioridade do prato
            </p>
            <div style={{ display: 'flex', gap: '5px' }}>
              {['1. Proteína', '2. Carboidrato', '3. Legumes cozidos', '4. Saladas cruas'].map(p => (
                <span key={p} style={{
                  flex: '1 1 0', fontSize: '10px', fontWeight: 700, textAlign: 'center',
                  padding: '6px 4px', borderRadius: '8px',
                  background: 'rgba(22,163,74,0.12)', color: '#16A34A',
                  border: '1px solid rgba(22,163,74,0.18)',
                }}>
                  {p}
                </span>
              ))}
            </div>
          </div>
          <Divider label="Refeições" />
          {meals.map(s => <MealCard key={s.id} section={s} />)}
          <Divider label="Referências" />
          {lists.map(s => <ListCard key={s.id} section={s} />)}
        </div>
      )}

      {/* ── POUCA FOME tab ────────────────────────────────────────────────────── */}
      {activeTab === 'pouca-fome' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ padding: '14px 16px', borderRadius: '16px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.22)' }}>
            <p style={{ fontSize: '13px', fontWeight: 800, color: '#92400E', marginBottom: '6px' }}>Quando a fome diminui muito</p>
            <p style={{ fontSize: '12px', color: '#B45309', lineHeight: 1.5, margin: '0 0 10px' }}>
              O objetivo não é forçar grandes refeições. A estratégia é comer menos volume e aumentar a densidade nutricional.
            </p>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#92400E', margin: '0 0 6px' }}>Sinais desta fase:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {['Saciedade com poucas colheradas', 'Náusea, empachamento', 'Sensação de comida parada no estômago', 'Refluxo ou falta de vontade de comer', 'Pular refeições sem perceber'].map(s => (
                <div key={s} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <span style={{ fontSize: '10px', color: '#B45309', flexShrink: 0, marginTop: '2px' }}>•</span>
                  <p style={{ fontSize: '12px', color: '#B45309', margin: 0, lineHeight: 1.4 }}>{s}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: '12px 14px' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Ordem de prioridade</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { n: '1', label: 'Proteína', color: '#2563EB' },
                { n: '2', label: 'Hidratação', color: '#0891B2' },
                { n: '3', label: 'Carboidratos de fácil digestão', color: '#059669' },
                { n: '4', label: 'Fibras', color: '#D97706' },
                { n: '5', label: 'Todo o restante', color: 'var(--text-muted)' },
              ].map(p => (
                <div key={p.n} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0, background: p.color === 'var(--text-muted)' ? 'var(--surface-2)' : p.color + '18', color: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800 }}>{p.n}</span>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{p.label}</p>
                </div>
              ))}
            </div>
          </div>

          {lowHungerMeals.map(s => <MealCard key={s.id} section={s} />)}

          <div style={{ borderRadius: '16px', border: '1.5px solid rgba(239,68,68,0.22)', background: 'rgba(239,68,68,0.04)', overflow: 'hidden', boxShadow: 'var(--card-shadow)' }}>
            <button onClick={() => toggle('lh-dias-extremos')} style={{ width: '100%', padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'Inter, -apple-system, sans-serif' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={15} strokeWidth={2} style={{ color: '#EF4444', flexShrink: 0 }} />
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>Dias Extremos</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, marginTop: '1px' }}>Quando quase não há fome</p>
                </div>
              </div>
              <span style={{ color: 'var(--text-muted)', transform: expanded.has('lh-dias-extremos') ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'inline-flex', flexShrink: 0 }}>
                <ChevronDown size={16} strokeWidth={2} />
              </span>
            </button>
            {expanded.has('lh-dias-extremos') && (
              <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  Objetivo: não tentar "comer normal". <strong>Bater proteína</strong> é a única prioridade.
                </p>
                {[
                  { label: 'Café', items: ['Iogurte grego', 'Whey'], protein: '40 g' },
                  { label: 'Almoço', items: ['180 g de frango', '100 g de arroz'], protein: '45 g' },
                  { label: 'Jantar', items: ['Whey', 'Leite desnatado', 'Banana'], protein: '35 g' },
                ].map(meal => (
                  <div key={meal.label} style={{ padding: '10px 12px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid rgba(239,68,68,0.15)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                      <p style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-primary)', margin: 0 }}>{meal.label}</p>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#EF4444' }}>~{meal.protein}</span>
                    </div>
                    {meal.items.map(item => <p key={item} style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>{item}</p>)}
                  </div>
                ))}
              </div>
            )}
          </div>

          {[
            { id: 'lh-prot', label: 'Proteínas Melhor Toleradas', color: '#2563EB', items: ['Frango desfiado', 'Peixe', 'Atum em água', 'Ovos', 'Iogurte grego', 'Cottage', 'Whey'] },
            { id: 'lh-carb', label: 'Carboidratos Melhor Tolerados', color: '#059669', items: ['Arroz branco', 'Batata inglesa', 'Batata doce', 'Cuscuz', 'Pão francês', 'Banana', 'Mamão'] },
          ].map(sec => {
            const isOpen = expanded.has(sec.id)
            return (
              <div key={sec.id} style={{ borderRadius: '16px', border: `1.5px solid ${isOpen ? sec.color + '35' : 'var(--border)'}`, background: isOpen ? sec.color + '07' : 'var(--surface)', overflow: 'hidden', transition: 'all 0.2s', boxShadow: 'var(--card-shadow)' }}>
                <button onClick={() => toggle(sec.id)} style={{ width: '100%', padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'Inter, -apple-system, sans-serif' }}>
                  <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', margin: 0 }}>{sec.label}</p>
                  <span style={{ color: 'var(--text-muted)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'inline-flex', flexShrink: 0 }}><ChevronDown size={16} strokeWidth={2} /></span>
                </button>
                {isOpen && (
                  <div style={{ padding: '0 14px 14px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {sec.items.map(item => (
                        <span key={item} style={{ padding: '4px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600, background: sec.color + '15', color: sec.color, border: `1px solid ${sec.color}25` }}>{item}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          <div className="card" style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <Droplets size={13} strokeWidth={2} style={{ flexShrink: 0, marginTop: '1px', color: '#0891B2' }} />
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                <strong>Hidratação:</strong> mesmo sem fome, a água é obrigatória. Tontura e fadiga muitas vezes são sinais de desidratação.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <Leaf size={13} strokeWidth={2} style={{ flexShrink: 0, marginTop: '1px', color: '#059669' }} />
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                <strong>Intestino:</strong> priorize mamão, kiwi, feijão, legumes e água. Se necessário: Psyllium 5–10 g/dia.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Reset */}
      <button
        onClick={resetProfile}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          padding: '10px', borderRadius: '12px', border: '1px solid var(--border)',
          background: 'transparent', cursor: 'pointer',
          fontFamily: 'Inter, -apple-system, sans-serif', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)',
        }}
      >
        <RotateCcw size={12} strokeWidth={2.5} />
        Alterar dados / Reiniciar plano
      </button>

      <div className="card-warning">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <Info size={13} strokeWidth={2} style={{ flexShrink: 0, marginTop: '1px', color: 'var(--warn-text)' }} />
          <p style={{ fontSize: '11px', color: 'var(--warn-text)', lineHeight: 1.6, margin: 0 }}>
            Plano elaborado por nutricionista para uso com Tirzepatida. Não substitui acompanhamento nutricional individualizado. Consulte seu profissional de saúde.
          </p>
        </div>
      </div>
    </div>
  )
}
