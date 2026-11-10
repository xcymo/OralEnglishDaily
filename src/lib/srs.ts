import { LOW_RATING_THRESHOLD, REVIEW_INTERVALS } from '@/content/curriculum'
import type { ReviewItem, ReviewKind, SelfRating } from '@/types'
import { addDays } from './date'

export function reviewKey(kind: ReviewKind, refId: string): string {
  return `${kind}:${refId}`
}

export function parseReviewKey(key: string): { kind: ReviewKind; refId: string } {
  const [kind, ...rest] = key.split(':')
  return {
    kind: kind === 'scene' ? 'scene' : 'pattern',
    refId: rest.join(':'),
  }
}

/** 把三维自评折算成一个 1-5 的复习难度分 */
export function reviewRating(rating: SelfRating): number {
  const base = (rating.fluency + rating.pronunciation) / 2
  const adjusted = base - (rating.stuck ? 1 : 0)
  return Math.max(1, Math.min(5, Math.round(adjusted)))
}

export function createReviewItem(
  kind: ReviewKind,
  refId: string,
  date: string,
  rating: number,
): ReviewItem {
  return {
    key: reviewKey(kind, refId),
    kind,
    refId,
    intervalIndex: 0,
    dueDate: addDays(date, REVIEW_INTERVALS[0]),
    lastRating: rating,
    lapses: 0,
    seen: 0,
    updatedAt: new Date().toISOString(),
  }
}

/** 根据本次自评推进复习间隔：低分回退，3/4 前进一档，5 前进两档 */
export function scheduleReview(
  item: ReviewItem,
  rating: number,
  date: string,
): ReviewItem {
  const maxIndex = REVIEW_INTERVALS.length - 1
  let intervalIndex = item.intervalIndex
  let lapses = item.lapses

  if (rating <= LOW_RATING_THRESHOLD) {
    intervalIndex = 0
    lapses += 1
  } else if (rating >= 5) {
    intervalIndex = Math.min(maxIndex, intervalIndex + 2)
  } else {
    intervalIndex = Math.min(maxIndex, intervalIndex + 1)
  }

  return {
    ...item,
    intervalIndex,
    lapses,
    lastRating: rating,
    seen: item.seen + 1,
    dueDate: addDays(date, REVIEW_INTERVALS[intervalIndex]),
    updatedAt: new Date().toISOString(),
  }
}

export function isDue(item: ReviewItem, date: string): boolean {
  return item.dueDate <= date
}

/** 复习优先级：越早到期越靠前，同一天到期时低分优先 */
export function sortForReview(a: ReviewItem, b: ReviewItem): number {
  return (
    a.dueDate.localeCompare(b.dueDate) ||
    a.lastRating - b.lastRating ||
    a.intervalIndex - b.intervalIndex
  )
}

export function intervalLabel(index: number): string {
  const days = REVIEW_INTERVALS[Math.max(0, Math.min(REVIEW_INTERVALS.length - 1, index))]
  if (days >= 30) return '30 天'
  return `${days} 天`
}
