import { describe, it, expect, beforeEach } from 'vitest'
import { LIBRARY, TOPIC_ORDER, type LibraryItem } from '../../data/library'
import {
  itemProgress, markLessonDone, unmarkLessonDone, openLesson, nextLesson, lessonAfter,
  continueTarget, lessonMinutes, videoEmbedUrl, isLessonAvailable, loadLibraryProgress,
  loadReaderSize, type LibraryProgress,
} from '../libraryUtils'
import { STORAGE_KEYS } from '../storageKeys'

const ebook: LibraryItem = {
  id: 'e', kind: 'ebook', topic: 'inicio', title: 'E', subtitle: '', description: '',
  lessons: [
    { id: 'a', title: 'A', body: [{ type: 'p', text: 'um dois três' }] },
    { id: 'b', title: 'B', body: [{ type: 'p', text: 'quatro' }] },
    { id: 'c', title: 'C', body: [{ type: 'p', text: 'cinco' }] },
  ],
}

const series: LibraryItem = {
  id: 'v', kind: 'video', topic: 'inicio', title: 'V', subtitle: '', description: '',
  lessons: [
    { id: 'v1', title: 'V1', minutes: 3, video: { provider: 'youtube', id: 'abcdEFGH_12' } },
    { id: 'v2', title: 'V2', minutes: 4 },                                    // em breve
    { id: 'v3', title: 'V3', minutes: 5, video: { provider: 'vimeo', id: '123456' } },
  ],
}

describe('itemProgress', () => {
  it('conta só aulas disponíveis', () => {
    const p = markLessonDone({}, 'v', 'v1')
    expect(itemProgress(series, p)).toMatchObject({ done: 1, total: 2, pct: 0.5, started: true, complete: false })
  })

  it('item sem nada disponível nunca fica concluído', () => {
    const soon: LibraryItem = { ...series, lessons: [{ id: 'x', title: 'X' }] }
    expect(itemProgress(soon, {})).toMatchObject({ total: 0, complete: false })
  })

  it('conclui quando todas as disponíveis estão feitas', () => {
    let p: LibraryProgress = {}
    for (const id of ['a', 'b', 'c']) p = markLessonDone(p, 'e', id)
    expect(itemProgress(ebook, p).complete).toBe(true)
  })

  it('abrir sem concluir já conta como iniciado', () => {
    expect(itemProgress(ebook, openLesson({}, 'e', 'a')).started).toBe(true)
  })
})

describe('marcar e desmarcar', () => {
  it('não duplica e guarda a última aula', () => {
    const p = markLessonDone(markLessonDone({}, 'e', 'a', 1), 'e', 'a', 2)
    expect(p.e).toEqual({ done: ['a'], last: 'a', at: 2 })
  })

  it('desmarca sem perder o resto', () => {
    const p = unmarkLessonDone(markLessonDone(markLessonDone({}, 'e', 'a'), 'e', 'b'), 'e', 'a')
    expect(p.e.done).toEqual(['b'])
  })

  it('não altera o objeto original', () => {
    const p0: LibraryProgress = {}
    markLessonDone(p0, 'e', 'a')
    expect(p0).toEqual({})
  })
})

describe('nextLesson', () => {
  it('começa pela primeira', () => {
    expect(nextLesson(ebook, {})?.id).toBe('a')
  })

  it('segue a partir da última aberta', () => {
    const p = openLesson(markLessonDone({}, 'e', 'a'), 'e', 'b')
    expect(nextLesson(ebook, p)?.id).toBe('b')
  })

  it('volta para trás quando o que falta ficou antes da última', () => {
    let p = markLessonDone({}, 'e', 'b')
    p = markLessonDone(p, 'e', 'c')
    expect(nextLesson(ebook, p)?.id).toBe('a')
  })

  it('tudo feito: volta para a primeira', () => {
    let p: LibraryProgress = {}
    for (const id of ['a', 'b', 'c']) p = markLessonDone(p, 'e', id)
    expect(nextLesson(ebook, p)?.id).toBe('a')
  })

  it('pula aulas em breve', () => {
    expect(nextLesson(series, markLessonDone({}, 'v', 'v1'))?.id).toBe('v3')
    expect(lessonAfter(series, 'v1')?.id).toBe('v3')
    expect(lessonAfter(series, 'v3')).toBeNull()
  })
})

