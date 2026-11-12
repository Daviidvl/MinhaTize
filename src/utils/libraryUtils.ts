import type { LibraryItem, LibraryLesson, LibraryBlock } from '../data/library'
import { readJSON, writeJSON } from './storage'
import { STORAGE_KEYS } from './storageKeys'

// Progresso da Biblioteca, por item: aulas/capítulos concluídos, o último aberto
// e quando foi aberto (para o "Continue de onde parou").
export interface ItemProgress {
  done: string[]
  last?: string
  at?: number
}
export type LibraryProgress = Record<string, ItemProgress>

export function loadLibraryProgress(): LibraryProgress {
  const raw = readJSON<unknown>(STORAGE_KEYS.library, {})
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as LibraryProgress : {}
}

export function saveLibraryProgress(p: LibraryProgress) {
  writeJSON(STORAGE_KEYS.library, p)
}

// ── Disponibilidade e duração ─────────────────────────────────────────────────
// Aula de vídeo sem fonte é "Em breve"; capítulo de e-book precisa de texto.
export function isLessonAvailable(item: LibraryItem, lesson: LibraryLesson): boolean {
  return item.kind === 'video' ? !!lesson.video : !!lesson.body?.length
}

export function availableLessons(item: LibraryItem): LibraryLesson[] {
  return item.lessons.filter(l => isLessonAvailable(item, l))
}

function blockWords(b: LibraryBlock): number {
  const text = b.type === 'list' ? b.items.join(' ') : b.type === 'tip' ? `${b.title ?? ''} ${b.text}` : b.text
  return text.split(/\s+/).filter(Boolean).length
}

const WORDS_PER_MINUTE = 200

export function lessonMinutes(lesson: LibraryLesson): number {
  if (lesson.minutes) return lesson.minutes
  const words = (lesson.body ?? []).reduce((s, b) => s + blockWords(b), 0)
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE))
}

export function itemMinutes(item: LibraryItem): number {
  return item.lessons.reduce((s, l) => s + lessonMinutes(l), 0)
}

// ── Progresso ─────────────────────────────────────────────────────────────────
export function itemProgress(item: LibraryItem, p: LibraryProgress) {
  const avail = availableLessons(item)
  const done  = new Set(p[item.id]?.done ?? [])
  const count = avail.filter(l => done.has(l.id)).length
  const total = avail.length
  return {
    done: count,
    total,
    pct: total ? count / total : 0,
    started: count > 0 || !!p[item.id]?.last,
    complete: total > 0 && count === total,
  }
}

export function isLessonDone(p: LibraryProgress, itemId: string, lessonId: string): boolean {
  return !!p[itemId]?.done.includes(lessonId)
}

export function markLessonDone(p: LibraryProgress, itemId: string, lessonId: string, now = Date.now()): LibraryProgress {
  const cur  = p[itemId] ?? { done: [] }
  const done = cur.done.includes(lessonId) ? cur.done : [...cur.done, lessonId]
  return { ...p, [itemId]: { ...cur, done, last: lessonId, at: now } }
}

export function unmarkLessonDone(p: LibraryProgress, itemId: string, lessonId: string): LibraryProgress {
  const cur = p[itemId]
  if (!cur) return p
  return { ...p, [itemId]: { ...cur, done: cur.done.filter(id => id !== lessonId) } }
}

export function openLesson(p: LibraryProgress, itemId: string, lessonId: string, now = Date.now()): LibraryProgress {
  const cur = p[itemId] ?? { done: [] }
  return { ...p, [itemId]: { ...cur, last: lessonId, at: now } }
}

// Próxima aula disponível ainda não concluída, a partir da última aberta.
// Tudo concluído: volta para a primeira (para rever).
export function nextLesson(item: LibraryItem, p: LibraryProgress): LibraryLesson | null {
  const avail = availableLessons(item)
  if (!avail.length) return null
  const done    = new Set(p[item.id]?.done ?? [])
  const lastIdx = avail.findIndex(l => l.id === p[item.id]?.last)
  const ordered = lastIdx > 0 ? [...avail.slice(lastIdx), ...avail.slice(0, lastIdx)] : avail
  return ordered.find(l => !done.has(l.id)) ?? avail[0]
}

// A aula disponível seguinte a esta, na ordem do item
export function lessonAfter(item: LibraryItem, lessonId: string): LibraryLesson | null {
  const avail = availableLessons(item)
  const idx   = avail.findIndex(l => l.id === lessonId)
  return idx >= 0 ? avail[idx + 1] ?? null : null
}

// Item em andamento aberto mais recentemente (não concluído)
export function continueTarget(items: LibraryItem[], p: LibraryProgress): { item: LibraryItem; lesson: LibraryLesson } | null {
  let best: { item: LibraryItem; lesson: LibraryLesson; at: number } | null = null
  for (const item of items) {
    const prog = itemProgress(item, p)
    const at   = p[item.id]?.at ?? 0
    if (!prog.started || prog.complete || !at) continue
    const lesson = nextLesson(item, p)
    if (lesson && (!best || at > best.at)) best = { item, lesson, at }
  }
  return best && { item: best.item, lesson: best.lesson }
}

// ── Vídeo ─────────────────────────────────────────────────────────────────────
// Só IDs simples entram na URL do player (o catálogo é nosso, mas não custa garantir)
const SAFE_ID = /^[A-Za-z0-9_-]{4,64}$/

export function videoEmbedUrl(lesson: LibraryLesson): string | null {
  const v = lesson.video
  if (!v || v.provider === 'file') return null
  if (!SAFE_ID.test(v.id)) return null
  if (v.provider === 'youtube') return `https://www.youtube-nocookie.com/embed/${v.id}?rel=0&modestbranding=1&playsinline=1`
  return `https://player.vimeo.com/video/${v.id}?dnt=1&title=0&byline=0&portrait=0`
}

// ── Leitura ───────────────────────────────────────────────────────────────────
export const READER_SIZES = [15, 17, 19] as const

export function loadReaderSize(): number {
  const i = readJSON<number>(STORAGE_KEYS.libraryReader, 1)
  return Number.isInteger(i) && i >= 0 && i < READER_SIZES.length ? i : 1
}

export function saveReaderSize(i: number) {
  writeJSON(STORAGE_KEYS.libraryReader, i)
}
