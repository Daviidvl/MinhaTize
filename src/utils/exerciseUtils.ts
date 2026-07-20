export const DAY_INITIALS  = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
export const DAY_NAMES     = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
export const DAY_FULL      = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

export function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

export function getWeekDays(): Date[] {
  const today = new Date()
  const sunday = new Date(today)
  sunday.setDate(today.getDate() - today.getDay())
  sunday.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    return d
  })
}

export function calcStreak(log: string[]): number {
  if (log.length === 0) return 0
  let streak = 0
  const now = new Date()
  const sunday = new Date(now)
  sunday.setDate(now.getDate() - now.getDay())
  sunday.setHours(0, 0, 0, 0)

  for (let w = 0; w <= 52; w++) {
    const weekStart = new Date(sunday)
    weekStart.setDate(sunday.getDate() - w * 7)
    let done = 0
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart)
      d.setDate(weekStart.getDate() + i)
      if (d > now) continue
      if (log.includes(toDateStr(d))) done++
    }
    if (done > 0) streak++
    else if (w > 0) break
  }
  return streak
}

export function getMotivation(done: number, target: number, streak: number): string {
  if (streak >= 12) return 'Três meses seguidos. Isso é transformação de verdade.'
  if (streak >= 8)  return `${streak} semanas sem parar. Você é extraordinária!`
  if (streak >= 4)  return `${streak} semanas de constância. O hábito já está formado.`
  if (streak >= 2)  return `${streak} semanas seguidas. Continue assim.`
  if (done === 0)   return 'A primeira marcação da semana faz toda a diferença.'
  if (done > target) return 'Além da meta. Que dedicação essa semana.'
  if (done >= target) return 'Meta da semana batida. Você arrasou.'
  if (done === 1)   return 'Primeiro treino da semana. Ótimo começo.'
  if (done === 2)   return 'Dois treinos marcados. Você está no ritmo!'
  if (done === target - 1) return 'Falta só um treino para bater a meta da semana.'
  return `${done} treinos essa semana. Siga em frente.`
}
