import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from 'react'
import { toast } from 'sonner'

import axios from '@/lib/axios'
import { useUser } from '@/contexts/UserContext'

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
  const { user } = useUser()
  const isMountingRef = useRef(false)

  const [theme, setTheme] = useState<ThemeType>(user?.theme || 'neutro')
  const [mode, setMode] = useState<ModeType>(user?.themeMode || 'light')

  const toggleTheme = async () => {
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
    isMountingRef.current = true
  }, [])

  useEffect(() => {
    if (user?.theme && ['neutro', 'barbearia', 'salao'].includes(user.theme)) {
      setTheme(user.theme)
    }
    if (user?.themeMode && ['light', 'dark'].includes(user.themeMode)) {
      setMode(user.themeMode)
    }
  }, [user])

  useEffect(() => {
    const updateTheme = async () => {
      document.documentElement.style.setProperty(
        'transition',
        'background-color 0.3s ease, color 0.3s ease',
      )
      document.documentElement.setAttribute('data-theme', theme)
      document.documentElement.classList.toggle('dark', mode === 'dark')

      try {
        await axios.patch('/api/auth/profile', {
          theme: theme,
          themeMode: mode,
        })
      } catch {
        toast.error('Erro ao salvar personalização')
      }

      setTimeout(() => {
        document.documentElement.style.removeProperty('transition')
      }, 300)
    }

    if (!isMountingRef.current) {
      updateTheme()
    } else {
      isMountingRef.current = false
    }
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
      }}
    >
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
