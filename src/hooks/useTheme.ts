import { useEffect } from 'react'
import type { ThemeMode } from '@/types'

const THEME_COLORS = {
  light: '#F7F8FB',
  dark: '#0C0E14',
}

/** 深色模式：跟随系统 / 强制浅色 / 强制深色，同时更新浏览器状态栏颜色 */
export function useTheme(mode: ThemeMode): void {
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = mode === 'dark' || (mode === 'system' && media.matches)
      const root = document.documentElement
      root.classList.toggle('dark', dark)
      const meta = document.querySelector('meta[name="theme-color"]')
      if (meta) {
        meta.setAttribute('content', dark ? THEME_COLORS.dark : THEME_COLORS.light)
      }
    }
    apply()
    if (mode === 'system') {
      media.addEventListener('change', apply)
      return () => media.removeEventListener('change', apply)
    }
    return undefined
  }, [mode])
}
