import { useCallback, useEffect, useRef, useState } from 'react'

// Confirmação passageira ("Salvo!"): flash() liga o sinal e ele se apaga
// sozinho depois de `ms`. Um novo flash reinicia a contagem, e o timer é
// cancelado se a tela fechar antes.
export function useFlash(ms: number): [boolean, () => void] {
  const [on, setOn] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => () => clearTimeout(timer.current), [])

  const flash = useCallback(() => {
    clearTimeout(timer.current)
    setOn(true)
    timer.current = setTimeout(() => setOn(false), ms)
  }, [ms])

  return [on, flash]
}
