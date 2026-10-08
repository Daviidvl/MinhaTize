// Tom translúcido de um token de cor (ex.: alpha('var(--cobalt)', 10)).
// Substitui a antiga concatenação de alpha em hex (`${cor}1A`), que não funciona com var().
export function alpha(color: string, percent: number): string {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`
}

// Sombra na cor navy da paleta, preservando offset/blur de quem chama.
export function shade(opacity: number): string {
  return `rgba(var(--shadow-rgb),${opacity})`
}
