import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import LoginScreen from '../components/LoginScreen'
import ProfilePage from '../components/ProfilePage'
import { checkToken, saveToken, getStoredToken, clearToken, getAccessInfo } from '../utils/token'
import { STORAGE_KEYS } from '../utils/storageKeys'
import { PLANS, checkoutUrl } from '../data/plans'
import type { UserProfile } from '../types'

// Assinaturas no app: planos na tela de entrada, renovação de assinatura
// vencida (sem perder o token nem os dados) e plano/validade no Perfil.
// Quem decide o acesso é sempre o servidor (api/validate-token.ts).

const TOKEN = '123e4567-e89b-42d3-a456-426614174000'

const json = (data: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } }))

function mockFetch(impl: () => Promise<Response>) {
  const fn = vi.fn(impl)
  vi.stubGlobal('fetch', fn)
  return fn
}

const PROFILE: UserProfile = {
  name: 'Maria', medication: 'tirzepatida', startWeight: 90, goalWeight: 70, height: 170,
  startDate: '2026-10-01', currentDose: 2.5, applicationDay: 1, weightHistory: [], diary: [], sideEffects: [],
}

describe('subscriptions in the app', () => {
  beforeEach(() => {
    localStorage.clear()
    import.meta.env.DEV = false
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    import.meta.env.DEV = true
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  describe('utils/token', () => {
    it("reports an expired subscription as 'expired', not 'invalid'", async () => {
      mockFetch(() => json({ valid: false, reason: 'expired', plan: 'mensal' }))
      expect(await checkToken(TOKEN)).toBe('expired')
      mockFetch(() => json({ valid: false }))
      expect(await checkToken(TOKEN)).toBe('invalid')
    })

    it('keeps the plan and the paid period from the server, and drops them on logout', async () => {
      mockFetch(() => json({ valid: true, access: { type: 'subscription', plan: 'anual', paidUntil: '2027-11-27T00:00:00.000Z' } }))
      await checkToken(TOKEN)
      expect(getAccessInfo()).toEqual({ type: 'subscription', plan: 'anual', paidUntil: '2027-11-27T00:00:00.000Z' })
      clearToken()
      expect(getAccessInfo()).toBeNull()
    })

    it('ignores malformed access info', async () => {
      mockFetch(() => json({ valid: true, access: { type: 'premium', plan: 1 } }))
      await checkToken(TOKEN)
      expect(getAccessInfo()).toBeNull()
    })
  })

  describe('login screen', () => {
    it('shows the three plans, each linking to its Wiven checkout offer', () => {
      render(<LoginScreen onAccessGranted={() => {}} />)
      expect(screen.getByText(/ainda não tem acesso/i)).toBeTruthy()
      const links = screen.getAllByRole('link', { name: /assinar o plano/i })
      expect(links).toHaveLength(3)
      expect(links.map(a => a.getAttribute('href'))).toEqual(PLANS.map(checkoutUrl))
      expect(links.map(a => a.getAttribute('href'))).toEqual([
        'https://checkout.wiven.com.br/checkout/cmwlix69s08so01oeq372pzco?offer=R0J641X',
        'https://checkout.wiven.com.br/checkout/cmwlix69s08so01oeq372pzco?offer=9DOLKIA',
        'https://checkout.wiven.com.br/checkout/cmwlix69s08so01oeq372pzco?offer=73288O2',
      ])
      for (const a of links) {
        expect(a.getAttribute('target')).toBe('_blank')
        expect(a.getAttribute('rel')).toContain('noopener')
      }
      expect(screen.getByText('R$ 19,90')).toBeTruthy()
      expect(screen.getByText('R$ 49,90')).toBeTruthy()
      expect(screen.getByText('R$ 179,90')).toBeTruthy()
    })
  })

  describe('<App /> with an expired subscription', () => {
    it('offers renewal and keeps the token and the health data', async () => {
      saveToken(TOKEN)
      localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify({ name: 'Maria' }))
      mockFetch(() => json({ valid: false, reason: 'expired', plan: 'mensal' }))
      render(<App />)
      expect(await screen.findByText(/sua assinatura venceu/i)).toBeTruthy()
      expect(screen.getAllByRole('link', { name: /assinar o plano/i })).toHaveLength(3)
      expect(getStoredToken()).toBe(TOKEN)
      expect(localStorage.getItem(STORAGE_KEYS.profile)).toContain('Maria')
    })

    it('"Já renovei" lets the same token back in once the renewal is confirmed', async () => {
      saveToken(TOKEN)
      let renewed = false
      mockFetch(() => json(renewed ? { valid: true } : { valid: false, reason: 'expired' }))
      render(<App />)
      const button = await screen.findByRole('button', { name: /já renovei/i })

      // Ainda não confirmada: avisa e continua na tela
      await userEvent.click(button)
      expect(await screen.findByText(/ainda não recebemos a confirmação/i)).toBeTruthy()

      renewed = true
      await userEvent.click(screen.getByRole('button', { name: /já renovei/i }))
      expect(await screen.findByText(/termos de uso e privacidade/i)).toBeTruthy()
      expect(getStoredToken()).toBe(TOKEN)
    })

    it('still logs out a token the server reports as invalid (revoked)', async () => {
      saveToken(TOKEN)
      mockFetch(() => json({ valid: false }))
      render(<App />)
      expect(await screen.findByPlaceholderText(/cole aqui/i)).toBeTruthy()
      expect(screen.queryByText(/sua assinatura venceu/i)).toBeNull()
      expect(getStoredToken()).toBeNull()
    })
  })

  describe('profile', () => {
    const renderProfile = () => render(<ProfilePage profile={PROFILE} onUpdateProfile={() => {}} onBack={() => {}} />)

    it('shows the plan and until when it is paid', async () => {
      localStorage.setItem(STORAGE_KEYS.accessInfo, JSON.stringify({ type: 'subscription', plan: 'trimestral', paidUntil: '2027-02-27T12:00:00.000Z' }))
      renderProfile()
      const row = screen.getByRole('button', { name: /plano/i })
      expect(within(row).getByText('Trimestral · até 27/02/2027')).toBeTruthy()

      await userEvent.click(row)
      expect(screen.getByText('Plano Trimestral')).toBeTruthy()
      expect(screen.getByText('Válido até 27/02/2027')).toBeTruthy()
      expect(screen.getByRole('button', { name: /falar com o suporte/i })).toBeTruthy()
    })

    it('shows lifetime access for an old purchase', () => {
      localStorage.setItem(STORAGE_KEYS.accessInfo, JSON.stringify({ type: 'legacy_purchase', plan: null, paidUntil: null }))
      renderProfile()
      expect(within(screen.getByRole('button', { name: /plano/i })).getByText('Vitalício')).toBeTruthy()
    })

    it('hides the section until the server has told the app the access type', () => {
      renderProfile()
      expect(screen.queryByText(/minha assinatura/i)).toBeNull()
    })
  })
})
