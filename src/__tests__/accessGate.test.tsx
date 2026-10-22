import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { extractToken, validateToken, checkToken, saveToken, getStoredToken, clearToken } from '../utils/token'
import { STORAGE_KEYS } from '../utils/storageKeys'

// Testes de auditoria — fluxo de acesso (login por token, logout, sessão salva).

const TOKEN = '123e4567-e89b-42d3-a456-426614174000'
const OTHER_TOKEN = '223e4567-e89b-42d3-a456-426614174000'

function mockFetch(impl: () => Promise<Response>) {
  const fn = vi.fn(impl)
  vi.stubGlobal('fetch', fn)
  return fn
}

const json = (data: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } }))

describe('access gate (token login)', () => {
  beforeEach(() => {
    localStorage.clear()
    // Em dev o app aceita qualquer token; os testes exercitam o caminho de produção.
    import.meta.env.DEV = false
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    import.meta.env.DEV = true
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  describe('utils/token', () => {
    it('extracts the token from a pasted access link or returns the raw value trimmed', () => {
      expect(extractToken(`https://minhatize.vercel.app/?token=${TOKEN}`)).toBe(TOKEN)
      expect(extractToken(`  ${TOKEN}  `)).toBe(TOKEN)
      expect(extractToken('https://minhatize.vercel.app/')).toBe('https://minhatize.vercel.app/')
    })

    it('saves, reads and clears the token in localStorage', () => {
      saveToken(TOKEN)
      expect(getStoredToken()).toBe(TOKEN)
      clearToken()
      expect(getStoredToken()).toBeNull()
    })

    it('rejects empty or very short tokens without calling the API', async () => {
      const fetchMock = mockFetch(() => json({ valid: true }))
      expect(await validateToken('')).toBe(false)
      expect(await validateToken('abc')).toBe(false)
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('asks the server with the token in the Authorization header, never in the URL', async () => {
      const fetchMock = mockFetch(() => json({ valid: true }))
      expect(await validateToken(TOKEN)).toBe(true)
      expect(fetchMock).toHaveBeenCalledWith('/api/validate-token', {
        method: 'POST',
        headers: { Authorization: `Bearer ${TOKEN}` },
      })
    })

    it('tells a server refusal (invalid) apart from "could not check" (unknown)', async () => {
      mockFetch(() => json({ valid: false }))
      expect(await checkToken(TOKEN)).toBe('invalid')
      mockFetch(() => json({ valid: false }, 429))
      expect(await checkToken(TOKEN)).toBe('unknown')
      mockFetch(() => json({ valid: false }, 503))
      expect(await checkToken(TOKEN)).toBe('unknown')
      mockFetch(() => json({ valid: 'true' }))
      expect(await checkToken(TOKEN)).toBe('unknown')
      mockFetch(() => Promise.reject(new TypeError('Failed to fetch')))
      expect(await checkToken(TOKEN)).toBe('unknown')
    })

    it('never grants access on valid:false, HTTP errors, malformed bodies or network failures', async () => {
      mockFetch(() => json({ valid: false }))
      expect(await validateToken(TOKEN)).toBe(false)
      mockFetch(() => json({ valid: false }, 429))
      expect(await validateToken(TOKEN)).toBe(false)
      mockFetch(() => json({ valid: 'true' }))
      expect(await validateToken(TOKEN)).toBe(false)
      mockFetch(() => Promise.reject(new TypeError('Failed to fetch')))
      expect(await validateToken(TOKEN)).toBe(false)
    })
  })

  describe('<App /> gate', () => {
    it('shows the login screen when there is no saved token', async () => {
      mockFetch(() => json({ valid: false }))
      render(<App />)
      expect(await screen.findByPlaceholderText(/cole aqui o link ou token/i)).toBeTruthy()
    })

    it('shows an error and stores nothing when the server rejects the token', async () => {
      mockFetch(() => json({ valid: false }))
      render(<App />)
      await userEvent.type(await screen.findByPlaceholderText(/cole aqui/i), TOKEN)
      await userEvent.click(screen.getByRole('button', { name: /acessar/i }))
      expect(await screen.findByText(/token inválido ou expirado/i)).toBeTruthy()
      expect(getStoredToken()).toBeNull()
    })

    it('does not log in, and says it could not verify, when the server is unreachable', async () => {
      mockFetch(() => Promise.reject(new TypeError('Failed to fetch')))
      render(<App />)
      await userEvent.type(await screen.findByPlaceholderText(/cole aqui/i), TOKEN)
      await userEvent.click(screen.getByRole('button', { name: /acessar/i }))
      expect(await screen.findByText(/não foi possível verificar agora/i)).toBeTruthy()
      expect(getStoredToken()).toBeNull()
    })

    it('stores the token and moves on to the consent screen when the server accepts it', async () => {
      mockFetch(() => json({ valid: true }))
      render(<App />)
      await userEvent.type(await screen.findByPlaceholderText(/cole aqui/i), TOKEN)
      await userEvent.click(screen.getByRole('button', { name: /acessar/i }))
      expect(await screen.findByText(/termos de uso e privacidade/i)).toBeTruthy()
      expect(getStoredToken()).toBe(TOKEN)
    })

    it('logs out a saved token that the server now reports as invalid (revoked)', async () => {
      saveToken(TOKEN)
      mockFetch(() => json({ valid: false }))
      render(<App />)
      expect(await screen.findByPlaceholderText(/cole aqui/i)).toBeTruthy()
      expect(getStoredToken()).toBeNull()
    })

    it('keeps health data on the device after the token is cleared', async () => {
      saveToken(TOKEN)
      localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify({ name: 'Teste' }))
      mockFetch(() => json({ valid: false }))
      render(<App />)
      await screen.findByPlaceholderText(/cole aqui/i)
      expect(localStorage.getItem(STORAGE_KEYS.profile)).not.toBeNull()
    })

    // Um PWA aberto sem internet não pode deslogar o usuário: só uma recusa
    // explícita do servidor apaga o token salvo.
    it('does NOT erase the saved token when validation fails because of the network', async () => {
      saveToken(TOKEN)
      mockFetch(() => Promise.reject(new TypeError('Failed to fetch')))
      render(<App />)
      await waitFor(() => expect(screen.queryByText(/verificando acesso/i)).toBeNull())
      expect(getStoredToken()).toBe(TOKEN)
    })

    it('does NOT erase the saved token when the API is rate-limited or down (429/5xx)', async () => {
      saveToken(TOKEN)
      mockFetch(() => json({ valid: false }, 429))
      render(<App />)
      await waitFor(() => expect(screen.queryByText(/verificando acesso/i)).toBeNull())
      expect(getStoredToken()).toBe(TOKEN)
    })

    // Antes, gravar qualquer token no localStorage e bloquear a validação dava
    // acesso ao app. Offline agora exige a prova assinada pelo servidor.
    it('does not open the app offline with a saved token but no signed proof', async () => {
      saveToken(TOKEN)
      mockFetch(() => Promise.reject(new TypeError('Failed to fetch')))
      render(<App />)
      expect(await screen.findByPlaceholderText(/cole aqui/i)).toBeTruthy()
      expect(getStoredToken()).toBe(TOKEN)
    })

    it('does not open the app offline with a forged proof', async () => {
      saveToken(TOKEN)
      const fakePayload = btoa(JSON.stringify({ fp: 'x', exp: Date.now() + 864e5 }))
      localStorage.setItem(STORAGE_KEYS.accessProof, `${fakePayload}.AAAA`)
      mockFetch(() => Promise.reject(new TypeError('Failed to fetch')))
      render(<App />)
      expect(await screen.findByPlaceholderText(/cole aqui/i)).toBeTruthy()
    })

    it('stores the proof sent by the server and drops it on logout', async () => {
      mockFetch(() => json({ valid: true, proof: 'payload.assinatura' }))
      expect(await checkToken(TOKEN)).toBe('valid')
      expect(localStorage.getItem(STORAGE_KEYS.accessProof)).toBe('payload.assinatura')
      clearToken()
      expect(localStorage.getItem(STORAGE_KEYS.accessProof)).toBeNull()
    })
  })

  // Dados de saúde ficam no aparelho e "Sair" não os apaga. Outra pessoa, com
  // outro token, não pode herdar esses dados sem que eles sejam apagados.
  describe('health data is bound to the token that recorded it', () => {
    async function login(token: string) {
      await userEvent.type(await screen.findByPlaceholderText(/cole aqui/i), token)
      await userEvent.click(screen.getByRole('button', { name: /acessar/i }))
    }

    // Deixa o aparelho como se a pessoa do TOKEN tivesse usado o app e saído
    async function deviceUsedBy(token: string) {
      mockFetch(() => json({ valid: true }))
      const first = render(<App />)
      await login(token)
      await screen.findByText(/termos de uso e privacidade/i)
      first.unmount()
      localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify({ name: 'Primeira Pessoa', weightHistory: [] }))
      localStorage.setItem(STORAGE_KEYS.consent, JSON.stringify({ version: '1.1', date: '2026-10-01' }))
      clearToken()
    }

    it('stores only a fingerprint of the token, never the token itself', async () => {
      await deviceUsedBy(TOKEN)
      const owner = localStorage.getItem(STORAGE_KEYS.owner)
      expect(owner).toBeTruthy()
      expect(owner).not.toContain(TOKEN)
    })

    it('lets the same token back in without asking anything and keeps the data', async () => {
      await deviceUsedBy(TOKEN)
      render(<App />)
      await login(TOKEN)
      await waitFor(() => expect(getStoredToken()).toBe(TOKEN))
      expect(screen.queryByText(/dados de outro acesso/i)).toBeNull()
      expect(localStorage.getItem(STORAGE_KEYS.profile)).toContain('Primeira Pessoa')
    })

    it('asks before letting a different token in, and changes nothing if the user cancels', async () => {
      await deviceUsedBy(TOKEN)
      render(<App />)
      await login(OTHER_TOKEN)
      expect(await screen.findByText(/dados de outro acesso/i)).toBeTruthy()
      expect(getStoredToken()).toBeNull()

      await userEvent.click(screen.getByRole('button', { name: /cancelar/i }))
      expect(screen.queryByText(/dados de outro acesso/i)).toBeNull()
      expect(getStoredToken()).toBeNull()
      expect(localStorage.getItem(STORAGE_KEYS.profile)).toContain('Primeira Pessoa')
    })

    it('erases the previous person\'s data and consent when the new user confirms', async () => {
      await deviceUsedBy(TOKEN)
      vi.spyOn(console, 'error').mockImplementation(() => {}) // jsdom não implementa location.reload
      render(<App />)
      await login(OTHER_TOKEN)
      await userEvent.click(await screen.findByRole('button', { name: /apagar dados e entrar/i }))

      await waitFor(() => expect(getStoredToken()).toBe(OTHER_TOKEN))
      expect(localStorage.getItem(STORAGE_KEYS.profile) ?? '').not.toContain('Primeira Pessoa')
      expect(localStorage.getItem(STORAGE_KEYS.consent)).toBeNull()
    })

    it('adopts the existing data on installs that predate this control (no owner recorded)', async () => {
      saveToken(TOKEN)
      localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify({ name: 'Usuária Antiga' }))
      mockFetch(() => json({ valid: true }))
      render(<App />)
      await waitFor(() => expect(localStorage.getItem(STORAGE_KEYS.owner)).toBeTruthy())
      expect(localStorage.getItem(STORAGE_KEYS.profile)).toContain('Usuária Antiga')
    })
  })
})
