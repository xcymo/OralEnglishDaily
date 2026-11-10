/**
 * 全局类型定义。
 * 内容层（src/content）与组件层（src/pages、src/components）都只依赖这里的标准结构。
 */

export type Level = 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export type LoadKey = 'light' | 'standard' | 'intense'

export type ThemeMode = 'system' | 'light' | 'dark'

export type TtsProvider = 'browser' | 'mimo'

/** 场景内的一个高频语块 */
export interface Chunk {
  id: string
  en: string
  zh: string
  /** 用法提示，一句话即可 */
  note: string
  /** 放到迷你对话里的例句 */
  exampleEn: string
  exampleZh: string
  tags: string[]
}

export interface PatternExample {
  en: string
  zh: string
}

export interface Substitution {
  /** 中文提示：要表达的意思 */
  zh: string
  /** 英文关键词/短语，用来填空 */
  en: string
}

/** 可迁移的功能句式 */
export interface Pattern {
  id: string
  /** 功能分类 key，见 curriculum.functionCategories */
  functionCategory: string
  /** 用 [方括号] 标出可替换部分 */
  patternEn: string
  patternZh: string
  usageNote: string
  examples: PatternExample[]
  substitutions: Substitution[]
  level: Level
  tags: string[]
}

export type RoleplaySpeaker = 'staff' | 'you' | 'other'

export interface RoleplayLine {
  speaker: RoleplaySpeaker
  en: string
  zh: string
}

export interface Roleplay {
  promptZh: string
  promptEn: string
  goals: string[]
  script: RoleplayLine[]
}

/** 主题场景 */
export interface Scene {
  id: string
  titleZh: string
  titleEn: string
  category: string
  level: Level
  description: string
  coverEmoji: string
  tags: string[]
  estimatedMinutes: number
  /** 同一分类下的稳定排序 */
  order: number
  targetChunks: Chunk[]
  /** 引用 src/content/patterns 下的句式 id */
  targetPatterns: string[]
  roleplay: Roleplay
}

/* ------------------------------------------------------------------ */
/* 每日任务                                                             */
/* ------------------------------------------------------------------ */

export type TaskType =
  | 'scene-learn'
  | 'pattern-substitute'
  | 'shadow'
  | 'roleplay'
  | 'review'

export type TaskTag = 'new' | 'review' | 'extra'

export type TaskStatus = 'pending' | 'done' | 'skipped'

export interface SelfRating {
  /** 流利度 1-5 */
  fluency: number
  /** 这次是否卡壳 */
  stuck: boolean
  /** 发音自评 1-5 */
  pronunciation: number
  /** 卡住的地方，可选 */
  note?: string
}

export type StepKind =
  | 'intro'
  | 'chunk'
  | 'pattern'
  | 'substitute'
  | 'shadow'
  | 'recall'
  | 'roleplay'
  | 'rate'

/** 练习步骤，全部由 task 数据推导出来 */
export type PracticeStep =
  | { kind: 'intro'; taskId: string }
  | { kind: 'chunk'; sceneId: string; chunkId: string }
  | { kind: 'pattern'; patternId: string }
  | { kind: 'substitute'; patternId: string; substitutionIndex: number }
  | { kind: 'shadow'; sceneId: string; chunkId: string }
  | { kind: 'recall'; sceneId: string; chunkId: string }
  | { kind: 'roleplay'; sceneId: string }
  | { kind: 'rate'; taskId: string }

export interface DailyTask {
  id: string
  date: string
  type: TaskType
  tag: TaskTag
  title: string
  description: string
  estimatedMinutes: number
  /** 场景任务/复习任务关联的场景 */
  sceneId?: string
  /** 本次任务覆盖的语块（用于更新学习进度） */
  chunkIds?: string[]
  patternIds?: string[]
  /** 复习任务关联的复习队列 key */
  reviewKeys?: string[]
  status: TaskStatus
  selfRating?: SelfRating
  completedAt?: string
  /** 今日任务顺序 */
  order: number
}

export interface DailyPlan {
  date: string
  load: LoadKey
  /** 生成时的内容版本，便于排查 */
  contentVersion: string
  generatedAt: string
  tasks: DailyTask[]
}

