/**
 * 课程配置：只放「学习顺序」和「每日任务规则」。
 * 页面组件不应该写死任何排序或每日任务规则，全部从这里读。
 */
import type { LoadKey, Level } from '@/types'

export const CONTENT_VERSION = '2026.11.3'

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
    chunkLimit: 12,
    patternCount: 2,
    reviewCount: 2,
    estimate: '约 20 分钟',
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
  'meeting-pushback',
  'salary-negotiation',
  'project-delay',
  'performance-review',
  'job-interview',
  'client-pitch',
  'difficult-feedback',
  'networking-event',
  'wedding-toast',
  'office-small-talk',
  'remote-work-boundaries',
  'catching-up-friends',
  'making-plans-friends',
  'dating-first-meet',
  'apologizing-repair',
  'neighbor-conflict',
  'moving-abroad',
  'hotel-complaint',
  'apartment-hunting',
  'contractor-repair',
  'restaurant-complaint',
  'returning-purchase',
  'airport-disruption',
  'lost-luggage',
  'rental-car',
  'customs-immigration',
  'doctor-visit',
  'pharmacy-consult',
  'mental-health-talk',
  'emergency-room',
  'bank-account-issue',
  'insurance-claim',
  'parent-teacher-meeting',
  'online-course-discussion',
  'tech-support-call',
  'smart-home-setup',
  'asking-repetition',
  'cafe-ordering',
  'asking-directions',
  'phone-reschedule',
]

/** 功能句式分类：同时决定句式库筛选项与「新句式」的教学顺序 */
export const FUNCTION_CATEGORIES: { key: string; label: string; emoji: string }[] =
  [
    { key: 'negotiate', label: '协商谈判', emoji: '🤝' },
    { key: 'disagree', label: '礼貌反驳', emoji: '⚖️' },
    { key: 'soften', label: '缓和语气', emoji: '🫧' },
    { key: 'nuance', label: '澄清细微差别', emoji: '🔍' },
    { key: 'idiom', label: '地道习语', emoji: '🧩' },
    { key: 'workplace', label: '职场沟通', emoji: '💼' },
    { key: 'complain', label: '投诉与补救', emoji: '🛎️' },
    { key: 'stories', label: '讲故事', emoji: '📖' },
    { key: 'clarify', label: '没听懂', emoji: '🙋' },
    { key: 'request', label: '请求', emoji: '🙏' },
    { key: 'confirm', label: '确认信息', emoji: '✅' },
    { key: 'stall', label: '争取时间', emoji: '⏳' },
    { key: 'paraphrase', label: '绕开不会的词', emoji: '🔁' },
    { key: 'decline', label: '委婉拒绝', emoji: '🙅' },
    { key: 'opinion', label: '表达观点', emoji: '💬' },
    { key: 'smalltalk', label: '寒暄开启话题', emoji: '☀️' },
  ]

export const LEVELS: Level[] = ['A2', 'B1', 'B2', 'C1', 'C2']

export const LEVEL_LABELS: Record<Level, string> = {
  A2: '基础',
  B1: '进阶',
  B2: '中高',
  C1: '高级',
  C2: '近母语',
}

/** 场景分类的展示顺序（未列出的分类自动追加到末尾） */
export const SCENE_CATEGORY_ORDER = [
  '工作',
  '社交',
  '生活',
  '服务',
  '医疗',
  '金融',
  '教育',
  '科技',
  '沟通',
  '出行',
  '餐饮',
  '安排',
]

/** 前 N 天优先安排「跟读」，之后与「角色扮演」隔天交替 */
export const SHADOW_FIRST_DAYS = 2
