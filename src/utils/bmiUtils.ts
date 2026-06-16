export function calcIMC(w: number, h: number): number | null {
  if (!h || !w) return null
  return w / ((h / 100) ** 2)
}

export function imcLabel(v: number): { label: string; color: string } {
  if (v < 18.5) return { label: 'Abaixo do peso', color: '#F59E0B' }
  if (v < 25)   return { label: 'Normal',          color: '#10B981' }
  if (v < 30)   return { label: 'Sobrepeso',        color: '#F97316' }
  if (v < 35)   return { label: 'Obesidade I',      color: '#EF4444' }
  if (v < 40)   return { label: 'Obesidade II',     color: '#DC2626' }
  return               { label: 'Obesidade III',    color: '#991B1B' }
}
