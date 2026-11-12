// Textos da tela de Início (saudação, data, fase da dose e frase de motivação).
// Os números vêm dos módulos de cada domínio (profileUtils, foodUtils, exerciseUtils…).

export function getGreeting(now = new Date()) {
  const h = now.getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function getFormattedDate(now = new Date()) {
  return now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export const DOSE_PHASE: Record<number, string> = {
  2.5: 'Fase inicial', 5: 'Adaptação', 7.5: 'Progresso',
  10: 'Consolidação', 12.5: 'Avançado', 15: 'Dose máxima',
}

export function getMotivation(lost: number, toGoal: number, weeks: number, days: number, reachedGoal: boolean) {
  if (reachedGoal)               return { text: 'Meta atingida!', sub: 'Resultado incrível. Continue cuidando dos hábitos.' }
  if (lost >= 10)                return { text: `${lost.toFixed(1)} kg eliminados`, sub: 'Resultado extraordinário. Parabéns pela consistência.' }
  if (toGoal > 0 && toGoal <= 3) return { text: `Faltam apenas ${toGoal.toFixed(1)} kg`, sub: 'Você está na reta final!' }
  if (lost >= 5)                 return { text: `${lost.toFixed(1)} kg a menos`, sub: 'Cada semana de consistência conta.' }
  if (weeks >= 8)                return { text: `${weeks} semanas de protocolo`, sub: 'Consistência é o maior diferencial.' }
  if (lost >= 2)                 return { text: `Já perdeu ${lost.toFixed(1)} kg`, sub: `Faltam ${toGoal.toFixed(1)} kg para a meta.` }
  if (weeks >= 2)                return { text: `${weeks}ª semana em protocolo`, sub: 'A dedicação já está gerando resultados.' }
  if (days <= 3)                 return { text: 'Bem-vindo ao protocolo!', sub: 'Registre seu peso toda semana.' }
  return { text: 'Registre seu peso', sub: 'Acompanhe sua evolução no gráfico.' }
}
