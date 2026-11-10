/**
 * 每日任务生成器。
 * 规则全部来自 src/content/curriculum.ts；内容全部来自自动加载的 content bundle。
 * 页面组件不参与任何「今天学什么」的判断。
 */
import { content, getPattern, getScene } from '@/content'
import {
  CONTENT_VERSION,
  DAILY_LOADS,
  FUNCTION_CATEGORIES,
  SHADOW_FIRST_DAYS,
} from '@/content/curriculum'
import type {
  Chunk,
  DailyPlan,
  DailyTask,
  LoadKey,
  Pattern,
  Progress,
  Scene,
  TaskTag,
} from '@/types'
import { addDays, diffDays, epochDay } from './date'

const MAX_PLANS = 60

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

/** 按日期稳定轮换，保证同一天生成结果一致，不同天有变化 */
export function pickRotated<T>(
  list: T[],
  date: string,
  count: number,
  salt: string | number = 0,
): T[] {
  if (list.length === 0) return []
  const offset = typeof salt === 'number' ? salt : hashString(salt)
  const start = (epochDay(date) + offset) % list.length
  const result: T[] = []
  for (let i = 0; i < Math.min(count, list.length); i += 1) {
    result.push(list[(start + i) % list.length])
  }
  return result
}

export function learnedChunkSet(progress: Progress, sceneId: string): Set<string> {
  return new Set(progress.learnedChunkIds[sceneId] ?? [])
}

/** 下一个还没学完的场景（按 curriculum 顺序，未列出的场景自动排在后面） */
export function nextLearningScene(
  progress: Progress,
): { scene: Scene; remaining: Chunk[] } | null {
  for (const scene of content.scenes) {
    const learned = learnedChunkSet(progress, scene.id)
    const remaining = scene.targetChunks.filter((c) => !learned.has(c.id))
    if (remaining.length > 0) return { scene, remaining }
  }
  return null
}

export function nextNewPatterns(progress: Progress, count: number): Pattern[] {
  const learned = new Set(progress.learnedPatternIds)
  return content.patterns.filter((p) => !learned.has(p.id)).slice(0, count)
}

function categoryLabel(key: string): string {
  return FUNCTION_CATEGORIES.find((c) => c.key === key)?.label ?? key
}

function latestPracticedScene(progress: Progress): Scene | null {
  for (let i = content.scenes.length - 1; i >= 0; i -= 1) {
    const scene = content.scenes[i]
    if ((progress.learnedChunkIds[scene.id] ?? []).length > 0) return scene
  }
  return content.scenes[0] ?? null
}

function makeTask(
  base: Omit<DailyTask, 'status' | 'order'>,
  usedIds: Set<string>,
): DailyTask {
  let id = base.id
  let suffix = 2
  while (usedIds.has(id)) {
    id = `${base.id}-${suffix}`
    suffix += 1
  }
  usedIds.add(id)
  return { ...base, id, status: 'pending', order: 0 }
}

function sceneLearnTask(
  scene: Scene,
  chunks: Chunk[],
  patternIds: string[],
  date: string,
): Omit<DailyTask, 'status' | 'order'> {
  const chunkIds = chunks.map((c) => c.id)
  const minutes = Math.max(3, Math.round(2 + chunkIds.length * 0.45 + patternIds.length * 0.6))
  return {
    id: `${date}-scene-${scene.id}-${chunkIds[0] ?? 0}`,
    date,
    type: 'scene-learn',
    tag: 'new',
    title: scene.titleZh,
    description: `${chunkIds.length} 个高频语块 · 看懂再开口`,
    estimatedMinutes: minutes,
    sceneId: scene.id,
    chunkIds,
    patternIds,
  }
}

function patternTask(
  patterns: Pattern[],
  date: string,
  tag: TaskTag,
): Omit<DailyTask, 'status' | 'order'> {
  const labels = Array.from(
    new Set(patterns.map((p) => categoryLabel(p.functionCategory))),
  ).join(' / ')
  return {
    id: `${date}-pattern-${patterns.map((p) => p.id).join('_')}`,
    date,
    type: 'pattern-substitute',
    tag,
    title: `句式替换 · ${labels}`,
    description: '把句式换成自己的话，说一遍',
    estimatedMinutes: Math.max(3, Math.round(2 + patterns.length * 1.2)),
    patternIds: patterns.map((p) => p.id),
  }
}

function shadowTask(
  scene: Scene,
  chunks: Chunk[],
  date: string,
): Omit<DailyTask, 'status' | 'order'> {
  return {
    id: `${date}-shadow-${scene.id}`,
    date,
    type: 'shadow',
    tag: 'new',
    title: `跟读 · ${scene.titleZh}`,
    description: `${chunks.length} 句话，听一遍、跟一遍`,
    estimatedMinutes: Math.max(3, Math.round(1 + chunks.length * 0.7)),
    sceneId: scene.id,
    chunkIds: chunks.map((c) => c.id),
  }
}

