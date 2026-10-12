// Datas de calendário (YYYY-MM-DD) sempre no fuso do aparelho.
//
// Não usar `toISOString().split('T')[0]` para isso: toISOString é UTC, então no
// Brasil (UTC-3) qualquer registro feito depois das 21h sairia com a data do
// dia seguinte.

export function toDateStr(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function todayStr(): string {
  return toDateStr(new Date())
}
