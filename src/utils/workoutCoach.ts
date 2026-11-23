// Voz, bipes e vibração do treino guiado. Tudo é opcional: sem suporte no
// aparelho (ou com o som desligado) o treino segue só com a tela.
//
// iOS só libera áudio e voz depois de um toque do usuário: `unlock` é chamado
// no botão "Começar"/"Retomar".

export interface Coach {
  unlock(): void
  say(text: string): void
  beep(kind: 'tick' | 'go'): void
  buzz(pattern: number | number[]): void
  silence(): void
  dispose(): void
}

type AudioCtor = typeof AudioContext

export function createCoach(): Coach {
  let ctx: AudioContext | null = null
  let voice: SpeechSynthesisVoice | null = null

  const synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null

  function pickVoice(): SpeechSynthesisVoice | null {
    if (!synth) return null
    if (voice) return voice
    try {
      const voices = synth.getVoices()
      voice = voices.find(v => v.lang === 'pt-BR' || v.lang === 'pt_BR')
        ?? voices.find(v => v.lang.toLowerCase().startsWith('pt'))
        ?? null
    } catch { /* sem vozes */ }
    return voice
  }

  return {
    unlock() {
      try {
        const Ctor: AudioCtor | undefined = window.AudioContext
          ?? (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext
        if (Ctor && !ctx) ctx = new Ctor()
        void ctx?.resume()
      } catch { /* sem Web Audio */ }
      pickVoice()
    },

    say(text) {
      if (!synth) return
      try {
        synth.cancel()
        const u = new SpeechSynthesisUtterance(text)
        u.lang = 'pt-BR'
        u.rate = 1.05
        const v = pickVoice()
        if (v) u.voice = v
        synth.speak(u)
      } catch { /* voz indisponível */ }
    },

    beep(kind) {
      if (!ctx || ctx.state === 'closed') return
      try {
        const t   = ctx.currentTime
        const dur = kind === 'go' ? 0.45 : 0.14
        const osc = ctx.createOscillator()
        const amp = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = kind === 'go' ? 1175 : 880
        amp.gain.setValueAtTime(0.0001, t)
        amp.gain.exponentialRampToValueAtTime(0.3, t + 0.012)
        amp.gain.exponentialRampToValueAtTime(0.0001, t + dur)
        osc.connect(amp).connect(ctx.destination)
        osc.start(t)
        osc.stop(t + dur + 0.02)
      } catch { /* sem áudio */ }
    },

    buzz(pattern) {
      try { navigator.vibrate?.(pattern) } catch { /* sem vibração */ }
    },

    silence() {
      try { synth?.cancel() } catch { /* nada a calar */ }
    },

    dispose() {
      this.silence()
      try { void ctx?.close() } catch { /* já fechado */ }
      ctx = null
    },
  }
}

// Mantém a tela acesa durante o treino (quando o navegador permite)
export async function requestWakeLock(): Promise<{ release(): Promise<void> } | null> {
  try {
    const wl = (navigator as Navigator & { wakeLock?: { request(type: 'screen'): Promise<{ release(): Promise<void> }> } }).wakeLock
    return wl ? await wl.request('screen') : null
  } catch {
    return null
  }
}
