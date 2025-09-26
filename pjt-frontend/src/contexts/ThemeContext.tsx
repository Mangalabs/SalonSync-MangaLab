import React, { createContext, useContext, useState, useEffect } from 'react'

export type ThemeType = 'neutro'
export type ModeType = 'light' | 'dark'

interface ThemeInfo {
  name: string
  description: string
  primaryColor: string
  accentColor: string
}

interface ThemeContextType {
  theme: ThemeType
  mode: ModeType
  setTheme: (theme: ThemeType) => void
  setMode: (mode: ModeType) => void
  toggleTheme: () => void
  toggleMode: () => void
  currentThemeInfo: ThemeInfo
}

const themeInfoMap: Record<ThemeType, ThemeInfo> = {
  neutro: {
    name: 'Neutro',
    description: 'Profissional e minimalista',
    primaryColor: '#6366f1',
    accentColor: '#e5e7eb',
  },
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeType>('neutro')
  const [mode, setMode] = useState<ModeType>('light')

  const toggleTheme = () => {
    const themes: ThemeType[] = ['neutro']
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }

  const toggleMode = () => {
    setMode(mode === 'light' ? 'dark' : 'light')
  }

  const currentThemeInfo = themeInfoMap[theme]

  useEffect(() => {
    const savedTheme = localStorage.getItem('beauty-theme') as ThemeType
    const savedMode = localStorage.getItem('beauty-mode') as ModeType

    if (savedTheme && ['neutro', 'barbearia', 'salao'].includes(savedTheme)) {
      setTheme(savedTheme)
    }
    if (savedMode && ['light', 'dark'].includes(savedMode)) {
      setMode(savedMode)
    }
  }, [])

  useEffect(() => {
    document.documentElement.style.setProperty(
      'transition',
      'background-color 0.3s ease, color 0.3s ease',
    )
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.classList.toggle('dark', mode === 'dark')

    localStorage.setItem('beauty-theme', theme)
    localStorage.setItem('beauty-mode', mode)

    setTimeout(() => {
      document.documentElement.style.removeProperty('transition')
    }, 300)
  }, [theme, mode])

  return (
    <ThemeContext.Provider
      value={{
        theme,
        mode,
        setTheme,
        setMode,
        toggleTheme,
        toggleMode,
        currentThemeInfo,
      }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
