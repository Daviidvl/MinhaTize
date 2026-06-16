// ── Motor de regras nutricionais ──────────────────────────────────────────────
// Gera plano alimentar 100% local, sem IA, baseado no perfil do usuário.

export interface DietInput {
  sex: 'M' | 'F'
  age: number
  height: number
  weight: number
  goalWeight: number
  goal: 'lose' | 'maintain' | 'gain'
  activity: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  protocolPhase: 'beginning' | 'adaptation' | 'maintenance'
  mealFrequency: '2' | '3' | '4' | '5-6'
  challenges: string[]
  comorbidities: string[]
  restrictions: string[]
  dailyKcal: number
}

export interface MealOption { label?: string; items: string[]; protein?: string; note?: string }
export interface GeneratedMeal { id: string; label: string; sublabel?: string; color: string; kcalShare: number; options: MealOption[] }
export interface FoodList { id: string; label: string; items: string[]; note?: string }
export interface NutritionTargets { kcal: number; proteinG: number; waterL: number }
export interface DietPlan { meals: GeneratedMeal[]; lowHunger: GeneratedMeal[]; lists: FoodList[]; targets: NutritionTargets }

// ── Banco de refeições por tipo ───────────────────────────────────────────────

interface Combo { items: string[]; protein: string; exclude?: string[]; tags?: string[] }

const BREAKFAST: Combo[] = [
  { items: ['2 ovos mexidos com azeite', '1 fatia de pão integral', '1 banana'], protein: '16g', tags: ['soft'] },
  { items: ['Omelete de 2 ovos com espinafre', '1 fatia de pão integral', 'Café sem açúcar'], protein: '18g' },
  { items: ['200g de iogurte grego natural', '2 col de aveia', '1 fruta (maçã ou pera)'], protein: '22g', exclude: ['vegan'] },
  { items: ['Vitamina: 200ml leite desnatado + 1 scoop whey + 1 banana', '1 col de aveia'], protein: '32g', exclude: ['vegan', 'lactose'] },
  { items: ['2 ovos cozidos', 'Tapioca 2 col de sopa', '1 fruta'], protein: '14g', tags: ['gluten-free', 'soft'] },
  { items: ['Mingau de aveia com canela', '100g de cottage', '1 maçã'], protein: '18g', exclude: ['vegan', 'lactose'] },
  { items: ['3 claras + 1 ovo inteiro mexido', '1 fatia pão integral com pasta de amendoim'], protein: '24g', exclude: ['vegan'] },
  { items: ['Panqueca de banana (2 ovos + 1 banana amassada)', '1 fio de mel'], protein: '14g', exclude: ['vegan'], tags: ['gluten-free'] },
  // Vegetarian / Vegan
  { items: ['Tofu mexido com açafrão e legumes', 'Tapioca 2 col', '1 fruta'], protein: '16g', exclude: ['none'] },
  { items: ['Iogurte de soja 200g', '2 col de aveia', '30g de granola sem glúten', '1 banana'], protein: '10g', exclude: ['none'] },
  { items: ['Pasta de grão-de-bico (hummus) com pão integral', '1 fruta', 'Chá verde'], protein: '12g', exclude: ['none'] },
  { items: ['Smoothie: leite de aveia + pasta de amendoim + banana + cacau em pó'], protein: '12g', exclude: ['none'] },
]

