import { getChunk, getPattern } from '@/content'
import type { Chunk, DailyTask, PracticeStep } from '@/types'
import { epochDay } from './date'

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export function pickSubstitutionIndex(
  patternId: string,
  date: string,
  length: number,
): number {
  if (length <= 0) return 0
  return (epochDay(date) + hashString(patternId)) % length
}

/** 把句式里的 [方括号内容] 换成具体说法 */
export function fillPattern(patternEn: string, value: string): string {
  return patternEn.replace(/\[[^\]]+\]/, value)
}

/** 把可替换部分遮住，做成填空骨架 */
export function maskPattern(patternEn: string): string {
  return patternEn.replace(/\[[^\]]+\]/g, '____')
}

/**
 * 从任务数据推导练习步骤。
 * 不把步骤持久化，这样修改一个语块的 JSON 后，旧计划里的任务也能立刻用上新内容。
 */
export function buildSteps(task: DailyTask): PracticeStep[] {
  const steps: PracticeStep[] = [{ kind: 'intro', taskId: task.id }]
  const chunkIds = (task.chunkIds ?? []).filter((id) => Boolean(getChunk(id)))
  const patterns = (task.patternIds ?? [])
    .map((id) => getPattern(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))

  switch (task.type) {
    case 'scene-learn':
      chunkIds.forEach((chunkId) =>
        steps.push({ kind: 'chunk', sceneId: task.sceneId ?? '', chunkId }),
      )
      patterns.slice(0, 1).forEach((pattern) =>
        steps.push({ kind: 'pattern', patternId: pattern.id }),
      )
      break
    case 'shadow':
      chunkIds.forEach((chunkId) =>
        steps.push({ kind: 'shadow', sceneId: task.sceneId ?? '', chunkId }),
      )
      break
    case 'pattern-substitute':
      patterns.forEach((pattern) => {
        steps.push({ kind: 'pattern', patternId: pattern.id })
        steps.push({
          kind: 'substitute',
          patternId: pattern.id,
          substitutionIndex: pickSubstitutionIndex(
            pattern.id,
            task.date,
            pattern.substitutions.length,
          ),
        })
      })
      break
    case 'roleplay':
      if (task.sceneId) {
        steps.push({ kind: 'roleplay', sceneId: task.sceneId })
      }
      break
    case 'review':
      if (task.sceneId && chunkIds.length > 0) {
        chunkIds.forEach((chunkId) =>
          steps.push({ kind: 'recall', sceneId: task.sceneId ?? '', chunkId }),
        )
      } else {
        patterns.forEach((pattern) => {
          steps.push({ kind: 'pattern', patternId: pattern.id })
          steps.push({
            kind: 'substitute',
            patternId: pattern.id,
            substitutionIndex: pickSubstitutionIndex(
              pattern.id,
              task.date,
              pattern.substitutions.length,
            ),
          })
        })
      }
      break
    default:
      break
  }

  steps.push({ kind: 'rate', taskId: task.id })
  return steps
}

export function stepLabel(
  step: PracticeStep,
  steps: PracticeStep[],
  index: number,
): string {
  const sameKind = (kind: PracticeStep['kind']) =>
    steps.filter((item) => item.kind === kind)
  const positionIn = (kind: PracticeStep['kind']) =>
    sameKind(kind).findIndex((item) => item === step) + 1
  switch (step.kind) {
    case 'intro':
      return '准备开始'
    case 'chunk':
      return `语块 ${positionIn('chunk')} / ${sameKind('chunk').length}`
    case 'pattern':
      return '认识句式'
    case 'substitute':
      return '替换造句'
    case 'shadow':
      return `跟读 ${positionIn('shadow')} / ${sameKind('shadow').length}`
    case 'recall':
      return `回忆 ${positionIn('recall')} / ${sameKind('recall').length}`
    case 'roleplay':
      return '角色扮演'
    case 'rate':
      return '自评'
    default:
      return ''
  }
}

export function stepChunk(step: PracticeStep): Chunk | undefined {
  return 'chunkId' in step ? getChunk(step.chunkId) : undefined
}

/** 练习页需要展示的任务说明（不同任务类型的引导文案） */
export function taskIntro(task: DailyTask): {
  title: string
  subtitle: string
  tips: string[]
} {
  switch (task.type) {
    case 'scene-learn':
      return {
        title: '先看懂，再开口',
        subtitle: '每个语块停一下，听一遍、读一遍。不用背，先混个脸熟。',
        tips: ['点喇叭听示范', '按住麦克风跟读', '不会的直接跳过'],
      }
    case 'pattern-substitute':
      return {
        title: '一个句式，换着说',
        subtitle: '句式是骨架，把括号里的内容换成你自己的情况。',
        tips: ['先看清可替换部分', '按提示说一句', '说完再自评'],
      }
    case 'shadow':
      return {
        title: '跟读，不看字幕',
        subtitle: '先听一遍，再跟着说。模仿语气和节奏，比读准每个音更重要。',
        tips: ['先听再读', '一句读三遍', '录音回放听差别'],
      }
    case 'roleplay':
      return {
        title: '把整段对话演一遍',
        subtitle: '轮到你时，先自己说，再点开看示范。最后完整录一遍。',
        tips: ['先遮住答案', '用上刚学的语块', '录完整段再回放'],
      }
    case 'review':
      return {
        title: '先回忆，再看答案',
        subtitle: '看到中文，先努力说出来。想不起来再揭晓。',
        tips: ['别急着看答案', '说不出的标记卡壳', '说完再自评'],
      }
    default:
      return { title: '', subtitle: '', tips: [] }
  }
}
