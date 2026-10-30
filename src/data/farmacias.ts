// ── Farmácias parceiras ──────────────────────────────────────────────────────
// A ordem do array é a ordem exibida no app.
export interface Farmacia {
  name: string
  location: string
  whatsapp?: string   // só dígitos, com DDI (ex.: 595987123697)
  instagram?: string  // URL completa
  site?: string       // URL completa
  logo?: string       // caminho em /public (URL externa é bloqueada pelo img-src da CSP); sem logo, mostra o ícone de farmácia
}

export const FARMACIAS: Farmacia[] = [
  {
    name: 'Andy Corp',
    location: 'Paraguai',
    whatsapp: '595987123697',
    logo: '/farmacias/andy-corp.png',
  },
  {
    name: 'Farmácia Santa Rita',
    location: 'Paraguai',
    whatsapp: '595971588915',
    instagram: 'https://www.instagram.com/farmaciasantarita7398',
    site: 'https://farmaciasantaritaparaguai.com.br/',
    logo: '/farmacias/santa-rita.jpg',
  },
]

export const FARMACIA_WA_MESSAGE = 'Olá! Vim pelo app MinhaTize e gostaria de mais informações.'