function roleplayTask(
  scene: Scene,
  date: string,
): Omit<DailyTask, 'status' | 'order'> {
  return {
    id: `${date}-roleplay-${scene.id}`,
    date,
    type: 'roleplay',
    tag: 'new',
    title: `角色扮演 · ${scene.titleZh}`,
    description: '完整走一遍真实对话，录音后自评',
    estimatedMinutes: 4,
    sceneId: scene.id,
  }
}

function reviewSceneTask(
  scene: Scene,
  chunkIds: string[],
  date: string,
  key: string | null,
  title?: string,
): Omit<DailyTask, 'status' | 'order'> {
  return {
    id: key
      ? `${date}-review-${key.replace(':', '-')}`
      : `${date}-review-warmup-${scene.id}`,
    date,
    type: 'review',
    tag: 'review',
    title: title ?? `复习 · ${scene.titleZh}`,
    description: `快速回忆 ${chunkIds.length} 个语块，先想再说`,
    estimatedMinutes: Math.max(2, Math.round(1.5 + chunkIds.length * 0.5)),
    sceneId: scene.id,
    chunkIds,
    reviewKeys: key ? [key] : [],
  }
}

function reviewPatternTask(
  pattern: Pattern,
  date: string,
  key: string,
): Omit<DailyTask, 'status' | 'order'> {
  return {
    id: `${date}-review-${key.replace(':', '-')}`,
    date,
    type: 'review',
    tag: 'review',
    title: `复习 · ${pattern.patternZh}`,
    description: '换个说法再说一遍，别背原句',
    estimatedMinutes: 4,
    patternIds: [pattern.id],
    reviewKeys: [key],
  }
}

export function generatePlan(progress: Progress, date: string): DailyPlan {
  const load = DAILY_LOADS[progress.settings.load]
  const usedIds = new Set<string>()
  const tasks: DailyTask[] = []

  /* 1. 新场景语块 */
  const learning = nextLearningScene(progress)
  let todayScene: Scene | null = learning?.scene ?? null
  let todayChunkIds: string[] = []
  if (learning) {
    const take = learning.remaining.slice(0, load.chunkLimit)
    todayChunkIds = take.map((c) => c.id)
    const previewPatternId = learning.scene.targetPatterns[0]
    tasks.push(
      makeTask(
        sceneLearnTask(
          learning.scene,
          take,
          previewPatternId && getPattern(previewPatternId)
            ? [previewPatternId]
            : [],
          date,
        ),
        usedIds,
      ),
    )
  }

  /* 2. 新句式 / 巩固句式 */
  const newPatterns = nextNewPatterns(progress, load.patternCount)
  let todayPatternIds: string[] = []
  if (newPatterns.length > 0) {
    todayPatternIds = newPatterns.map((p) => p.id)
    tasks.push(makeTask(patternTask(newPatterns, date, 'new'), usedIds))
  } else {
    const fallback = [...content.patterns]
      .filter((p) => progress.learnedPatternIds.includes(p.id))
      .sort(
        (a, b) =>
          (progress.patternStats[a.id]?.lastRating ?? 0) -
          (progress.patternStats[b.id]?.lastRating ?? 0),
      )
      .slice(0, Math.max(1, load.patternCount))
    if (fallback.length > 0) {
      todayPatternIds = fallback.map((p) => p.id)
      tasks.push(makeTask(patternTask(fallback, date, 'review'), usedIds))
    }
  }

  /* 3. 跟读 / 角色扮演 */
  const speakingScene = todayScene ?? latestPracticedScene(progress)
  if (speakingScene) {
    const dayIndex = Math.max(0, diffDays(progress.createdAt, date))
    const useShadow = dayIndex < SHADOW_FIRST_DAYS || dayIndex % 2 === 0
    const learned = progress.learnedChunkIds[speakingScene.id] ?? []
    const pool = todayScene?.id === speakingScene.id && todayChunkIds.length
      ? todayChunkIds
      : learned.length
        ? learned
        : speakingScene.targetChunks.map((c) => c.id)
    const shadowChunks = pickRotated(pool, date, 4, speakingScene.id)
      .map((id) => content.chunkMap[id])
      .filter((c): c is Chunk => Boolean(c))
    if (useShadow && shadowChunks.length > 0) {
      tasks.push(makeTask(shadowTask(speakingScene, shadowChunks, date), usedIds))
    } else {
      tasks.push(makeTask(roleplayTask(speakingScene, date), usedIds))
    }
  }

  /* 4. 复习：优先到期项，低分优先 */
  const queue = [...progress.reviewQueue].sort(
    (a, b) =>
      a.dueDate.localeCompare(b.dueDate) || a.lastRating - b.lastRating,
  )
  const picked = queue.slice(0, load.reviewCount)
  picked.forEach((item) => {
    if (item.kind === 'scene') {
      const scene = getScene(item.refId)
      if (!scene) return
      const learned = progress.learnedChunkIds[scene.id] ?? []
      const pool = learned.length
        ? learned
        : scene.targetChunks.map((c) => c.id)
      const chunks = pickRotated(pool, date, 3, scene.id)
      if (chunks.length === 0) return
      tasks.push(
        makeTask(reviewSceneTask(scene, chunks, date, item.key), usedIds),
      )
    } else {
      const pattern = getPattern(item.refId)
      if (!pattern) return
      tasks.push(makeTask(reviewPatternTask(pattern, date, item.key), usedIds))
    }
  })

  /* 5. 还没有可复习的内容时，给今天的新内容安排一次「巩固」 */
  if (picked.length === 0) {
    if (todayScene && todayChunkIds.length > 0) {
      tasks.push(
        makeTask(
          reviewSceneTask(
            todayScene,
            todayChunkIds.slice(0, 3),
            date,
            null,
            `巩固 · ${todayScene.titleZh}`,
          ),
          usedIds,
        ),
      )
    } else if (todayPatternIds.length > 0) {
      const pattern = getPattern(todayPatternIds[0])
      if (pattern) {
        tasks.push(
          makeTask(
            {
              ...patternTask([pattern], date, 'review'),
              id: `${date}-review-warmup-pattern-${pattern.id}`,
              title: `巩固 · ${categoryLabel(pattern.functionCategory)}`,
            },
            usedIds,
          ),
        )
      }
    }
  }

  const ordered = tasks.map((task, index) => ({ ...task, order: index }))
  return {
    date,
    load: progress.settings.load,
    contentVersion: CONTENT_VERSION,
    generatedAt: new Date().toISOString(),
    tasks: ordered,
  }
}

