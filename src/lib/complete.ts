/**
 * 完成一个任务后对学习状态的副作用（纯函数，便于推理和测试）。
 */
import { getPattern, getScene } from '@/content'
import { MASTERY_ATTEMPTS, MASTERY_RATING } from '@/content/curriculum'
import type {
  DailyTask,
  PatternStat,
  Progress,
  ReviewItem,
  SelfRating,
  StuckNote,
} from '@/types'
import { diffDays } from './date'
import { createReviewItem, reviewRating, scheduleReview } from './srs'

function overallMinutes(task: DailyTask) {
  return task.estimatedMinutes
}

function upsertReview(
  queue: ReviewItem[],
  kind: 'scene' | 'pattern',
  refId: string,
  rate: number,
  date: string,
  onlyIfMissing: boolean,
): ReviewItem[] {
  const index = queue.findIndex((item) => item.kind === kind && item.refId === refId)
  if (index === -1) {
    return [...queue, createReviewItem(kind, refId, date, rate)]
  }
  if (onlyIfMissing) return queue
  const next = [...queue]
  next[index] = scheduleReview(queue[index], rate, date)
  return next
}

export function applyCompletion(
  progress: Progress,
  task: DailyTask,
  rating: SelfRating,
  now: Date = new Date(),
): Progress {
  const date = task.date
  const nowIso = now.toISOString()
  const score = reviewRating(rating)
  let next: Progress = { ...progress }

  // 1. 计划里的任务状态
  const plan = progress.plans[date]
  if (plan) {
    const taskInPlan = plan.tasks.find((t) => t.id === task.id)
    if (taskInPlan?.status === 'done') return progress
    next = {
      ...next,
      plans: {
        ...progress.plans,
        [date]: {
          ...plan,
          tasks: plan.tasks.map((t) =>
            t.id === task.id
              ? {
                  ...t,
                  status: 'done',
                  selfRating: rating,
                  completedAt: nowIso,
                }
              : t,
          ),
        },
      },
    }
  }

  // 2. 语块学习进度
  if ((task.type === 'scene-learn' || task.tag === 'extra') && task.sceneId && task.chunkIds) {
    const scene = getScene(task.sceneId)
    if (scene) {
      const existing = new Set(progress.learnedChunkIds[scene.id] ?? [])
      task.chunkIds.forEach((id) => existing.add(id))
      next = {
        ...next,
        learnedChunkIds: {
          ...next.learnedChunkIds,
          [scene.id]: Array.from(existing),
        },
      }
      const sceneDone = scene.targetChunks.every((chunk) => existing.has(chunk.id))
      next = {
        ...next,
        learnedSceneIds:
          sceneDone && !next.learnedSceneIds.includes(scene.id)
            ? [...next.learnedSceneIds, scene.id]
            : next.learnedSceneIds,
        // 即使场景还没学完，也把今天学过的语块排进明天的复习
        reviewQueue: upsertReview(
          next.reviewQueue,
          'scene',
          scene.id,
          score,
          date,
          true,
        ),
      }
    }
  }

  // 3. 句式学习进度
  if (task.type === 'pattern-substitute' && task.patternIds) {
    const learned = new Set(next.learnedPatternIds)
    const patternStats = { ...next.patternStats }
    let queue = next.reviewQueue
    task.patternIds.forEach((id) => {
      const pattern = getPattern(id)
      if (!pattern) return
      learned.add(id)
      const prev: PatternStat = patternStats[id] ?? {
        attempts: 0,
        lastRating: 0,
        bestRating: 0,
        lastPracticedAt: nowIso,
      }
      patternStats[id] = {
        attempts: prev.attempts + 1,
        lastRating: score,
        bestRating: Math.max(prev.bestRating, score),
        lastPracticedAt: nowIso,
      }
      queue = upsertReview(queue, 'pattern', id, score, date, true)
    })
    next = {
      ...next,
      learnedPatternIds: Array.from(learned),
      patternStats,
      reviewQueue: queue,
    }
  }

  // 4. 复习任务：推进 SRS
  if (task.type === 'review' && task.reviewKeys && task.reviewKeys.length > 0) {
    let queue = next.reviewQueue
    task.reviewKeys.forEach((key) => {
      const item = queue.find((q) => q.key === key)
      if (item) {
        queue = queue.map((q) => (q.key === key ? scheduleReview(q, score, date) : q))
      } else if (key.startsWith('scene:')) {
        queue = upsertReview(queue, 'scene', key.slice(6), score, date, false)
      } else if (key.startsWith('pattern:')) {
        queue = upsertReview(queue, 'pattern', key.slice(8), score, date, false)
      }
    })
    // 复习里出现的句式也更新一下练习统计，用于「掌握句式」
    if (task.patternIds) {
      const patternStats = { ...next.patternStats }
      task.patternIds.forEach((id) => {
        if (!getPattern(id)) return
        const prev: PatternStat = patternStats[id] ?? {
          attempts: 0,
          lastRating: 0,
          bestRating: 0,
          lastPracticedAt: nowIso,
        }
        patternStats[id] = {
          attempts: prev.attempts + 1,
          lastRating: score,
          bestRating: Math.max(prev.bestRating, score),
          lastPracticedAt: nowIso,
        }
      })
      next = { ...next, patternStats }
    }
    next = { ...next, reviewQueue: queue }
  }

  // 5. 角色扮演 / 跟读：场景已学完时也进入复习队列
  if (
    (task.type === 'roleplay' || task.type === 'shadow') &&
    task.sceneId
  ) {
    const scene = getScene(task.sceneId)
    const learned = progress.learnedChunkIds[task.sceneId] ?? []
    if (scene && learned.length === scene.targetChunks.length) {
      next = {
        ...next,
        reviewQueue: upsertReview(
          next.reviewQueue,
          'scene',
          scene.id,
          score,
          date,
          true,
        ),
      }
    }
  }

  // 6. 卡壳记录
  if (rating.stuck || (rating.note && rating.note.trim())) {
    const note: StuckNote = {
      id: `stuck-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date,
      kind: task.patternIds?.length ? 'pattern' : 'task',
      refId: task.patternIds?.[0] ?? task.sceneId ?? task.id,
      sceneId: task.sceneId,
      text: task.title,
      note: (rating.note ?? '').trim() || '自己标记了卡壳',
    }
    next = { ...next, stuckNotes: [note, ...next.stuckNotes].slice(0, 200) }
  }

  // 7. 连续打卡与今日活动
  let streak = next.streak
  let lastActiveDate = next.lastActiveDate
  if (lastActiveDate !== date) {
    streak =
      lastActiveDate && diffDays(lastActiveDate, date) === 1
        ? next.streak + 1
        : 1
    lastActiveDate = date
  }
  const prevActivity = next.activity[date] ?? {
    completed: 0,
    minutes: 0,
    ratedFluency: [],
  }
  const activity = {
    ...next.activity,
    [date]: {
      completed: prevActivity.completed + 1,
      minutes: prevActivity.minutes + overallMinutes(task),
      ratedFluency: [...prevActivity.ratedFluency, rating.fluency],
    },
  }

  // 8. 历史记录 + 会话清理
  const record = {
    taskId: task.id,
    date,
    type: task.type,
    title: task.title,
    rating,
    completedAt: nowIso,
    extra: task.tag === 'extra',
  }
  const sessions = { ...next.sessions }
  delete sessions[task.id]

  return {
    ...next,
    streak,
    lastActiveDate,
    activity,
    history: [record, ...next.history].slice(0, 120),
    completedTaskIds: next.completedTaskIds.includes(task.id)
      ? next.completedTaskIds
      : [...next.completedTaskIds, task.id],
    sessions,
  }
}

export function isPatternMastered(
  progress: Progress,
  patternId: string,
): boolean {
  const stat = progress.patternStats[patternId]
  return (
    Boolean(stat) &&
    stat.attempts >= MASTERY_ATTEMPTS &&
    stat.lastRating >= MASTERY_RATING
  )
}

export function masteredPatternCount(progress: Progress): number {
  return Object.keys(progress.patternStats).filter((id) =>
    isPatternMastered(progress, id),
  ).length
}

export function currentStreak(progress: Progress, today: string): number {
  if (!progress.lastActiveDate) return 0
  const diff = diffDays(progress.lastActiveDate, today)
  return diff === 0 || diff === 1 ? progress.streak : 0
}