const LUNCH: Combo[] = [
  { items: ['150g de frango grelhado', '4 col de arroz integral', '1 col de azeite', 'Salada verde à vontade'], protein: '37g' },
  { items: ['120g de atum em água', 'Batata doce 150g cozida', 'Brócolis refogado', '1 col de azeite'], protein: '29g', tags: ['low-gi'] },
  { items: ['150g de tilápia grelhada', '4 col de arroz integral', 'Abobrinha refogada', '1 col de azeite'], protein: '34g' },
  { items: ['120g de patinho moído', 'Purê de batata doce 150g', 'Cenoura e vagem cozidas'], protein: '26g', tags: ['soft'] },
  { items: ['150g de salmão grelhado', '4 col de arroz integral', 'Salada de pepino e tomate', '1 col de azeite'], protein: '32g' },
  { items: ['Frango desfiado 150g', 'Macarrão integral 80g', 'Molho de tomate natural', 'Salada verde'], protein: '35g' },
  { items: ['150g de filé de frango', 'Mandioca cozida 150g', 'Legumes refogados mistos', '1 col de azeite'], protein: '34g' },
  // Vegetarian
  { items: ['2 ovos + 100g de queijo cottage', '4 col de arroz integral', 'Espinafre refogado', '1 col de azeite'], protein: '30g', exclude: ['vegan'] },
  { items: ['Omelete de 3 ovos com legumes variados', 'Batata doce 150g', 'Salada verde'], protein: '24g', exclude: ['vegan'] },
  { items: ['150g de tofu firme grelhado', '4 col de arroz integral', 'Brócolis + cenoura refogados', '1 col de azeite'], protein: '16g', exclude: ['none'] },
  // Vegan
  { items: ['150g de grão-de-bico + 100g de lentilha', '4 col de arroz integral', 'Espinafre refogado', '1 col de azeite'], protein: '25g', exclude: ['none'] },
  { items: ['200g de feijão + arroz integral 4 col', 'Couve refogada', 'Salada de tomate e pepino'], protein: '18g', exclude: ['none'] },
  { items: ['150g de tempeh grelhado', 'Batata doce 150g', 'Mix de legumes refogados', '1 col de azeite'], protein: '28g', exclude: ['none'] },
]

const DINNER: Combo[] = [
  { items: ['150g de frango grelhado', '3 col de arroz integral', 'Salada de folhas verdes', '1 col de azeite'], protein: '37g' },
  { items: ['120g de atum em água', 'Batata doce 100g', 'Mix de legumes no vapor'], protein: '29g', tags: ['light'] },
  { items: ['Omelete de 3 ovos com queijo branco e espinafre', '1 fatia de pão integral', 'Tomate e pepino'], protein: '28g', exclude: ['vegan'] },
  { items: ['150g de salmão grelhado', 'Legumes no vapor (brócolis, cenoura, vagem)', '1 col de azeite'], protein: '32g', tags: ['low-carb'] },
  { items: ['Sopa de frango com legumes (300ml)', 'Pão integral 1 fatia'], protein: '22g', tags: ['soft'] },
  { items: ['150g de tilápia assada', '3 col de arroz integral', 'Abobrinha grelhada'], protein: '34g' },
  { items: ['120g de peito de peru fatiado', 'Salada completa (folhas, tomate, pepino, cenoura)', '1 col de azeite'], protein: '24g', tags: ['light'] },
  // Vegetarian
  { items: ['Omelete de 3 ovos com legumes', '1 fatia de pão integral', 'Salada verde'], protein: '22g', exclude: ['vegan'] },
  { items: ['100g de queijo cottage + 2 ovos cozidos', 'Salada completa', '1 col de azeite'], protein: '26g', exclude: ['vegan'] },
  // Vegan
  { items: ['150g de tofu grelhado', '3 col de arroz integral', 'Brócolis e cenoura refogados', '1 col de azeite'], protein: '16g', exclude: ['none'] },
  { items: ['Sopa de lentilha com legumes (350ml)', '1 fatia de pão integral'], protein: '16g', exclude: ['none'], tags: ['soft'] },
  { items: ['150g de grão-de-bico assado com temperos', 'Batata doce 100g', 'Salada de folhas verdes'], protein: '12g', exclude: ['none'] },
]

