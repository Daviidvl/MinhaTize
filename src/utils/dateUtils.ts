// Datas de calendário (YYYY-MM-DD) sempre no fuso do aparelho.
//
// Não usar `toISOString().split('T')[0]` para isso: toISOString é UTC, então no
// Brasil (UTC-3) qualquer registro feito depois das 21h sairia com a data do
// dia seguinte. Pelo mesmo motivo, nunca `new Date('YYYY-MM-DD')` (meia-noite
// UTC): use parseDay, que lê a data ao meio-dia local.

export function toDateStr(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function todayStr(): string {
  return toDateStr(new Date())
}

// Meio-dia local: longe da meia-noite, a data não muda com fuso nem horário de verão
export function parseDay(dateStr: string): Date {
  return new Date(dateStr + 'T12:00:00')
}

export function addDays(dateStr: string, n: number): string {
  const d = parseDay(dateStr)
  d.setDate(d.getDate() + n)
  return toDateStr(d)
}

// Dias de calendário de `from` até `to` (negativo se `to` vier antes)
export function diffDays(to: string, from: string): number {
  return Math.round((parseDay(to).getTime() - parseDay(from).getTime()) / 864e5)
}

// 0 = domingo … 6 = sábado
export function weekdayOf(dateStr: string): number {
  return parseDay(dateStr).getDay()
}

// Os 7 dias (domingo a sábado, à meia-noite local) da semana de `now`
export function getWeekDays(now = new Date()): Date[] {
  const sunday = new Date(now)
  sunday.setDate(now.getDate() - now.getDay())
  sunday.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    return d
  })
}

// Segunda-feira da semana de `d` — chave semanal dos sintomas e da meta de treino
export function getMondayOf(d: Date): string {
  const date = new Date(d)
  const day  = date.getDay()
  date.setDate(date.getDate() - day + (day === 0 ? -6 : 1))
  return toDateStr(date)
}