/* ------------------------------------------------------------------ */
/* 进度与复习                                                            */
/* ------------------------------------------------------------------ */

export type ReviewKind = 'scene' | 'pattern'

export interface ReviewItem {
  /** scene:<id> / pattern:<id> */
  key: string
  kind: ReviewKind
  refId: string
  /** 间隔档位：1 / 3 / 7 / 14 / 30 天 */
  intervalIndex: number
  dueDate: string
  lastRating: number
  lapses: number
  seen: number
  updatedAt: string
}

export interface PatternStat {
  attempts: number
  lastRating: number
  bestRating: number
  lastPracticedAt: string
}

export interface TaskRecord {
  taskId: string
  date: string
  type: TaskType
  title: string
  rating?: SelfRating
  completedAt: string
  extra?: boolean
}

export interface StuckNote {
  id: string
  date: string
  kind: 'chunk' | 'pattern' | 'task'
  refId: string
  sceneId?: string
  /** 英文/中文所对应的内容 */
  text: string
  note?: string
}

export interface DayActivity {
  completed: number
  minutes: number
  ratedFluency: number[]
}

export interface PracticeSession {
  stepIndex: number
  updatedAt: string
  /** substitute 步骤里写下的句子 */
  drafts: Record<string, string>
}

/* ------------------------------------------------------------------ */
/* 录音持久化（IndexedDB）                                              */
/* ------------------------------------------------------------------ */

/** 练习页传给录音组件的上下文：一条录音对应「任务 + 步骤」 */
export interface RecordingSessionMeta {
  taskId: string
  taskTitle: string
  taskType: TaskType
  date: string
  stepIndex: number
  stepKind: StepKind
  sceneId?: string
  patternId?: string
}

/** 写库前的录音描述（不含音频、时间、大小） */
export interface RecordingDraft {
  id: string
  taskId: string
  taskTitle: string
  taskType: TaskType
  date: string
  stepIndex: number
  stepKind: StepKind
  /** 这句英文/这段对话，便于之后辨认 */
  text: string
  sceneId?: string
  patternId?: string
}

/** IndexedDB 里的录音元数据；音频字节单独存放在 blobs 表 */
export interface RecordingMeta extends RecordingDraft {
  createdAt: string
  durationMs: number
  mimeType: string
  size: number
}

export interface RecordingStats {
  count: number
  bytes: number
  latestAt: string | null
}

export type PersistenceStatus = 'granted' | 'denied' | 'unsupported'

export interface Settings {
  load: LoadKey
  theme: ThemeMode
  speechRate: number
  /** 浏览器 speechSynthesis 或小米 MiMo 2.5 TTS */
  ttsProvider: TtsProvider
  mimoApiKey: string
  mimoVoice: string
  mimoBaseUrl: string
  /** 旧版 MiMo 语速是否已完成 -0.1 的一次性校正 */
  ttsRateCalibrated: boolean
}

export interface Progress {
  version: number
  createdAt: string
  plans: Record<string, DailyPlan>
  /** sceneId -> 已学语块 id */
  learnedChunkIds: Record<string, string[]>
  learnedSceneIds: string[]
  learnedPatternIds: string[]
  patternStats: Record<string, PatternStat>
  reviewQueue: ReviewItem[]
  completedTaskIds: string[]
  streak: number
  lastActiveDate: string | null
  activity: Record<string, DayActivity>
  history: TaskRecord[]
  stuckNotes: StuckNote[]
  sessions: Record<string, PracticeSession>
  settings: Settings
}

/* ------------------------------------------------------------------ */
/* 内容加载                                                              */
/* ------------------------------------------------------------------ */

export interface ValidationIssue {
  file: string
  path: string
  message: string
  level: 'error' | 'warning'
}

export interface ContentBundle {
  scenes: Scene[]
  patterns: Pattern[]
  sceneMap: Record<string, Scene>
  patternMap: Record<string, Pattern>
  chunkMap: Record<string, Chunk>
  issues: ValidationIssue[]
}