const SNACK_AM: Combo[] = [
  { items: ['200g de iogurte grego natural', '1 fruta (maçã ou pera)'], protein: '20g', exclude: ['vegan', 'lactose'] },
  { items: ['30g de castanhas mix', '1 banana'], protein: '5g' },
  { items: ['100g de cottage + 1 fruta'], protein: '11g', exclude: ['vegan', 'lactose'] },
  { items: ['1 scoop whey + 200ml água', '1 fruta'], protein: '24g', exclude: ['vegan'] },
  { items: ['30g de amendoim torrado', '1 maçã'], protein: '8g', tags: ['gluten-free'] },
  // Vegan
  { items: ['Iogurte de soja 150g + granola', '1 fruta'], protein: '8g', exclude: ['none'] },
  { items: ['Pasta de amendoim 1 col + 1 banana', 'Chá verde'], protein: '5g', exclude: ['none'] },
]

const SNACK_PM: Combo[] = [
  { items: ['200g de iogurte grego', '1 col de granola', '1 fruta'], protein: '20g', exclude: ['vegan', 'lactose'] },
  { items: ['30g de castanhas + 1 fruta pequena'], protein: '5g' },
  { items: ['100g de cottage + cenoura baby 80g'], protein: '11g', exclude: ['vegan', 'lactose'] },
  { items: ['1 fatia de pão integral + pasta de amendoim 1 col'], protein: '7g' },
  { items: ['1 ovo cozido + 1 fruta'], protein: '7g', exclude: ['vegan'] },
  // Vegan
  { items: ['Hummus 3 col de sopa + palitinhos de pepino e cenoura'], protein: '6g', exclude: ['none'] },
  { items: ['Iogurte de coco 150g + 30g de mix de sementes'], protein: '5g', exclude: ['none'] },
]

const SUPPER: Combo[] = [
  { items: ['200g de iogurte grego natural'], protein: '20g', exclude: ['vegan', 'lactose'] },
  { items: ['1 scoop whey + 200ml leite desnatado'], protein: '30g', exclude: ['vegan'] },
  { items: ['100g de cottage'], protein: '11g', exclude: ['vegan', 'lactose'] },
  { items: ['30g de castanhas + chá de camomila'], protein: '4g' },
  // Vegan
  { items: ['Iogurte de soja 150g + 15g de chia'], protein: '8g', exclude: ['none'] },
  { items: ['1 banana + 2 col de pasta de amendoim'], protein: '5g', exclude: ['none'] },
]

const LOW_HUNGER: Combo[] = [
  { items: ['1 scoop whey + 200ml água gelada'], protein: '24g', exclude: ['vegan'] },
  { items: ['200g de iogurte grego natural'], protein: '20g', exclude: ['vegan', 'lactose'] },
  { items: ['2 ovos cozidos'], protein: '14g', exclude: ['vegan'] },
  { items: ['120g de atum em água'], protein: '29g', exclude: ['vegan', 'vegetarian'] },
  { items: ['100g de cottage + 1 fruta pequena'], protein: '11g', exclude: ['vegan', 'lactose'] },
  { items: ['1 banana + 1 col de pasta de amendoim'], protein: '5g' },
  { items: ['30g de castanhas + chá quente'], protein: '5g' },
  { items: ['Vitamina: leite desnatado + banana + mel (200ml)'], protein: '8g', exclude: ['vegan', 'lactose'] },
]

// ── Filtros por restrição ─────────────────────────────────────────────────────

function getActiveRestrictions(restrictions: string[]): Set<string> {
  const s = new Set<string>()
  if (restrictions.includes('vegan'))       { s.add('vegan'); s.add('vegetarian') }
  if (restrictions.includes('vegetarian'))  s.add('vegetarian')
  if (restrictions.includes('lactose'))     s.add('lactose')
  if (restrictions.includes('gluten'))      s.add('gluten')
  return s
}

function filterCombos(combos: Combo[], active: Set<string>): Combo[] {
  return combos.filter(c => {
    if (!c.exclude) return true
    // exclude=['none'] means "only for everyone" (vegan-friendly already)
    if (c.exclude.includes('none')) return true
    return !c.exclude.some(ex => active.has(ex))
  })
}

// ── Ajustes por condição clínica ──────────────────────────────────────────────

