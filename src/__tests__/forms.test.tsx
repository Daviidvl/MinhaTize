import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProfileSetup from '../components/ProfileSetup'
import ProgressHub from '../components/ProgressHub'
import { todayStr } from '../utils/dateUtils'
import type { UserProfile } from '../types'

// Testes de auditoria — validação de formulários (valores absurdos não entram).

const continuar = () => screen.getByRole('button', { name: /continuar/i }) as HTMLButtonElement

describe('ProfileSetup validation', () => {
  beforeEach(() => localStorage.clear())

  async function goToStep2() {
    const user = userEvent.setup()
    render(<ProfileSetup onComplete={vi.fn()} />)
    await user.type(screen.getByPlaceholderText(/seu nome ou apelido/i), 'Maria')
    await user.click(continuar())
    await screen.findByPlaceholderText('Ex: 168')
    return user
  }

  it('requires a name with at least 2 characters', async () => {
    const user = userEvent.setup()
    render(<ProfileSetup onComplete={vi.fn()} />)
    expect(continuar().disabled).toBe(true)
    await user.type(screen.getByPlaceholderText(/seu nome ou apelido/i), 'M')
    expect(continuar().disabled).toBe(true)
  })

  it('leaves age optional but blocks minors and impossible ages', async () => {
    const user = userEvent.setup()
    render(<ProfileSetup onComplete={vi.fn()} />)
    await user.type(screen.getByPlaceholderText(/seu nome ou apelido/i), 'Maria')
    expect(continuar().disabled).toBe(false)

    const age = screen.getByPlaceholderText('Ex: 35')
    for (const [value, message] of [['-5', /idade válida/i], ['17', /maiores de 18/i], ['150', /idade válida/i]] as const) {
      await user.clear(age)
      await user.type(age, value)
      expect(screen.getByText(message)).toBeTruthy()
      expect(continuar().disabled).toBe(true)
    }

    await user.clear(age)
    await user.type(age, '35')
    expect(continuar().disabled).toBe(false)
  })

  it('blocks an out-of-range PESO ATUAL instead of only showing the error', async () => {
    const user = await goToStep2()
    await user.type(screen.getByPlaceholderText('Ex: 168'), '170')
    await user.type(screen.getByPlaceholderText('Ex: 92'), '90')
    expect(continuar().disabled).toBe(false)

    const current = screen.getByPlaceholderText('Ex: 88.5')
    await user.type(current, '9999')
    expect(screen.getByText(/fora dos limites/i)).toBeTruthy()
    expect(continuar().disabled).toBe(true)

    await user.clear(current)
    await user.type(current, '88')
    expect(continuar().disabled).toBe(false)
  })

  it('blocks impossible height and weight', async () => {
    const user = await goToStep2()
    await user.type(screen.getByPlaceholderText('Ex: 168'), '9999')
    await user.type(screen.getByPlaceholderText('Ex: 92'), '90')
    expect(continuar().disabled).toBe(true)
  })
})

describe('ProgressHub weigh-ins', () => {
  const base: UserProfile = {
    name: 'Maria', medication: 'tirzepatida', startWeight: 90, goalWeight: 70, height: 165,
    startDate: '2026-09-01', weightHistory: [{ date: '2026-09-08', weight: 89 }], diary: [], sideEffects: [],
  }

  afterEach(() => { vi.useRealTimers() })

  it('saves one weigh-in dated today (device timezone)', async () => {
    const onUpdate = vi.fn()
    const user = userEvent.setup()
    render(<ProgressHub profile={base} onUpdateProfile={onUpdate} />)
    await user.type(screen.getByPlaceholderText('Ex: 84.5'), '88.4')
    await user.click(screen.getByRole('button', { name: /salvar/i }))
    expect(onUpdate.mock.calls[0][0].weightHistory).toEqual([
      { date: '2026-09-08', weight: 89 },
      { date: todayStr(), weight: 88.4 },
    ])
  })

  it('replaces, instead of duplicating, a weigh-in registered twice on the same day', async () => {
    const onUpdate = vi.fn()
    const user = userEvent.setup()
    const withToday = { ...base, weightHistory: [...base.weightHistory, { date: todayStr(), weight: 88 }] }
    render(<ProgressHub profile={withToday} onUpdateProfile={onUpdate} />)
    await user.type(screen.getByPlaceholderText('Ex: 84.5'), '87.5{Enter}')
    const history = onUpdate.mock.calls[0][0].weightHistory
    expect(history.filter((e: { date: string }) => e.date === todayStr())).toEqual([{ date: todayStr(), weight: 87.5 }])
    expect(history).toHaveLength(2)
  })

  it('does not save out-of-range values', async () => {
    const onUpdate = vi.fn()
    const user = userEvent.setup()
    render(<ProgressHub profile={base} onUpdateProfile={onUpdate} />)
    for (const value of ['9999', '5', '-80', '0']) {
      const input = screen.getByPlaceholderText('Ex: 84.5')
      await user.clear(input)
      await user.type(input, `${value}{Enter}`)
    }
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('removes a weigh-in only after a second, explicit confirmation', async () => {
    const onUpdate = vi.fn()
    const user = userEvent.setup()
    render(<ProgressHub profile={base} onUpdateProfile={onUpdate} />)
    await user.click(screen.getByRole('button', { name: /remover pesagem de 89kg/i }))
    expect(onUpdate).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: /^remover$/i }))
    expect(onUpdate.mock.calls[0][0].weightHistory).toEqual([])
  })
})
