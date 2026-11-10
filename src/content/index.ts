/**
 * 内容自动加载。
 * - 新增 src/content/scenes/*.json 或 src/content/patterns/*.json 后自动出现在 App 中；
 * - 页面组件不感知文件名，只消费标准化后的 ContentBundle；
 * - 校验失败会在开发环境打印详细错误，并在「设置 → 内容状态」里展示条数。
 */
import type {
  Chunk,
  ContentBundle,
  Pattern,
  Scene,
  ValidationIssue,
} from '@/types'
import {
  FUNCTION_CATEGORIES,
  SCENE_CATEGORY_ORDER,
  SCENE_ORDER,
} from './curriculum'
import {
  unwrapCollection,
  validatePattern,
  validateScene,
} from './schema'

const sceneModules = import.meta.glob('./scenes/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>

const patternModules = import.meta.glob('./patterns/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>

function displayFile(path: string) {
  return path.replace(/^\.\//, '')
}

function categoryRank(category: string) {
  const index = FUNCTION_CATEGORIES.findIndex((c) => c.key === category)
  return index === -1 ? 999 : index
}

function sceneRank(scene: Scene) {
  const index = SCENE_ORDER.indexOf(scene.id)
  return { index: index === -1 ? 999 : index, listed: index !== -1 }
}

function buildContent(): ContentBundle {
  const issues: ValidationIssue[] = []
  const scenes: Scene[] = []
  const patterns: Pattern[] = []
  const sceneIds = new Set<string>()
  const patternIds = new Set<string>()
  const chunkIds = new Set<string>()
  const errorCount = () =>
    issues.reduce((count, issue) => count + (issue.level === 'error' ? 1 : 0), 0)

  Object.entries(sceneModules).forEach(([path, mod]) => {
    const file = displayFile(path)
    const errorsBefore = errorCount()
    const scene = validateScene(mod, file, issues)
    // 有字段错误的内容直接跳过，避免半成品出现在 App 里
    if (!scene || errorCount() > errorsBefore) return
    if (sceneIds.has(scene.id)) {
      issues.push({
        file,
        path: 'id',
        message: `场景 id 重复：${scene.id}`,
        level: 'error',
      })
      return
    }
    for (const chunk of scene.targetChunks) {
      if (chunkIds.has(chunk.id)) {
        issues.push({
          file,
          path: 'targetChunks',
          message: `语块 id 全局重复：${chunk.id}（建议加场景前缀，如 ${scene.id}-01）`,
          level: 'error',
        })
      }
      chunkIds.add(chunk.id)
    }
    sceneIds.add(scene.id)
    scenes.push(scene)
  })

  Object.entries(patternModules).forEach(([path, mod]) => {
    const file = displayFile(path)
    const list = unwrapCollection(mod, 'patterns')
    if (list.length === 0) {
      issues.push({
        file,
        path: '',
        message: '文件里没有找到句式数组（应为数组或 { "patterns": [...] }）',
        level: 'error',
      })
      return
    }
    list.forEach((raw, index) => {
      const errorsBefore = errorCount()
      const pattern = validatePattern(raw, file, issues)
      if (!pattern || errorCount() > errorsBefore) return
      if (patternIds.has(pattern.id)) {
        issues.push({
          file,
          path: `[${index}].id`,
          message: `句式 id 重复：${pattern.id}`,
          level: 'error',
        })
        return
      }
      patternIds.add(pattern.id)
      patterns.push(pattern)
    })
  })

  // 句式引用完整性：缺失的引用只警告并过滤，不阻塞整个场景
  scenes.forEach((scene) => {
    const valid = scene.targetPatterns.filter((id) => patternIds.has(id))
    scene.targetPatterns
      .filter((id) => !patternIds.has(id))
      .forEach((id) => {
        issues.push({
          file: `scenes/${scene.id}.json`,
          path: 'targetPatterns',
          message: `引用的句式不存在：${id}（已忽略该引用）`,
          level: 'warning',
        })
      })
    scene.targetPatterns = valid
  })

  patterns.sort(
    (a, b) =>
      categoryRank(a.functionCategory) - categoryRank(b.functionCategory) ||
      a.id.localeCompare(b.id),
  )

  scenes.sort((a, b) => {
    const ra = sceneRank(a)
    const rb = sceneRank(b)
    if (ra.listed && rb.listed) return ra.index - rb.index
    if (ra.listed !== rb.listed) return ra.listed ? -1 : 1
    return a.order - b.order || a.titleZh.localeCompare(b.titleZh)
  })

  const sceneMap: Record<string, Scene> = {}
  const patternMap: Record<string, Pattern> = {}
  const chunkMap: Record<string, Chunk> = {}
  scenes.forEach((scene) => {
    sceneMap[scene.id] = scene
    scene.targetChunks.forEach((chunk) => {
      chunkMap[chunk.id] = chunk
    })
  })
  patterns.forEach((pattern) => {
    patternMap[pattern.id] = pattern
  })

  if (import.meta.env.DEV && issues.length > 0) {
    const errors = issues.filter((i) => i.level === 'error')
    const warnings = issues.filter((i) => i.level === 'warning')
    if (errors.length > 0) {
      console.error(
        `%c[内容校验] 发现 ${errors.length} 个错误，相关内容已被跳过`,
        'color:#dc2626;font-weight:bold',
      )
      errors.forEach((issue) =>
        console.error(`  ${issue.file} → ${issue.path || '(根)'}：${issue.message}`),
      )
    }
    if (warnings.length > 0) {
      console.warn(`[内容校验] ${warnings.length} 条提醒`)
      warnings.forEach((issue) =>
        console.warn(`  ${issue.file} → ${issue.path || '(根)'}：${issue.message}`),
      )
    }
  }

  return { scenes, patterns, sceneMap, patternMap, chunkMap, issues }
}

export const content: ContentBundle = buildContent()

export function getScene(id: string | undefined): Scene | undefined {
  return id ? content.sceneMap[id] : undefined
}

export function getPattern(id: string | undefined): Pattern | undefined {
  return id ? content.patternMap[id] : undefined
}

export function getChunk(id: string | undefined): Chunk | undefined {
  return id ? content.chunkMap[id] : undefined
}

export function getSceneOfChunk(chunkId: string): Scene | undefined {
  return content.scenes.find((scene) =>
    scene.targetChunks.some((chunk) => chunk.id === chunkId),
  )
}

export function functionCategoryLabel(key: string): string {
  return FUNCTION_CATEGORIES.find((c) => c.key === key)?.label ?? key
}

export function functionCategoryEmoji(key: string): string {
  return FUNCTION_CATEGORIES.find((c) => c.key === key)?.emoji ?? '💬'
}

/** 反查：哪些场景用到了这个句式（用于句式详情页，体现「句式与场景解耦」） */
export function scenesUsingPattern(patternId: string): Scene[] {
  return content.scenes.filter((scene) => scene.targetPatterns.includes(patternId))
}

/** 场景分类列表，按 curriculum 里的固定顺序，未知分类追加在后面 */
export function sceneCategories(): string[] {
  const found = Array.from(new Set(content.scenes.map((s) => s.category)))
  const ordered: string[] = []
  SCENE_CATEGORY_ORDER.forEach((c) => {
    if (found.includes(c)) ordered.push(c)
  })
  found.forEach((c) => {
    if (!ordered.includes(c)) ordered.push(c)
  })
  return ordered
}
