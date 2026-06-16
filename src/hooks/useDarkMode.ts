import { useState, useEffect } from 'react'

export function useDarkMode() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('minha-tize-theme')
      if (saved) return saved === 'dark'
    } catch {}
    return false
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', isDark)
    try { localStorage.setItem('minha-tize-theme', isDark ? 'dark' : 'light') } catch {}
  }, [isDark])

  const toggle = () => setIsDark((prev) => !prev)

  return { isDark, toggle }
}