function prunePlans(
  plans: Record<string, DailyPlan>,
  date: string,
): Record<string, DailyPlan> {
  const cutoff = addDays(date, -MAX_PLANS)
  const next: Record<string, DailyPlan> = {}
  Object.entries(plans).forEach(([key, plan]) => {
    if (key >= cutoff) next[key] = plan
  })
  return next
}

export interface EnsurePlanResult {
  progress: Progress
  plan: DailyPlan
  created: boolean
}

/** 同一天内始终复用已持久化的计划；跨天时生成新计划 */
export function ensurePlan(progress: Progress, date: string): EnsurePlanResult {
  const existing = progress.plans[date]
  if (existing) {
    // 设置改变时不影响今天已经固定下来的计划（从明天生效）
    return { progress, plan: existing, created: false }
  }
  const plan = generatePlan(progress, date)
  const plans = prunePlans({ ...progress.plans, [date]: plan }, date)
  return {
    progress: { ...progress, plans },
    plan,
    created: true,
  }
}

export function getPlan(progress: Progress, date: string): DailyPlan | undefined {
  return progress.plans[date]
}

export function planProgress(plan: DailyPlan): {
  done: number
  total: number
  minutes: number
  remainingMinutes: number
  nextTask: DailyTask | undefined
} {
  const done = plan.tasks.filter((t) => t.status === 'done').length
  const minutes = plan.tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0)
  const remainingMinutes = plan.tasks
    .filter((t) => t.status === 'pending')
    .reduce((sum, t) => sum + t.estimatedMinutes, 0)
  return {
    done,
    total: plan.tasks.length,
    minutes,
    remainingMinutes,
    nextTask: plan.tasks.find((t) => t.status === 'pending'),
  }
}

/** 从场景页发起的「额外练习」，不进入今日计划 */
export function buildExtraSceneTask(
  scene: Scene,
  progress: Progress,
  date: string,
  limit = 10,
): DailyTask {
  const learned = new Set(progress.learnedChunkIds[scene.id] ?? [])
  const remaining = scene.targetChunks.filter((c) => !learned.has(c.id))
  const take = (remaining.length > 0 ? remaining : scene.targetChunks).slice(
    0,
    limit,
  )
  const patternIds = scene.targetPatterns.slice(0, 1)
  return {
    ...sceneLearnTask(scene, take, patternIds, date),
    id: `extra-scene-${scene.id}-${Date.now()}`,
    tag: 'extra',
    title: remaining.length > 0 ? scene.titleZh : `再练一遍 · ${scene.titleZh}`,
    status: 'pending',
    order: 0,
  }
}

export function buildExtraPatternTask(pattern: Pattern, date: string): DailyTask {
  return {
    ...patternTask([pattern], date, 'extra'),
    id: `extra-pattern-${pattern.id}-${Date.now()}`,
    title: `替换造句 · ${pattern.patternZh}`,
    status: 'pending',
    order: 0,
  }
}

export function loadLabel(load: LoadKey): string {
  return DAILY_LOADS[load].label
}
