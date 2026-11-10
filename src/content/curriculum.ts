/**
 * 课程配置：只放「学习顺序」和「每日任务规则」。
 * 页面组件不应该写死任何排序或每日任务规则，全部从这里读。
 */
import type { LoadKey, Level } from '@/types'

export const CONTENT_VERSION = '2026.11.1'

export interface DailyLoadConfig {
  key: LoadKey
  label: string
  /** 一句话说明 */
  hint: string
  /** 每天最多新学多少语块 */
  chunkLimit: number
  /** 每天最多新学多少个句式 */
  patternCount: number
  /** 每天安排几个复习任务（0-2） */
  reviewCount: number
  /** 今日预计总时长（展示用，实际会按内容重新估算） */
  estimate: string
}

export const DAILY_LOADS: Record<LoadKey, DailyLoadConfig> = {
  light: {
    key: 'light',
    label: '轻',
    hint: '忙的时候也能坚持',
    chunkLimit: 4,
    patternCount: 1,
    reviewCount: 1,
    estimate: '约 10 分钟',
  },
  standard: {
    key: 'standard',
    label: '标准',
    hint: '每天一点，稳步推进',
    chunkLimit: 6,
    patternCount: 1,
    reviewCount: 1,
    estimate: '约 13 分钟',
  },
  intense: {
    key: 'intense',
    label: '加强',
    hint: '想快点开口就选这个',
    chunkLimit: 9,
    patternCount: 2,
    reviewCount: 2,
    estimate: '约 17 分钟',
  },
}

/** 复习间隔（天），自评低时回退一档 */
export const REVIEW_INTERVALS = [1, 3, 7, 14, 30]

/** 自评低于等于此值时，视为卡壳，复习回退 */
export const LOW_RATING_THRESHOLD = 2

/** 一个句式练习达到该次数且最近一次自评达标，视为「掌握」 */
export const MASTERY_ATTEMPTS = 2
export const MASTERY_RATING = 3

/** 场景学习顺序。未列出的场景按 order 自动排在后面（新增内容不用改这里）。 */
export const SCENE_ORDER: string[] = [
  'asking-repetition',
  'cafe-ordering',
  'asking-directions',
  'phone-reschedule',
]

/** 功能句式分类：同时决定句式库筛选项与「新句式」的教学顺序 */
export const FUNCTION_CATEGORIES: { key: string; label: string; emoji: string }[] =
  [
    { key: 'clarify', label: '没听懂', emoji: '🙋' },
    { key: 'request', label: '请求', emoji: '🙏' },
    { key: 'confirm', label: '确认信息', emoji: '✅' },
    { key: 'stall', label: '争取时间', emoji: '⏳' },
    { key: 'paraphrase', label: '绕开不会的词', emoji: '🔁' },
    { key: 'decline', label: '委婉拒绝', emoji: '🙅' },
    { key: 'opinion', label: '表达观点', emoji: '💬' },
    { key: 'smalltalk', label: '寒暄开启话题', emoji: '☀️' },
  ]

export const LEVELS: Level[] = ['A2', 'B1', 'B2']

export const LEVEL_LABELS: Record<Level, string> = {
  A2: '基础',
  B1: '进阶',
  B2: '中高',
}

/** 场景分类的展示顺序（未列出的分类自动追加到末尾） */
export const SCENE_CATEGORY_ORDER = ['沟通', '餐饮', '出行', '安排', '社交', '工作']

/** 前 N 天优先安排「跟读」，之后与「角色扮演」隔天交替 */
export const SHADOW_FIRST_DAYS = 2
