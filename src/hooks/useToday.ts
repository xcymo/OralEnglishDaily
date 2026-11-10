import { useEffect, useState } from 'react'
import { todayKey } from '@/lib/date'

/**
 * 当前日期 key。
 * 每分钟 + 页面重新可见时检查一次，跨过零点会自动换到新一天。
 */
export function useToday(): string {
  const [date, setDate] = useState(todayKey)

  useEffect(() => {
    const check = () => setDate((prev) => {
      const next = todayKey()
      return prev === next ? prev : next
    })
    const timer = window.setInterval(check, 60_000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') check()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', check)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', check)
    }
  }, [])

  return date
}
