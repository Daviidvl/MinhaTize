import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  ChevronLeft, ChevronRight, BookOpen, Play, Clock, Compass, Syringe, Utensils, Dumbbell, Brain,
  Lightbulb, AlertTriangle, WifiOff, Download, Check, LibraryBig, AArrowDown, AArrowUp, type LucideIcon,
} from 'lucide-react'
import {
  LIBRARY, TOPIC_LABEL, TOPIC_ORDER,
  type LibraryItem, type LibraryLesson, type LibraryKind, type LibraryTopic, type LibraryBlock,
} from '../data/library'
import {
  type LibraryProgress, loadLibraryProgress, saveLibraryProgress, itemProgress, isLessonAvailable,
  availableLessons, lessonMinutes, itemMinutes, nextLesson, lessonAfter, continueTarget,
  markLessonDone, unmarkLessonDone, openLesson, isLessonDone, videoEmbedUrl,
  READER_SIZES, loadReaderSize, saveReaderSize,
} from '../utils/libraryUtils'
import { HeroCard, HeroEyebrow, DarkMeter } from './HeroShared'

const FONT = 'Inter, -apple-system, sans-serif'

const TOPIC_ICON: Record<LibraryTopic, LucideIcon> = {
  inicio: Compass, tratamento: Syringe, alimentacao: Utensils, treino: Dumbbell, mente: Brain,
}

const KIND: Record<LibraryKind, {
  label: string; plural: string; one: string; many: string; Icon: LucideIcon
  start: string; resume: string; again: string; finished: string; finishItem: string
}> = {
  ebook: {
    label: 'E-book', plural: 'E-books', one: 'capítulo', many: 'capítulos', Icon: BookOpen,
    start: 'Começar a ler', resume: 'Continuar lendo', again: 'Ler de novo',
    finished: 'E-book concluído', finishItem: 'Concluir e-book',
  },
  video: {
    label: 'Vídeo-aula', plural: 'Vídeo-aulas', one: 'aula', many: 'aulas', Icon: Play,
    start: 'Assistir', resume: 'Continuar assistindo', again: 'Assistir de novo',
    finished: 'Série concluída', finishItem: 'Concluir série',
  },
}

const unitLabel = (kind: LibraryKind, n: number) => `${n} ${n === 1 ? KIND[kind].one : KIND[kind].many}`
const cap       = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function itemMeta(item: LibraryItem): string {
  const min = itemMinutes(item)
  return `${unitLabel(item.kind, item.lessons.length)} · ${min} min${item.kind === 'ebook' ? ' de leitura' : ''}`
}

type View =
  | { name: 'home' }
  | { name: 'item'; itemId: string }
  | { name: 'lesson'; itemId: string; lessonId: string }

function initialView(initial?: string): View {
  const [itemId, lessonId] = (initial ?? '').split(':')
  const item = LIBRARY.find(i => i.id === itemId)
  if (!item) return { name: 'home' }
  const lesson = item.lessons.find(l => l.id === lessonId)
  return lesson && isLessonAvailable(item, lesson)
    ? { name: 'lesson', itemId, lessonId }
    : { name: 'item', itemId }
}

// ── Peças visuais ─────────────────────────────────────────────────────────────
function SubHeader({ title, onBack, right }: { title: string; onBack: () => void; right?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <button onClick={onBack} aria-label="Voltar" style={{
        width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
        background: 'var(--surface-2)', border: '1px solid var(--border)',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-primary)',
      }}><ChevronLeft size={16} strokeWidth={1.75} /></button>
      <h2 style={{
        flex: 1, minWidth: 0, fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{title}</h2>
      {right}
    </div>
  )
}

function SectionLabel({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px', padding: '0 2px', margin: '0 0 8px' }}>
      <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
        {children}
      </p>
      {aside && <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>{aside}</span>}
    </div>
  )
}

function Bar({ pct, label }: { pct: number; label: string }) {
  const v = Math.round(Math.max(0, Math.min(1, pct)) * 100)
  return (
    <div className="progress-track" role="progressbar" aria-label={label} aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} style={{ height: '4px' }}>
      <div className="progress-fill" style={{ width: `${v}%` }} />
    </div>
  )
}

function Pill({ tone, icon, children }: { tone: 'good' | 'info' | 'muted' | 'solid'; icon?: ReactNode; children: ReactNode }) {
  const t = {
    good:  { bg: 'var(--teal-l)', fg: 'var(--teal-d)' },
    info:  { bg: 'var(--ice)',    fg: 'var(--cobalt)' },
    muted: { bg: 'var(--mist)',   fg: 'var(--ink-2)' },
    solid: { bg: 'var(--cobalt)', fg: '#fff' },          // selo sobre fundo --ice
  }[tone]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 9px', borderRadius: '99px',
      background: t.bg, color: t.fg, fontSize: '10px', fontWeight: 800, letterSpacing: '0.02em', whiteSpace: 'nowrap',
    }}>
      {icon}{children}
    </span>
  )
}

