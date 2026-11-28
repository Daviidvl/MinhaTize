import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// O banco de produção pode estar sem as colunas novas de tokens (migrations
// aplicadas à mão). Nesse caso a validação não pode derrubar todos os tokens:
// a consulta desce um degrau por vez (assinatura → expires_at → só o id).

const maybeSingle = vi.fn()
const select = vi.fn()

vi.mock('../supabaseAdmin', () => ({
  getSupabaseAdmin: () => ({
    from: () => ({
      select: (columns: string) => {
        select(columns)
        return { eq: () => ({ eq: () => ({ maybeSingle }) }) }
      },
    }),
  }),
}))

const FULL = 'id, expires_at, access_type, plan, paid_until'
const MISSING_SUBSCRIPTION = { data: null, error: { code: '42703', message: 'column tokens.access_type does not exist' } }
const MISSING_EXPIRES = { data: null, error: { code: '42703', message: 'column tokens.expires_at does not exist' } }
const TOKEN = '123e4567-e89b-42d3-a456-426614174000'

describe('checkToken when token columns do not exist yet', () => {
  let checkToken: typeof import('../auth').checkToken

  beforeEach(async () => {
    vi.resetModules()
    maybeSingle.mockReset()
    select.mockReset()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    ;({ checkToken } = await import('../auth'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('without the subscription columns, retries with expires_at only', async () => {
    maybeSingle.mockResolvedValueOnce(MISSING_SUBSCRIPTION).mockResolvedValueOnce({ data: { id: 1, expires_at: null }, error: null })
    expect(await checkToken(TOKEN)).toBe('active')
    expect(select.mock.calls.map(c => c[0])).toEqual([FULL, 'id, expires_at'])
  })

  it('without expires_at either, retries with the id only and accepts an active token', async () => {
    maybeSingle
      .mockResolvedValueOnce(MISSING_SUBSCRIPTION)
      .mockResolvedValueOnce(MISSING_EXPIRES)
      .mockResolvedValueOnce({ data: { id: 1 }, error: null })
    expect(await checkToken(TOKEN)).toBe('active')
    expect(select.mock.calls.map(c => c[0])).toEqual([FULL, 'id, expires_at', 'id'])
  })

  it('still rejects a token that does not exist', async () => {
    maybeSingle.mockResolvedValueOnce(MISSING_SUBSCRIPTION).mockResolvedValueOnce({ data: null, error: null })
    expect(await checkToken(TOKEN)).toBe('inactive')
  })

  it('recognises the error by its message when the code is absent', async () => {
    maybeSingle
      .mockResolvedValueOnce({ data: null, error: { message: 'column tokens.access_type does not exist' } })
      .mockResolvedValueOnce({ data: { id: 1 }, error: null })
    expect(await checkToken(TOKEN)).toBe('active')
  })

  it('warns which migration is missing', async () => {
    maybeSingle
      .mockResolvedValueOnce(MISSING_SUBSCRIPTION)
      .mockResolvedValueOnce(MISSING_EXPIRES)
      .mockResolvedValueOnce({ data: { id: 1 }, error: null })
    await checkToken(TOKEN)
    const warned = JSON.stringify((console.warn as unknown as { mock: { calls: unknown[][] } }).mock.calls)
    expect(warned).toContain('20261127_subscriptions.sql')
    expect(warned).toContain('20260901_add_token_expiration.sql')
  })

  it('skips the failing queries for a few minutes, then checks for the columns again', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-12T12:00:00Z'))
    maybeSingle
      .mockResolvedValueOnce(MISSING_SUBSCRIPTION)
      .mockResolvedValueOnce(MISSING_EXPIRES)
      .mockResolvedValue({ data: { id: 1 }, error: null })

    await checkToken(TOKEN)
    await checkToken(TOKEN)
    expect(select.mock.calls.map(c => c[0])).toEqual([FULL, 'id, expires_at', 'id', 'id'])

    // Depois da janela, volta a pedir todas as colunas: a migration passa a valer sem deploy
    vi.setSystemTime(new Date('2026-10-12T12:06:00Z'))
    maybeSingle.mockResolvedValue({ data: { id: 1, expires_at: '2026-10-01T00:00:00Z' }, error: null })
    expect(await checkToken(TOKEN)).toBe('inactive')
    expect(select.mock.calls.at(-1)?.[0]).toBe(FULL)
  })

  it('does not mask other database errors (still fails closed)', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: { code: '57014', message: 'canceling statement due to statement timeout' } })
    expect(await checkToken(TOKEN)).toBe('error')
    expect(maybeSingle).toHaveBeenCalledTimes(1)
  })

  it('fails closed when the retry itself errors', async () => {
    maybeSingle.mockResolvedValueOnce(MISSING_SUBSCRIPTION).mockResolvedValueOnce({ data: null, error: { message: 'connection refused' } })
    expect(await checkToken(TOKEN)).toBe('error')
  })
})
