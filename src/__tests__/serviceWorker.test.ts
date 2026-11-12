import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Testes de segurança — public/sw.js. O arquivo real é carregado com um `self`
// simulado: toque numa notificação só pode abrir caminhos internos do app.

type Listener = (event: unknown) => void
type Win = { url: string; postMessage: ReturnType<typeof vi.fn>; focus: ReturnType<typeof vi.fn> }

function loadServiceWorker(windows: Win[] = []) {
  const listeners: Record<string, Listener> = {}
  const showNotification = vi.fn()
  const openWindow = vi.fn()
  const self = {
    addEventListener: (type: string, fn: Listener) => { listeners[type] = fn },
    registration: { showNotification },
    clients: { matchAll: () => Promise.resolve(windows), openWindow, claim: vi.fn() },
    skipWaiting: vi.fn(),
    location: { origin: 'https://minhatize.vercel.app' },
  }
  const code = readFileSync(resolve(process.cwd(), 'public/sw.js'), 'utf8')
  new Function('self', 'caches', 'fetch', 'Response', code)(self, {}, vi.fn(), class {})
  return { listeners, showNotification, openWindow }
}

async function click(sw: ReturnType<typeof loadServiceWorker>, url: unknown) {
  let pending: Promise<unknown> = Promise.resolve()
  sw.listeners.notificationclick({
    notification: { close: vi.fn(), data: { url } },
    waitUntil: (p: Promise<unknown>) => { pending = p },
  })
  await pending
}

const EXTERNAL = ['//evil.example/phish', '/\\evil.example', 'https://evil.example', 'javascript:alert(1)', '', 42, null]

describe('service worker — notificações', () => {
  it('push: guarda só caminhos internos na notificação', () => {
    for (const url of [...EXTERNAL, '/?tab=health']) {
      const sw = loadServiceWorker()
      sw.listeners.push({ data: { json: () => ({ title: 'Lembrete', url }) }, waitUntil: () => {} })
      const options = sw.showNotification.mock.calls[0][1]
      expect(options.data.url).toBe(url === '/?tab=health' ? '/?tab=health' : '/')
    }
  })

  it('clique sem o app aberto: nunca abre outro site', async () => {
    for (const url of EXTERNAL) {
      const sw = loadServiceWorker()
      await click(sw, url)
      expect(sw.openWindow).toHaveBeenCalledWith('/')
    }
  })

  it('clique sem o app aberto: abre o caminho interno pedido', async () => {
    const sw = loadServiceWorker()
    await click(sw, '/?tab=health&section=symptoms')
    expect(sw.openWindow).toHaveBeenCalledWith('/?tab=health&section=symptoms')
  })

  it('clique com o app aberto: pede a navegação só para caminho interno', async () => {
    const win: Win = { url: 'https://minhatize.vercel.app/', postMessage: vi.fn(), focus: vi.fn() }
    const sw = loadServiceWorker([win])
    await click(sw, '//evil.example')
    expect(win.postMessage).toHaveBeenCalledWith({ type: 'navigate', url: '/' })
    expect(sw.openWindow).not.toHaveBeenCalled()
  })
})
