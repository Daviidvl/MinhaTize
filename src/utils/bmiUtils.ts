export function calcIMC(w: number, h: number): number | null {
  if (!h || !w) return null
  return w / ((h / 100) ** 2)
}

export function imcLabel(v: number): { label: string; color: string } {
  if (v < 18.5) return { label: 'Abaixo do peso', color: 'var(--amber)' }
  if (v < 25)   return { label: 'Normal',          color: 'var(--teal-d)' }
  if (v < 30)   return { label: 'Sobrepeso',        color: 'var(--amber)' }
  if (v < 35)   return { label: 'Obesidade I',      color: 'var(--red)' }
  if (v < 40)   return { label: 'Obesidade II',     color: 'var(--red)' }
  return               { label: 'Obesidade III',    color: 'var(--red)' }
}
