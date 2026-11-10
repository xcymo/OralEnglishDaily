import type { Progress } from '@/types'
import { todayKey } from './date'
import {
  DEFAULT_MIMO_BASE_URL,
  DEFAULT_MIMO_VOICE,
  MIMO_PLAYBACK_OFFSET,
  MIMO_VOICE_IDS,
  normalizeMimoBaseUrl,
} from './tts'

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
      speechRate: 1.0,
      ttsProvider: 'browser',
      mimoApiKey: '',
      mimoVoice: DEFAULT_MIMO_VOICE,
      mimoBaseUrl: DEFAULT_MIMO_BASE_URL,
      ttsRateCalibrated: true,
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
  const ttsProvider = settings.ttsProvider
  const mimoApiKey = settings.mimoApiKey
  const mimoVoice = settings.mimoVoice
  const mimoBaseUrl = settings.mimoBaseUrl
  const ttsRateCalibrated = settings.ttsRateCalibrated === true
  let speechRate =
    typeof rate === 'number' && Number.isFinite(rate)
      ? Math.min(2.0, Math.max(0.8, rate))
      : base.settings.speechRate
  // 旧版 MiMo 用户：把保存的语速下调 0.1，播放端加回去，听感不变但界面 1.0 成为正常
  if (ttsProvider === 'mimo' && !ttsRateCalibrated) {
    speechRate = Math.min(
      2.0,
      Math.max(0.8, Math.round((speechRate - MIMO_PLAYBACK_OFFSET) * 100) / 100),
    )
  }
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
      speechRate,
      ttsProvider: ttsProvider === 'mimo' ? 'mimo' : 'browser',
      mimoApiKey:
        typeof mimoApiKey === 'string' ? mimoApiKey.slice(0, 500) : '',
      mimoVoice:
        typeof mimoVoice === 'string' && MIMO_VOICE_IDS.includes(mimoVoice)
          ? mimoVoice
          : DEFAULT_MIMO_VOICE,
      mimoBaseUrl:
        typeof mimoBaseUrl === 'string' && mimoBaseUrl.trim()
          ? normalizeMimoBaseUrl(mimoBaseUrl)
          : DEFAULT_MIMO_BASE_URL,
      ttsRateCalibrated: true,
    },
  }
}

export function loadProgress(): Progress {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return createDefaultProgress()
    const parsed: unknown = JSON.parse(raw)
    const normalized = normalizeProgress(parsed)
    // 旧数据没有校正标记：立即写回一次，避免快速刷新时重复扣减语速
    if (
      !isObject(parsed) ||
      !isObject(parsed.settings) ||
      parsed.settings.ttsRateCalibrated !== true
    ) {
      saveProgress(normalized)
    }
    return normalized
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
