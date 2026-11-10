import type { Progress } from '@/types'
import { todayKey } from './date'

export const STORAGE_KEY = 'oral-english.progress.v1'

export function createDefaultProgress(): Progress {
  return {
    version: 1,
    createdAt: todayKey(),
    plans: {},
    learnedChunkIds: {},
    learnedSceneIds: [],
    learnedPatternIds: [],
    patternStats: {},
    reviewQueue: [],
    completedTaskIds: [],
    streak: 0,
    lastActiveDate: null,
    activity: {},
    history: [],
    stuckNotes: [],
    sessions: {},
    settings: {
      load: 'standard',
      theme: 'system',
      speechRate: 0.9,
    },
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function arrayOf<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) ? (value as T[]) : fallback
}

function objectOf<T>(value: unknown, fallback: T): T {
  return isObject(value) ? (value as T) : fallback
}

/** 读取时做一次宽松的合并，兼容旧版本/损坏字段，避免一个字段坏掉导致整个 App 白屏 */
export function normalizeProgress(raw: unknown): Progress {
  const base = createDefaultProgress()
  if (!isObject(raw)) return base
  const settings = isObject(raw.settings) ? raw.settings : {}
  const load = settings.load
  const theme = settings.theme
  const rate = settings.speechRate
  return {
    ...base,
    version: typeof raw.version === 'number' ? raw.version : base.version,
    createdAt:
      typeof raw.createdAt === 'string' ? raw.createdAt : base.createdAt,
    plans: objectOf(raw.plans, base.plans),
    learnedChunkIds: objectOf(raw.learnedChunkIds, base.learnedChunkIds),
    learnedSceneIds: arrayOf(raw.learnedSceneIds, base.learnedSceneIds),
    learnedPatternIds: arrayOf(raw.learnedPatternIds, base.learnedPatternIds),
    patternStats: objectOf(raw.patternStats, base.patternStats),
    reviewQueue: arrayOf(raw.reviewQueue, base.reviewQueue),
    completedTaskIds: arrayOf(raw.completedTaskIds, base.completedTaskIds),
    streak: typeof raw.streak === 'number' ? raw.streak : 0,
    lastActiveDate:
      typeof raw.lastActiveDate === 'string' ? raw.lastActiveDate : null,
    activity: objectOf(raw.activity, base.activity),
    history: arrayOf(raw.history, base.history),
    stuckNotes: arrayOf(raw.stuckNotes, base.stuckNotes),
    sessions: objectOf(raw.sessions, base.sessions),
    settings: {
      load:
        load === 'light' || load === 'standard' || load === 'intense'
          ? load
          : base.settings.load,
      theme:
        theme === 'light' || theme === 'dark' || theme === 'system'
          ? theme
          : base.settings.theme,
      speechRate:
        typeof rate === 'number' && rate >= 0.5 && rate <= 1.4
          ? rate
          : base.settings.speechRate,
    },
  }
}

export function loadProgress(): Progress {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return createDefaultProgress()
    return normalizeProgress(JSON.parse(raw))
  } catch (error) {
    console.warn('[存储] 本地进度读取失败，已使用默认值', error)
    return createDefaultProgress()
  }
}

export function saveProgress(progress: Progress): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
    return true
  } catch (error) {
    console.warn('[存储] 写入失败（可能是存储空间已满或隐私模式）', error)
    return false
  }
}

export function clearProgress(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.warn('[存储] 清除失败', error)
  }
}

export function storageSizeKB(): number {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY) ?? ''
    return Math.round((raw.length * 2) / 1024)
  } catch {
    return 0
  }
}
