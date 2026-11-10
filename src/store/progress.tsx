import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type {
  DailyPlan,
  DailyTask,
  Progress,
  SelfRating,
  Settings,
  StuckNote,
} from '@/types'
import { applyCompletion } from '@/lib/complete'
import { todayKey } from '@/lib/date'
import {
  ensurePlan,
  generatePlan,
} from '@/lib/planner'
import {
  clearProgress,
  createDefaultProgress,
  loadProgress,
  saveProgress,
} from '@/lib/storage'
import { configureTts } from '@/lib/tts'
import { clearRecordings } from '@/lib/recordings'
import { useToday } from '@/hooks/useToday'
import { useTheme } from '@/hooks/useTheme'
import { useToast } from './toast'

interface ProgressContextValue {
  progress: Progress
  plan: DailyPlan
  today: string
  storageWarning: boolean
  completeTask: (task: DailyTask, rating: SelfRating) => void
  saveSession: (
    taskId: string,
    stepIndex: number,
    drafts?: Record<string, string>,
  ) => void
  addStuckNote: (note: Omit<StuckNote, 'id' | 'date'>) => void
  removeStuckNote: (id: string) => void
  clearStuckNotes: () => void
  updateSettings: (patch: Partial<Settings>) => void
  resetProgress: () => Promise<void>
  clearAllData: () => Promise<void>
}

const ProgressContext = createContext<ProgressContextValue | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const today = useToday()
  const toast = useToast()
  const [progress, setProgress] = useState<Progress>(() => {
    const initial = loadProgress()
    return ensurePlan(initial, todayKey()).progress
  })
  const [storageWarning, setStorageWarning] = useState(false)
  const warnedRef = useRef(false)
  const latestRef = useRef(progress)
  latestRef.current = progress

  useTheme(progress.settings.theme)

  /* 跨天时自动生成新一天的计划 */
  useEffect(() => {
    setProgress((prev) => {
      if (prev.plans[today]) return prev
      return ensurePlan(prev, today).progress
    })
  }, [today])

  /* 切换学习量：今天还没开始时，立即按新节奏重排；已经开始则保留到明天 */
  useEffect(() => {
    setProgress((prev) => {
      const plan = prev.plans[today]
      if (!plan || plan.load === prev.settings.load) return prev
      if (plan.tasks.some((task) => task.status !== 'pending')) return prev
      const nextPlan = generatePlan(prev, today)
      return {
        ...prev,
        plans: { ...prev.plans, [today]: nextPlan },
      }
    })
  }, [progress.settings.load, today])

  /* 语速同步到 TTS 模块 */
  /* 语音播放配置同步到 TTS 模块 */
  useEffect(() => {
    configureTts({
      provider: progress.settings.ttsProvider,
      rate: progress.settings.speechRate,
      apiKey: progress.settings.mimoApiKey,
      voice: progress.settings.mimoVoice,
      baseUrl: progress.settings.mimoBaseUrl,
    })
  }, [
    progress.settings.ttsProvider,
    progress.settings.speechRate,
    progress.settings.mimoApiKey,
    progress.settings.mimoVoice,
    progress.settings.mimoBaseUrl,
  ])

  /* 防抖持久化 */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const ok = saveProgress(progress)
      if (!ok && !warnedRef.current) {
        warnedRef.current = true
        setStorageWarning(true)
        toast.error('本地存储写入失败，进度可能无法保存')
      }
    }, 160)
    return () => window.clearTimeout(timer)
  }, [progress, toast])

  useEffect(() => {
    const flush = () => {
      saveProgress(latestRef.current)
    }
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush()
    })
    return () => {
      window.removeEventListener('pagehide', flush)
    }
  }, [])

  const plan = useMemo(
    () => progress.plans[today] ?? generatePlan(progress, today),
    [progress, today],
  )

  const completeTask = useCallback((task: DailyTask, rating: SelfRating) => {
    setProgress((prev) => {
      const ensured = ensurePlan(prev, task.date).progress
      return applyCompletion(ensured, task, rating)
    })
  }, [])

  const saveSession = useCallback(
    (taskId: string, stepIndex: number, drafts?: Record<string, string>) => {
      setProgress((prev) => {
        const existing = prev.sessions[taskId]
        return {
          ...prev,
          sessions: {
            ...prev.sessions,
            [taskId]: {
              stepIndex,
              updatedAt: new Date().toISOString(),
              drafts: { ...(existing?.drafts ?? {}), ...(drafts ?? {}) },
            },
          },
        }
      })
    },
    [],
  )

  const addStuckNote = useCallback(
    (note: Omit<StuckNote, 'id' | 'date'>) => {
      setProgress((prev) => ({
        ...prev,
        stuckNotes: [
          {
            ...note,
            id: `stuck-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            date: todayKey(),
          },
          ...prev.stuckNotes,
        ].slice(0, 200),
      }))
      toast.show('已加入「不会说清单」')
    },
    [toast],
  )

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setProgress((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...patch },
    }))
  }, [])

  const removeStuckNote = useCallback(
    (id: string) => {
      setProgress((prev) => ({
        ...prev,
        stuckNotes: prev.stuckNotes.filter((note) => note.id !== id),
      }))
      toast.success('已从清单移除')
    },
    [toast],
  )

  const clearStuckNotes = useCallback(() => {
    setProgress((prev) => ({ ...prev, stuckNotes: [] }))
    toast.success('不会说清单已清空')
  }, [toast])

  const resetProgress = useCallback(async () => {
    setProgress((prev) => {
      const base = createDefaultProgress()
      const fresh: Progress = {
        ...base,
        settings: { ...prev.settings },
      }
      return ensurePlan(fresh, todayKey()).progress
    })
    try {
      // 录音和任务绑定，重置学习进度时一起清掉，避免旧录音串到新计划里
      await clearRecordings()
    } catch (error) {
      console.warn('[录音] 重置时清空失败', error)
    }
    toast.success('学习进度已重置')
  }, [toast])

  const clearAllData = useCallback(async () => {
    clearProgress()
    setProgress(ensurePlan(createDefaultProgress(), todayKey()).progress)
    setStorageWarning(false)
    warnedRef.current = false
    try {
      await clearRecordings()
    } catch (error) {
      console.warn('[录音] 清空失败', error)
    }
    toast.success('本地数据已清除')
  }, [toast])

  const value = useMemo<ProgressContextValue>(
    () => ({
      progress,
      plan,
      today,
      storageWarning,
      completeTask,
      saveSession,
      addStuckNote,
      removeStuckNote,
      clearStuckNotes,
      updateSettings,
      resetProgress,
      clearAllData,
    }),
    [
      progress,
      plan,
      today,
      storageWarning,
      completeTask,
      saveSession,
      addStuckNote,
      removeStuckNote,
      clearStuckNotes,
      updateSettings,
      resetProgress,
      clearAllData,
    ],
  )

  return (
    <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
  )
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext)
  if (!ctx) {
    throw new Error('useProgress 必须在 ProgressProvider 内使用')
  }
  return ctx
}
