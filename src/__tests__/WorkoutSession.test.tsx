import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import WorkoutSession from '../components/WorkoutSession'
import { VOLUME } from '../data/exercisePlans'
import { readActiveSession, READY_MS } from '../utils/workoutSessionUtils'
import { todayStr } from '../utils/dateUtils'

// Treino guiado de ponta a ponta: configurar, preparar, séries, descanso e resumo.

const click = (name: RegExp) => fireEvent.click(screen.getByRole('button', { name }))

function setup() {
  const onProgress = vi.fn()
  const onFinish   = vi.fn()
  const onClose    = vi.fn()
  render(
    <WorkoutSession
      day={{ label: 'A', name: 'Peito + Tríceps', color: 'var(--teal-d)' }}
      items={[{ name: 'Supino reto', tip: 'Desça até o peito' }, { name: 'Tríceps polia' }]}
      level="beginner" volume={VOLUME.beginner} weightKg={80}
      resume={null} onProgress={onProgress} onFinish={onFinish} onClose={onClose}
    />,
  )
  return { onProgress, onFinish, onClose }
}

describe('WorkoutSession', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] })
    vi.setSystemTime(new Date(2026, 10, 23, 18, 0, 0))
  })
  afterEach(() => vi.useRealTimers())

  it('runs the workout set by set and ends with a summary', () => {
    const { onProgress, onFinish } = setup()

    // Antes de começar: plano, estimativa e opções (iniciante: 2–3 séries, 60 s de descanso)
    expect(screen.getByText('Treino guiado')).toBeTruthy()
    expect(screen.getByRole('button', { name: '2 séries' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByText(/kcal$/)).toBeTruthy()
    click(/começar treino/i)

    expect(screen.getByText('Prepare-se')).toBeTruthy()
    expect(readActiveSession(todayStr())?.phase).toBe('ready')

    // A preparação termina sozinha e o cronômetro de execução corre
    act(() => { vi.advanceTimersByTime(READY_MS + 12_000) })
    expect(screen.getByText('Série 1 de 2')).toBeTruthy()
    expect(screen.getByText('tempo de execução')).toBeTruthy()
    expect(screen.getByText('0:12')).toBeTruthy()

    click(/série concluída/i)
    expect(screen.getByText('Descanso')).toBeTruthy()
    expect(screen.getByText('1:00')).toBeTruthy()

    // +15 s no descanso
    click(/mais 15 segundos/i)
    expect(screen.getByText('1:15')).toBeTruthy()

    click(/pular descanso/i)
    expect(screen.getByText('Última série · 2 de 2')).toBeTruthy()
    click(/série concluída/i)
    expect(onProgress).toHaveBeenLastCalledWith('A', [0])

    // Próximo exercício: descanso conta sozinho até a série
    expect(screen.getByText('Próximo exercício')).toBeTruthy()
    act(() => { vi.advanceTimersByTime(61_000) })
    expect(screen.getByText('Tríceps polia')).toBeTruthy()
    click(/série concluída/i)
    click(/pular descanso/i)
    click(/série concluída/i)

    expect(screen.getByText('Resumo do treino')).toBeTruthy()
    expect(screen.getByText('Mandou muito bem!')).toBeTruthy()
    expect(onProgress).toHaveBeenLastCalledWith('A', [0, 1])
    expect(onFinish).toHaveBeenCalledTimes(1)
    expect(onFinish.mock.calls[0][0]).toMatchObject({ label: 'A', sets: 4, setsPlanned: 4, exercises: 2 })
    expect(onFinish.mock.calls[0][0].kcal).toBeGreaterThan(0)
    expect(readActiveSession(todayStr())).toBeNull()
  })

  it('asks before leaving and can pause to resume later', () => {
    const { onClose, onFinish } = setup()
    click(/começar treino/i)
    click(/começar agora/i)
    click(/encerrar ou sair/i)

    expect(screen.getByText('Sair do treino?')).toBeTruthy()
    click(/pausar e sair/i)
    expect(onClose).toHaveBeenCalled()
    expect(onFinish).not.toHaveBeenCalled()
    expect(readActiveSession(todayStr())?.pausedAt).not.toBeNull()
  })
})