// Capa desenhada com a paleta: e-book tem lombada, vídeo tem botão de play
function Cover({ item, width, height, radius }: { item: LibraryItem; width: number; height: number; radius: number }) {
  const TopicIcon = TOPIC_ICON[item.topic]
  const KindIcon  = KIND[item.kind].Icon
  const play      = Math.round(width * 0.44)
  return (
    <div aria-hidden style={{
      width, height, borderRadius: radius, flexShrink: 0, position: 'relative', overflow: 'hidden',
      background: 'var(--g-hero)', boxShadow: '0 4px 14px rgba(var(--shadow-rgb),0.22)',
    }}>
      <div style={{ position: 'absolute', top: -height * 0.25, right: -width * 0.35, width: width * 1.1, height: width * 1.1, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
      <TopicIcon size={Math.round(width * 0.78)} strokeWidth={1.5} color="rgba(255,255,255,0.13)"
        style={{ position: 'absolute', right: -width * 0.16, bottom: -width * 0.12 }} />
      {item.kind === 'ebook' ? (
        <>
          <div style={{ position: 'absolute', left: Math.max(4, width * 0.08), top: 0, bottom: 0, width: '2px', background: 'rgba(255,255,255,0.20)' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <KindIcon size={Math.round(width * 0.34)} strokeWidth={width >= 80 ? 1.5 : 1.75} color="#fff" />
          </div>
        </>
      ) : (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: play, height: play, borderRadius: '50%',
            background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.24)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Play size={Math.round(play * 0.42)} strokeWidth={2} color="#fff" fill="#fff" style={{ marginLeft: '8%' }} />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Linha de conteúdo (lista da Biblioteca) ───────────────────────────────────
function ItemRow({ item, progress, onOpen }: { item: LibraryItem; progress: LibraryProgress; onOpen: () => void }) {
  const prog  = itemProgress(item, progress)
  const soon  = prog.total === 0
  const kind  = KIND[item.kind]

  let status: ReactNode = null
  if (prog.complete)      status = <Pill tone="good" icon={<Check size={11} strokeWidth={2.5} />}>Concluído</Pill>
  else if (soon)          status = <Pill tone="muted" icon={<Clock size={11} strokeWidth={2.5} />}>Em breve</Pill>
  else if (!prog.started && item.isNew) status = <Pill tone="info">Novo</Pill>

  return (
    <button onClick={onOpen} className="meal-row" aria-label={`${kind.label}: ${item.title}`} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 14px 12px 12px',
      borderRadius: '20px', border: 'none', background: 'var(--surface)', textAlign: 'left', cursor: 'pointer',
      boxShadow: 'inset 0 0 0 1px var(--line), var(--shadow-card)', fontFamily: FONT,
    }}>
      <Cover item={item} width={60} height={76} radius={14} />

      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--cobalt)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {kind.label}
          </span>
          {status}
        </span>
        <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.2px', lineHeight: 1.25 }}>
          {item.title}
        </span>
        <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--ink-2)', lineHeight: 1.35 }}>
          {itemMeta(item)}
        </span>
        {prog.started && !prog.complete && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <span style={{ flex: 1 }}><Bar pct={prog.pct} label={`Progresso de ${item.title}`} /></span>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--ink-2)', whiteSpace: 'nowrap' }}>
              {prog.done} de {prog.total}
            </span>
          </span>
        )}
      </span>

      <ChevronRight size={16} strokeWidth={2} color="var(--ink-2)" style={{ flexShrink: 0 }} />
    </button>
  )
}

// ── Destaque do topo: continuar ou começar ────────────────────────────────────
function HeroHighlight({ item, lesson, progress, mode, onOpen }: {
  item: LibraryItem; lesson: LibraryLesson; progress: LibraryProgress
  mode: 'continue' | 'start'; onOpen: () => void
}) {
  const kind   = KIND[item.kind]
  const prog   = itemProgress(item, progress)
  const pos    = item.lessons.findIndex(l => l.id === lesson.id) + 1
  const action = mode === 'continue' ? kind.resume : kind.start

  return (
    <button onClick={onOpen} aria-label={`${action}: ${item.title}`} className="meal-row"
      style={{ background: 'none', border: 'none', padding: 0, width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: FONT, borderRadius: '22px' }}>
      <HeroCard>
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <HeroEyebrow>{mode === 'continue' ? 'Continue de onde parou' : 'Comece por aqui'}</HeroEyebrow>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '15px', flexShrink: 0,
              background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <kind.Icon size={24} strokeWidth={1.75} color="#fff" />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: '17px', fontWeight: 800, color: '#fff', margin: '0 0 3px', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                {item.title}
              </p>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#fff', opacity: 0.85, margin: 0, lineHeight: 1.35 }}>
                {mode === 'continue'
                  ? `${cap(kind.one)} ${pos} de ${item.lessons.length} · ${lesson.title}`
                  : item.subtitle}
              </p>
            </div>
          </div>

          {mode === 'continue'
            ? <DarkMeter label="Seu progresso" value={`${prog.done} de ${prog.total}`} pct={prog.pct * 100} />
            : <p style={{ fontSize: '11px', fontWeight: 600, color: '#fff', opacity: 0.8, margin: 0 }}>{itemMeta(item)}</p>}

          <span style={{
            alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '7px',
            padding: '10px 16px', borderRadius: '12px', color: '#fff',
            background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.24)',
            fontSize: '13px', fontWeight: 800,
          }}>
            {item.kind === 'video'
              ? <Play size={14} strokeWidth={2} fill="currentColor" />
              : <BookOpen size={15} strokeWidth={2} />}
            {action}
          </span>
        </div>
      </HeroCard>
    </button>
  )
}

