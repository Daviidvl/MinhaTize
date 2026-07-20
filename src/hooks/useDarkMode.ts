import { useState, useEffect } from 'react'
import { readRaw, writeRaw } from '../utils/storage'
import { STORAGE_KEYS } from '../utils/storageKeys'

export function useDarkMode() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = readRaw(STORAGE_KEYS.theme)
    return saved ? saved === 'dark' : false
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', isDark)
    writeRaw(STORAGE_KEYS.theme, isDark ? 'dark' : 'light')
  }, [isDark])

  const toggle = () => setIsDark((prev) => !prev)

  return { isDark, toggle }
}