describe('continueTarget', () => {
  it('escolhe o item em andamento aberto por último', () => {
    let p = openLesson({}, 'e', 'a', 100)
    p = openLesson(p, 'v', 'v1', 200)
    expect(continueTarget([ebook, series], p)?.item.id).toBe('v')
  })

  it('ignora itens concluídos e não iniciados', () => {
    let p: LibraryProgress = {}
    for (const id of ['a', 'b', 'c']) p = markLessonDone(p, 'e', id)
    expect(continueTarget([ebook, series], p)).toBeNull()
  })
})

describe('duração e vídeo', () => {
  it('estima leitura com mínimo de 1 minuto', () => {
    expect(lessonMinutes(ebook.lessons[0])).toBe(1)
    expect(lessonMinutes({ id: 'x', title: 'X', body: [{ type: 'p', text: Array(600).fill('p').join(' ') }] })).toBe(3)
  })

  it('monta a URL do player e recusa IDs estranhos', () => {
    expect(videoEmbedUrl(series.lessons[0])).toMatch(/^https:\/\/www\.youtube-nocookie\.com\/embed\/abcdEFGH_12\?/)
    expect(videoEmbedUrl(series.lessons[2])).toMatch(/^https:\/\/player\.vimeo\.com\/video\/123456\?/)
    expect(videoEmbedUrl({ id: 'x', title: 'X', video: { provider: 'youtube', id: 'a"><script>' } })).toBeNull()
    expect(videoEmbedUrl(series.lessons[1])).toBeNull()
  })
})

describe('armazenamento', () => {
  beforeEach(() => localStorage.clear())

  it('ignora dado corrompido', () => {
    localStorage.setItem(STORAGE_KEYS.library, '[1,2]')
    expect(loadLibraryProgress()).toEqual({})
    localStorage.setItem(STORAGE_KEYS.libraryReader, '9')
    expect(loadReaderSize()).toBe(1)
  })
})

// O catálogo é editado à mão: estas regras evitam publicar algo quebrado
describe('catálogo da Biblioteca', () => {
  it('IDs únicos', () => {
    const ids = LIBRARY.map(i => i.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const item of LIBRARY) {
      const lids = item.lessons.map(l => l.id)
      expect(new Set(lids).size, item.id).toBe(lids.length)
    }
  })

  it('IDs sem ":" (separador do link direto)', () => {
    for (const item of LIBRARY) {
      expect(item.id).not.toContain(':')
      for (const l of item.lessons) expect(l.id).not.toContain(':')
    }
  })

  it('todo item tem aula, tema válido e texto', () => {
    for (const item of LIBRARY) {
      expect(item.lessons.length, item.id).toBeGreaterThan(0)
      expect(TOPIC_ORDER).toContain(item.topic)
      expect(item.title && item.subtitle && item.description, item.id).toBeTruthy()
    }
  })

  it('e-books têm todos os capítulos com texto; vídeos válidos geram player', () => {
    for (const item of LIBRARY) {
      for (const l of item.lessons) {
        if (item.kind === 'ebook') expect(isLessonAvailable(item, l), `${item.id}/${l.id}`).toBe(true)
        if (item.kind === 'video' && l.video && l.video.provider !== 'file') {
          expect(videoEmbedUrl(l), `${item.id}/${l.id}`).not.toBeNull()
        }
        if (item.kind === 'video') expect(l.minutes, `${item.id}/${l.id}`).toBeGreaterThan(0)
      }
    }
  })

  it('PDF e vídeos locais apontam para arquivos do próprio app', () => {
    for (const item of LIBRARY) {
      if (item.pdf) expect(item.pdf.startsWith('/')).toBe(true)
      for (const l of item.lessons) {
        if (l.video?.provider === 'file') expect(l.video.url.startsWith('/')).toBe(true)
      }
    }
  })
})