// ── Tela inicial da Biblioteca ────────────────────────────────────────────────
type Filter = 'all' | LibraryKind

function HomeView({ progress, onBack, onItem, onLesson }: {
  progress: LibraryProgress
  onBack: () => void
  onItem: (item: LibraryItem) => void
  onLesson: (item: LibraryItem, lesson: LibraryLesson) => void
}) {
  const [filter, setFilter] = useState<Filter>('all')

  const cont = continueTarget(LIBRARY, progress)
  const startItem = cont ? null
    : LIBRARY.find(i => i.featured && !itemProgress(i, progress).complete && availableLessons(i).length)
      ?? LIBRARY.find(i => !itemProgress(i, progress).started && availableLessons(i).length)
  const startLesson = startItem ? nextLesson(startItem, progress) : null

  const visible   = LIBRARY.filter(i => filter === 'all' || i.kind === filter)
  const completed = LIBRARY.filter(i => itemProgress(i, progress).complete).length

  const filters: { id: Filter; label: string; count: number }[] = [
    { id: 'all',   label: 'Todos',              count: LIBRARY.length },
    { id: 'video', label: KIND.video.plural,    count: LIBRARY.filter(i => i.kind === 'video').length },
    { id: 'ebook', label: KIND.ebook.plural,    count: LIBRARY.filter(i => i.kind === 'ebook').length },
  ]

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <SubHeader title="Biblioteca" onBack={onBack} />

      <div style={{ marginTop: '-8px' }}>
        <p style={{ fontSize: '13px', color: 'var(--ink-2)', margin: 0, lineHeight: 1.5 }}>
          Vídeo-aulas e e-books para entender e aproveitar melhor o seu tratamento.
        </p>
        {completed > 0 && (
          <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--teal-d)', margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Check size={13} strokeWidth={2.5} />
            {completed} de {LIBRARY.length} conteúdos concluídos
          </p>
        )}
      </div>

      {cont && (
        <HeroHighlight item={cont.item} lesson={cont.lesson} progress={progress} mode="continue"
          onOpen={() => onLesson(cont.item, cont.lesson)} />
      )}
      {!cont && startItem && startLesson && (
        <HeroHighlight item={startItem} lesson={startLesson} progress={progress} mode="start"
          onOpen={() => onItem(startItem)} />
      )}

      {/* Filtro por formato */}
      <div role="group" aria-label="Filtrar por formato" style={{
        display: 'flex', gap: '4px', padding: '4px', borderRadius: '14px',
        background: 'var(--surface-2)', border: '1px solid var(--border)',
      }}>
        {filters.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} aria-pressed={filter === f.id}
            className={`inner-tab${filter === f.id ? ' active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', minHeight: '38px' }}>
            {f.label}
            <span style={{ fontSize: '10px', fontWeight: 700, opacity: filter === f.id ? 0.85 : 0.7 }}>{f.count}</span>
          </button>
        ))}
      </div>

      {/* Conteúdos por tema */}
      <div key={filter} className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {TOPIC_ORDER.map(topic => {
          const items = visible.filter(i => i.topic === topic)
          if (!items.length) return null
          return (
            <section key={topic}>
              <SectionLabel>{TOPIC_LABEL[topic]}</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {items.map(item => (
                  <ItemRow key={item.id} item={item} progress={progress} onOpen={() => onItem(item)} />
                ))}
              </div>
            </section>
          )
        })}

        {!visible.length && (
          <div className="card" style={{ textAlign: 'center', padding: '28px 20px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px', margin: '0 auto 12px',
              background: 'var(--ice)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <LibraryBig size={22} strokeWidth={1.75} color="var(--cobalt)" />
            </div>
            <p style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 4px' }}>Nada por aqui ainda</p>
            <p style={{ fontSize: '12px', color: 'var(--ink-2)', margin: 0, lineHeight: 1.5 }}>Novos conteúdos aparecem nesta área assim que forem publicados.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Lista de aulas/capítulos ──────────────────────────────────────────────────
function LessonList({ item, progress, currentId, onLesson }: {
  item: LibraryItem; progress: LibraryProgress; currentId?: string
  onLesson: (lesson: LibraryLesson) => void
}) {
  const upNext = nextLesson(item, progress)
  const allDone = itemProgress(item, progress).complete

  return (
    <div className="card" style={{ padding: '6px' }}>
      {item.lessons.map((lesson, i) => {
        const avail   = isLessonAvailable(item, lesson)
        const done    = isLessonDone(progress, item.id, lesson.id)
        const current = currentId ? lesson.id === currentId : !allDone && lesson.id === upNext?.id
        const dot = done
          ? { bg: 'var(--teal-l)', fg: 'var(--teal-d)', node: <Check size={14} strokeWidth={2.5} /> }
          : current
            ? { bg: 'var(--g-cta)', fg: '#fff', node: i + 1 }
            : avail
              ? { bg: 'var(--ice)', fg: 'var(--cobalt)', node: i + 1 }
              : { bg: 'var(--mist)', fg: 'var(--ink-2)', node: <Clock size={13} strokeWidth={2} /> }

        return (
          <div key={lesson.id}>
            {i > 0 && <div style={{ height: '1px', background: 'var(--line)', margin: '0 12px 0 56px' }} />}
            <button
              onClick={() => avail && onLesson(lesson)}
              disabled={!avail}
              aria-current={currentId === lesson.id ? 'true' : undefined}
              aria-label={`${cap(KIND[item.kind].one)} ${i + 1}: ${lesson.title}${done ? ', concluído' : ''}${avail ? '' : ', em breve'}`}
              className={avail ? 'meal-row' : undefined}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 10px',
                borderRadius: '14px', border: 'none', textAlign: 'left', fontFamily: FONT,
                background: currentId === lesson.id ? 'var(--mist)' : 'transparent',
                cursor: avail ? 'pointer' : 'default',
              }}
            >
              <span style={{
                width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                background: dot.bg, color: dot.fg, fontSize: '12px', fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{dot.node}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{
                  display: 'block', fontSize: '13px', fontWeight: current ? 800 : 700, lineHeight: 1.3,
                  color: avail ? 'var(--ink)' : 'var(--ink-2)',
                }}>{lesson.title}</span>
                <span style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'var(--ink-2)', marginTop: '2px' }}>
                  {avail ? `${lessonMinutes(lesson)} min` : 'Em breve'}
                </span>
              </span>
              {avail && <ChevronRight size={15} strokeWidth={2} color="var(--ink-2)" style={{ flexShrink: 0 }} />}
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ── Detalhe do conteúdo ───────────────────────────────────────────────────────
function ItemView({ item, progress, onBack, onLesson }: {
  item: LibraryItem; progress: LibraryProgress
  onBack: () => void; onLesson: (lesson: LibraryLesson) => void
}) {
  const kind  = KIND[item.kind]
  const prog  = itemProgress(item, progress)
  const next  = nextLesson(item, progress)
  const TopicIcon = TOPIC_ICON[item.topic]
  const cta = prog.total === 0 ? 'Em breve' : prog.complete ? kind.again : prog.started ? kind.resume : kind.start

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <SubHeader title={kind.label} onBack={onBack} />

      {/* Capa */}
      <div style={{
        background: 'var(--g-hero)', borderRadius: '26px', padding: '22px 22px 20px', color: '#fff',
        boxShadow: '0 10px 40px rgba(var(--shadow-rgb),0.28), 0 2px 8px rgba(var(--shadow-rgb),0.18)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        <TopicIcon size={150} strokeWidth={1.5} color="rgba(255,255,255,0.08)" aria-hidden
          style={{ position: 'absolute', right: '-26px', bottom: '-30px', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '99px',
              background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.16)',
              fontSize: '11px', fontWeight: 800, color: '#fff',
            }}>
              <kind.Icon size={12} strokeWidth={2} />{kind.label}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff', opacity: 0.8 }}>{TOPIC_LABEL[item.topic]}</span>
          </div>

          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', letterSpacing: '-0.6px', lineHeight: 1.15, margin: '0 0 6px' }}>
              {item.title}
            </h1>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#fff', opacity: 0.85, margin: 0, lineHeight: 1.4 }}>
              {item.subtitle}
            </p>
          </div>

          <p style={{ fontSize: '11px', fontWeight: 700, color: '#fff', opacity: 0.8, margin: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Clock size={12} strokeWidth={2} />{itemMeta(item)}
          </p>

          {prog.complete ? (
            <span style={{
              alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 11px', borderRadius: '99px',
              background: 'rgba(255,255,255,0.14)', fontSize: '12px', fontWeight: 800, color: '#fff',
            }}>
              <Check size={13} strokeWidth={2.5} color="var(--aqua)" />{kind.finished}
            </span>
          ) : prog.started && (
            <DarkMeter label="Seu progresso" value={`${prog.done} de ${prog.total}`} pct={prog.pct * 100} />
          )}
        </div>
      </div>

      <p style={{ fontSize: '14px', color: 'var(--ink-2)', lineHeight: 1.65, margin: 0 }}>{item.description}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button className="btn-primary" disabled={!next} onClick={() => next && onLesson(next)} style={{ width: '100%' }}>
          {!next
            ? <Clock size={17} strokeWidth={2} />
            : item.kind === 'video' ? <Play size={16} strokeWidth={2} fill="currentColor" /> : <BookOpen size={17} strokeWidth={2} />}
          {cta}
        </button>
        {item.pdf && (
          <a href={item.pdf} download className="btn-ghost" style={{ width: '100%', gap: '8px', textDecoration: 'none' }}>
            <Download size={16} strokeWidth={2} />Baixar PDF
          </a>
        )}
        {prog.total === 0 && (
          <p style={{ fontSize: '12px', color: 'var(--ink-2)', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
            {item.kind === 'video'
              ? 'As aulas desta série estão sendo gravadas e aparecem aqui assim que forem publicadas.'
              : 'Os capítulos deste e-book estão sendo preparados e aparecem aqui assim que forem publicados.'}
          </p>
        )}
      </div>

      <section>
        <SectionLabel aside={prog.total > 0 ? `${prog.done} de ${prog.total} ${prog.total === 1 ? 'concluído' : 'concluídos'}` : undefined}>
          {cap(kind.many)}
        </SectionLabel>
        <LessonList item={item} progress={progress} onLesson={onLesson} />
      </section>
    </div>
  )
}

// ── Player de vídeo ───────────────────────────────────────────────────────────
function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])
  return online
}

function VideoPlayer({ lesson }: { lesson: LibraryLesson }) {
  const online = useOnline()
  const [loaded, setLoaded] = useState(false)
  const embed = videoEmbedUrl(lesson)
  const file  = lesson.video?.provider === 'file' ? lesson.video.url : null

  return (
    <div style={{
      position: 'relative', width: '100%', aspectRatio: '16 / 9', borderRadius: '20px', overflow: 'hidden',
      background: 'var(--g-hero)', boxShadow: '0 10px 30px rgba(var(--shadow-rgb),0.24)',
    }}>
      {/* Fundo enquanto o player carrega */}
      {!loaded && (
        <div aria-hidden style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="animate-pulse-soft" style={{
            width: '60px', height: '60px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.24)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {online
              ? <Play size={24} strokeWidth={2} color="#fff" fill="#fff" style={{ marginLeft: '4px' }} />
              : <WifiOff size={24} strokeWidth={1.75} color="#fff" />}
          </div>
        </div>
      )}

      {!online && !loaded ? (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '14px 16px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', fontWeight: 800, color: '#fff', margin: '0 0 2px' }}>Sem conexão</p>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#fff', opacity: 0.85, margin: 0 }}>
            Os vídeos precisam de internet. Os e-books funcionam offline.
          </p>
        </div>
      ) : file ? (
        <video
          src={file} controls playsInline preload="metadata"
          onLoadedMetadata={() => setLoaded(true)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: 'transparent' }}
        />
      ) : embed ? (
        <iframe
          src={embed}
          title={lesson.title}
          onLoad={() => setLoaded(true)}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none',
            opacity: loaded ? 1 : 0, transition: 'opacity var(--t-base) ease',
          }}
        />
      ) : null}
    </div>
  )
}

// ── Leitor de e-book ──────────────────────────────────────────────────────────
function Block({ block, size }: { block: LibraryBlock; size: number }) {
  const small = size - 1
  switch (block.type) {
    case 'p':
      return <p style={{ fontSize: size, lineHeight: 1.7, color: 'var(--ink)', margin: 0 }}>{block.text}</p>
    case 'h':
      return <h3 style={{ fontSize: size + 2, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.3px', lineHeight: 1.3, margin: '8px 0 0' }}>{block.text}</h3>
    case 'list':
      return (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {block.items.map((t, i) => (
            <li key={i} style={{ display: 'flex', gap: '12px', fontSize: size, lineHeight: 1.6, color: 'var(--ink)' }}>
              <span aria-hidden style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--cobalt)', flexShrink: 0, marginTop: `${size * 0.8 - 3}px` }} />
              <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{t}</span>
            </li>
          ))}
        </ul>
      )
    case 'tip':
      return (
        <aside style={{ display: 'flex', gap: '12px', padding: '14px 16px', borderRadius: '18px', background: 'var(--ice)' }}>
          <span style={{
            width: '30px', height: '30px', borderRadius: '9px', flexShrink: 0, background: 'var(--surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><Lightbulb size={16} strokeWidth={1.75} color="var(--cobalt)" /></span>
          <div style={{ minWidth: 0 }}>
            {block.title && <p style={{ fontSize: small, fontWeight: 800, color: 'var(--ink)', margin: '0 0 3px', lineHeight: 1.4 }}>{block.title}</p>}
            <p style={{ fontSize: small, lineHeight: 1.6, color: 'var(--ink)', margin: 0 }}>{block.text}</p>
          </div>
        </aside>
      )
    case 'warn':
      return (
        <aside style={{ display: 'flex', gap: '12px', padding: '14px 16px', borderRadius: '18px', background: 'var(--amber-bg)', boxShadow: 'inset 0 0 0 1px var(--amber-line)' }}>
          <span style={{
            width: '30px', height: '30px', borderRadius: '9px', flexShrink: 0, background: 'var(--surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><AlertTriangle size={16} strokeWidth={1.75} color="var(--amber)" /></span>
          <p style={{ fontSize: small, lineHeight: 1.6, color: 'var(--ink)', margin: 0, minWidth: 0 }}>{block.text}</p>
        </aside>
      )
  }
}

function ReaderSizeControl({ size, onChange }: { size: number; onChange: (i: number) => void }) {
  const btn = (disabled: boolean) => ({
    width: '36px', height: '32px', border: 'none', borderRadius: '10px', background: 'transparent',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--ink)', opacity: disabled ? 0.35 : 1, cursor: disabled ? 'default' : 'pointer',
  })
  return (
    <div role="group" aria-label="Tamanho da letra" style={{
      display: 'flex', padding: '2px', borderRadius: '12px', flexShrink: 0,
      background: 'var(--surface-2)', border: '1px solid var(--border)',
    }}>
      <button aria-label="Diminuir letra" disabled={size === 0} onClick={() => onChange(size - 1)} style={btn(size === 0)}>
        <AArrowDown size={17} strokeWidth={1.75} />
      </button>
      <button aria-label="Aumentar letra" disabled={size === READER_SIZES.length - 1} onClick={() => onChange(size + 1)} style={btn(size === READER_SIZES.length - 1)}>
        <AArrowUp size={17} strokeWidth={1.75} />
      </button>
    </div>
  )
}

// ── Aula / capítulo ───────────────────────────────────────────────────────────
function LessonView({ item, lesson, progress, onBack, onLesson, onDone, onUndo, onLibrary }: {
  item: LibraryItem; lesson: LibraryLesson; progress: LibraryProgress
  onBack: () => void
  onLesson: (lesson: LibraryLesson) => void
  onDone: () => LibraryProgress
  onUndo: () => void
  onLibrary: () => void
}) {
  const kind   = KIND[item.kind]
  const pos    = item.lessons.findIndex(l => l.id === lesson.id) + 1
  const done   = isLessonDone(progress, item.id, lesson.id)
  const after  = lessonAfter(item, lesson.id)
  const prog   = itemProgress(item, progress)
  const [sizeIdx, setSizeIdx] = useState(loadReaderSize)
  const [celebrate, setCelebrate] = useState(false)
  const celebrateRef = useRef<HTMLDivElement>(null)
  const size = READER_SIZES[sizeIdx]

  // Garante que o cartão de conclusão fique visível (e não atrás da barra inferior)
  useEffect(() => {
    if (celebrate) celebrateRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [celebrate])

  // Concluir esta aula fecharia o item inteiro?
  const closesItem = !done && prog.done === prog.total - 1

  function changeSize(i: number) { setSizeIdx(i); saveReaderSize(i) }

  function complete() {
    const p = onDone()
    if (itemProgress(item, p).complete) setCelebrate(true)
    else if (after) onLesson(after)
  }

  const primaryLabel = closesItem ? kind.finishItem : after ? `Concluir e ir para ${item.kind === 'ebook' ? 'o próximo' : 'a próxima'}` : `Concluir ${kind.one}`

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <SubHeader
        title={item.title}
        onBack={onBack}
        right={item.kind === 'ebook' ? <ReaderSizeControl size={sizeIdx} onChange={changeSize} /> : undefined}
      />

      {item.kind === 'video' && <VideoPlayer key={lesson.id} lesson={lesson} />}

      <header>
        <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--cobalt)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>
          {cap(kind.one)} {pos} de {item.lessons.length} · {lessonMinutes(lesson)} min
        </p>
        <h1 style={{ fontSize: item.kind === 'ebook' ? size + 9 : 21, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.6px', lineHeight: 1.2, margin: 0 }}>
          {lesson.title}
        </h1>
        {item.kind === 'video' && lesson.summary && (
          <p style={{ fontSize: '14px', color: 'var(--ink-2)', lineHeight: 1.6, margin: '8px 0 0' }}>{lesson.summary}</p>
        )}
      </header>

      {item.kind === 'ebook' && (
        <article style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {(lesson.body ?? []).map((b, i) => <Block key={i} block={b} size={size} />)}
        </article>
      )}

      {/* Fim da aula/capítulo */}
      {celebrate ? (
        <div ref={celebrateRef} role="status" className="scale-in" style={{
          borderRadius: '22px', padding: '22px 20px', textAlign: 'center',
          background: 'var(--teal-l)', boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--teal) 30%, var(--teal-l))',
        }}>
          <div className="check-btn is-done" style={{
            width: '52px', height: '52px', borderRadius: '50%', margin: '0 auto 12px', background: 'var(--teal)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Check size={26} strokeWidth={2.5} color="#fff" />
          </div>
          <p style={{ fontSize: '17px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 4px', letterSpacing: '-0.3px' }}>{kind.finished}!</p>
          <p style={{ fontSize: '13px', color: 'var(--ink-2)', margin: '0 0 16px', lineHeight: 1.5 }}>
            Você completou {unitLabel(item.kind, prog.total)} de “{item.title}”.
          </p>
          <button className="btn-primary" onClick={onLibrary} style={{ width: '100%' }}>
            <LibraryBig size={17} strokeWidth={1.75} />Voltar à biblioteca
          </button>
        </div>
      ) : (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '10px',
          ...(item.kind === 'ebook' ? { paddingTop: '20px', borderTop: '1px solid var(--line)' } : {}),
        }}>
          {done ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <Pill tone="good" icon={<Check size={12} strokeWidth={2.5} />}>
                  {item.kind === 'video' ? 'Aula concluída' : 'Capítulo concluído'}
                </Pill>
                <button onClick={onUndo} className="section-action">Desfazer</button>
              </div>
              {after
                ? <button className="btn-primary" onClick={() => onLesson(after)} style={{ width: '100%' }}>
                    {item.kind === 'ebook' ? 'Próximo capítulo' : 'Próxima aula'}<ChevronRight size={17} strokeWidth={2} />
                  </button>
                : <button className="btn-ghost" onClick={onBack} style={{ width: '100%' }}>
                    {item.kind === 'ebook' ? 'Ver todos os capítulos' : 'Ver todas as aulas'}
                  </button>}
            </>
          ) : (
            <button className="btn-primary" onClick={complete} style={{ width: '100%' }}>
              <Check size={17} strokeWidth={2.5} />{primaryLabel}
            </button>
          )}

          {after && (
            <button onClick={() => onLesson(after)} className="meal-row" style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px',
              borderRadius: '16px', border: 'none', background: 'var(--surface)', textAlign: 'left', cursor: 'pointer',
              boxShadow: 'inset 0 0 0 1px var(--line)', fontFamily: FONT,
            }}>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: 'var(--ink-2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>
                  A seguir · {lessonMinutes(after)} min
                </span>
                <span style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.3 }}>{after.title}</span>
              </span>
              <ChevronRight size={16} strokeWidth={2} color="var(--ink-2)" style={{ flexShrink: 0 }} />
            </button>
          )}
        </div>
      )}

      {item.kind === 'video' && (
        <section>
          <SectionLabel>{cap(kind.many)} da série</SectionLabel>
          <LessonList item={item} progress={progress} currentId={lesson.id} onLesson={onLesson} />
        </section>
      )}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Library({ onBack, initial }: { onBack: () => void; initial?: string }) {
  const [view, setView] = useState<View>(() => initialView(initial))
  const [progress, setProgress] = useState<LibraryProgress>(() => {
    // Link direto para uma aula já conta como "aberta"
    const v = initialView(initial)
    const p = loadLibraryProgress()
    if (v.name !== 'lesson') return p
    const next = openLesson(p, v.itemId, v.lessonId)
    saveLibraryProgress(next)
    return next
  })
  // "Concluir e seguir" faz duas atualizações no mesmo toque: a segunda precisa
  // partir do resultado da primeira, não do estado do último render
  const progressRef = useRef(progress)

  // Cada troca de tela começa do topo
  const viewKey = view.name === 'home' ? 'home' : view.name === 'item' ? view.itemId : `${view.itemId}:${view.lessonId}`
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [viewKey])

  function update(fn: (p: LibraryProgress) => LibraryProgress) {
    const next = fn(progressRef.current)
    progressRef.current = next
    saveLibraryProgress(next)
    setProgress(next)
    return next
  }

  function goLesson(item: LibraryItem, lesson: LibraryLesson) {
    update(p => openLesson(p, item.id, lesson.id))
    setView({ name: 'lesson', itemId: item.id, lessonId: lesson.id })
  }

  const item   = useMemo(() => view.name === 'home' ? null : LIBRARY.find(i => i.id === view.itemId) ?? null, [view])
  const lesson = view.name === 'lesson' && item ? item.lessons.find(l => l.id === view.lessonId) ?? null : null

  if (view.name === 'lesson' && item && lesson) {
    return (
      <LessonView
        key={lesson.id}
        item={item}
        lesson={lesson}
        progress={progress}
        onBack={() => setView({ name: 'item', itemId: item.id })}
        onLesson={l => goLesson(item, l)}
        onDone={() => update(p => markLessonDone(p, item.id, lesson.id))}
        onUndo={() => update(p => unmarkLessonDone(p, item.id, lesson.id))}
        onLibrary={() => setView({ name: 'home' })}
      />
    )
  }

  if (view.name !== 'home' && item) {
    return (
      <ItemView
        item={item}
        progress={progress}
        onBack={() => setView({ name: 'home' })}
        onLesson={l => goLesson(item, l)}
      />
    )
  }

  return (
    <HomeView
      progress={progress}
      onBack={onBack}
      onItem={i => setView({ name: 'item', itemId: i.id })}
      onLesson={goLesson}
    />
  )
}

// ── Widget da tela inicial ────────────────────────────────────────────────────
export function LibraryWidget({ onOpen }: { onOpen: () => void }) {
  const progress = loadLibraryProgress()
  const cont     = continueTarget(LIBRARY, progress)
  const hasNew   = LIBRARY.some(i => i.isNew && !itemProgress(i, progress).started)
  const ebooks   = LIBRARY.filter(i => i.kind === 'ebook').length
  const videos   = LIBRARY.filter(i => i.kind === 'video').length

  const prog = cont ? itemProgress(cont.item, progress) : null
  const pos  = cont ? cont.item.lessons.findIndex(l => l.id === cont.lesson.id) + 1 : 0

  return (
    <button
      onClick={onOpen}
      aria-label={cont ? `Biblioteca: continuar ${cont.item.title}` : 'Abrir a Biblioteca'}
      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: FONT }}
    >
      <div style={{
        borderRadius: '26px', padding: '18px 20px', background: 'var(--ice)',
        boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--cobalt) 22%, var(--ice)), 0 8px 22px rgba(var(--shadow-rgb),0.10), 0 2px 6px rgba(var(--shadow-rgb),0.08)',
        position: 'relative', overflow: 'hidden', transition: 'transform 0.15s, box-shadow 0.2s',
      }}>
        <div style={{ position: 'absolute', top: '-32px', right: '-32px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.35)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', position: 'relative' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <p style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', margin: 0, color: 'var(--cobalt)' }}>
                Biblioteca
              </p>
              {hasNew && !cont && <Pill tone="solid">Novo</Pill>}
            </div>
            <p style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 4px', letterSpacing: '-0.3px', lineHeight: 1.25 }}>
              {cont ? cont.item.title : 'Vídeo-aulas e e-books'}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--ink-2)', fontWeight: 600, margin: 0 }}>
              {cont
                ? `Continuar · ${KIND[cont.item.kind].one} ${pos} de ${cont.item.lessons.length}`
                : `${ebooks} ${ebooks === 1 ? 'e-book' : 'e-books'} · ${videos} ${videos === 1 ? 'série' : 'séries'} de vídeo-aulas`}
            </p>
            {cont && prog && (
              <div style={{ marginTop: '10px' }}>
                <Bar pct={prog.pct} label={`Progresso de ${cont.item.title}`} />
              </div>
            )}
          </div>
          <div style={{
            width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0,
            background: 'rgba(255,255,255,0.65)', border: '1px solid color-mix(in srgb, var(--cobalt) 22%, var(--ice))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <LibraryBig size={22} strokeWidth={1.75} color="var(--cobalt)" />
          </div>
        </div>
      </div>
    </button>
  )
}