function applyConditionTags(combos: Combo[], comorbidities: string[]): Combo[] {
  const hasDiabetes = comorbidities.some(c => ['diabetes2', 'prediabetes'].includes(c))
  if (!hasDiabetes) return combos
  // Prefer low-gi options when available
  const lowGi = combos.filter(c => c.tags?.includes('low-gi'))
  return lowGi.length >= 2 ? [...lowGi, ...combos.filter(c => !c.tags?.includes('low-gi'))].slice(0, combos.length) : combos
}

function applyChallenges(combos: Combo[], challenges: string[]): Combo[] {
  const hasNausea   = challenges.includes('nausea')
  const hasReflux   = challenges.includes('reflux')
  if (!hasNausea && !hasReflux) return combos
  const soft = combos.filter(c => c.tags?.includes('soft'))
  return soft.length >= 2 ? [...soft, ...combos.filter(c => !c.tags?.includes('soft'))].slice(0, combos.length) : combos
}

// ── Seleção de 3 opções variadas ──────────────────────────────────────────────

function pickOptions(combos: Combo[], count = 3): MealOption[] {
  if (combos.length === 0) return [{ items: ['Consulte um nutricionista para orientação personalizada'] }]
  const options: MealOption[] = []
  for (let i = 0; i < count; i++) {
    const c = combos[i % combos.length]
    options.push({ items: c.items, protein: c.protein, note: c.tags?.includes('low-gi') ? 'Baixo índice glicêmico' : undefined })
  }
  return options
}

// ── Configuração de refeições por frequência ──────────────────────────────────

const MEAL_META: Record<string, { label: string; sublabel: string; color: string; kcalShare: number }> = {
  cafe:       { label: 'Café da Manhã',   sublabel: '7h–9h',   color: '#D97706', kcalShare: 0.22 },
  'lanche-m': { label: 'Lanche da Manhã', sublabel: '10h–11h', color: '#059669', kcalShare: 0.10 },
  almoco:     { label: 'Almoço',          sublabel: '12h–14h', color: '#2563EB', kcalShare: 0.35 },
  'lanche-t': { label: 'Lanche da Tarde', sublabel: '15h–16h', color: '#7C3AED', kcalShare: 0.12 },
  jantar:     { label: 'Jantar',          sublabel: '19h–21h', color: '#DC2626', kcalShare: 0.18 },
  ceia:       { label: 'Ceia',            sublabel: '21h–22h', color: '#0891B2', kcalShare: 0.03 },
}

const FREQ_MEALS: Record<string, string[]> = {
  '2':   ['cafe', 'almoco'],
  '3':   ['cafe', 'almoco', 'jantar'],
  '4':   ['cafe', 'almoco', 'lanche-t', 'jantar'],
  '5-6': ['cafe', 'lanche-m', 'almoco', 'lanche-t', 'jantar', 'ceia'],
}

const MEAL_SOURCE: Record<string, Combo[]> = {
  cafe:       BREAKFAST,
  'lanche-m': SNACK_AM,
  almoco:     LUNCH,
  'lanche-t': SNACK_PM,
  jantar:     DINNER,
  ceia:       SUPPER,
}

// ── Listas de referência ──────────────────────────────────────────────────────

function buildLists(active: Set<string>): FoodList[] {
  const isVegan = active.has('vegan')
  const isVeg   = active.has('vegetarian')

  const proteins = isVegan
    ? ['Tofu firme', 'Tempeh', 'Grão-de-bico cozido', 'Lentilha cozida', 'Feijão cozido', 'Edamame', 'Proteína de soja texturizada', 'Pasta de amendoim']
    : isVeg
    ? ['Ovos inteiros', 'Queijo cottage', 'Iogurte grego', 'Tofu', 'Grão-de-bico', 'Lentilha', 'Feijão', 'Whey protein']
    : ['Frango grelhado', 'Tilápia', 'Atum em água', 'Salmão', 'Ovos inteiros', 'Patinho moído', 'Iogurte grego', 'Whey protein']

  const carbs = ['Arroz integral', 'Batata doce', 'Aveia', 'Macarrão integral', 'Tapioca', 'Mandioca', 'Batata inglesa cozida', 'Pão integral']

  const vegs = ['Brócolis', 'Espinafre', 'Abobrinha', 'Cenoura', 'Pepino', 'Tomate', 'Alface e folhas verdes', 'Chuchu', 'Vagem', 'Couve']

  const fats = ['Azeite extra virgem', 'Abacate', 'Castanhas e nozes', 'Amendoim', 'Sementes de chia', 'Sementes de linhaça']

  return [
    { id: 'proteinas', label: 'Proteínas', items: proteins },
    { id: 'carbs',     label: 'Carboidratos Complexos', items: carbs },
    { id: 'vegetais',  label: 'Legumes e Verduras', items: vegs },
    { id: 'gorduras',  label: 'Gorduras Boas', items: fats },
  ]
}

// ── Opções pouca fome ─────────────────────────────────────────────────────────

function buildLowHunger(active: Set<string>, challenges: string[]): GeneratedMeal[] {
  const filtered = applyChallenges(filterCombos(LOW_HUNGER, active), challenges)
  const protein  = filtered.filter((_, i) => i < 4)
  const light    = filtered.filter((_, i) => i >= 4)

  return [
    {
      id: 'lh-proteina', label: 'Prioridade: Proteína', color: '#2563EB', kcalShare: 0, sublabel: undefined,
      options: pickOptions(protein, 3),
    },
    {
      id: 'lh-leve', label: 'Opção Leve', color: '#059669', kcalShare: 0, sublabel: undefined,
      options: pickOptions(light.length ? light : filtered, 2),
    },
  ]
}

// ── Metas nutricionais derivadas do perfil ────────────────────────────────────

// Proteína: fator por fase (g/kg) — fase inicial = menos estresse, manutenção = preservar massa
const PROTEIN_PER_KG: Record<string, number> = {
  beginning:   1.6,
  adaptation:  1.8,
  maintenance: 2.0,
}

// Água: 35-48ml/kg conforme nível de atividade
const WATER_ML_PER_KG: Record<string, number> = {
  sedentary:   33,
  light:       36,
  moderate:    40,
  active:      44,
  very_active: 48,
}

function calcTargets(input: DietInput): NutritionTargets {
  const proteinFactor = PROTEIN_PER_KG[input.protocolPhase] ?? 1.8
  const proteinG      = Math.round(input.weight * proteinFactor)

  const waterFactor   = WATER_ML_PER_KG[input.activity] ?? 35
  const waterL        = Math.round(input.weight * waterFactor / 100) / 10

  return { kcal: input.dailyKcal, proteinG, waterL }
}

// ── Função principal ──────────────────────────────────────────────────────────

export function generateDietPlan(input: DietInput): DietPlan {
  const active   = getActiveRestrictions(input.restrictions)
  const selected = FREQ_MEALS[input.mealFrequency] ?? FREQ_MEALS['5-6']

  const rawMeals: GeneratedMeal[] = selected.map(id => {
    const meta     = MEAL_META[id]
    const source   = MEAL_SOURCE[id] ?? BREAKFAST
    const filtered = filterCombos(source, active)
    const adjusted = applyChallenges(applyConditionTags(filtered, input.comorbidities), input.challenges)

    return {
      id:        `eng-${id}`,
      label:     meta.label,
      sublabel:  meta.sublabel,
      color:     meta.color,
      kcalShare: meta.kcalShare,
      options:   pickOptions(adjusted, 3),
    }
  })

  // Normalizar kcalShare para que a soma seja exatamente 1.0
  const totalShare = rawMeals.reduce((sum, m) => sum + m.kcalShare, 0)
  const meals = rawMeals.map(m => ({
    ...m,
    kcalShare: totalShare > 0 ? Math.round((m.kcalShare / totalShare) * 10000) / 10000 : 1 / rawMeals.length,
  }))

  return {
    meals,
    lowHunger: buildLowHunger(active, input.challenges),
    lists:     buildLists(active),
    targets:   calcTargets(input),
  }
}
