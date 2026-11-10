/**
 * 内容 schema 校验。
 * 不依赖第三方库，错误信息尽量具体：「哪个文件、哪个字段、哪里不对」。
 * 新增内容时若字段写错，开发环境会在控制台和「设置 → 内容状态」里看到明确提示。
 */
import type {
  Chunk,
  Pattern,
  Roleplay,
  RoleplayLine,
  Scene,
  ValidationIssue,
} from '@/types'

const LEVELS = ['A2', 'B1', 'B2']
const SPEAKERS = ['staff', 'you', 'other']

interface Ctx {
  file: string
  issues: ValidationIssue[]
  error: (path: string, message: string) => void
  warning: (path: string, message: string) => void
}

function createCtx(file: string, issues: ValidationIssue[]): Ctx {
  return {
    file,
    issues,
    error: (path, message) =>
      issues.push({ file, path, message, level: 'error' }),
    warning: (path, message) =>
      issues.push({ file, path, message, level: 'warning' }),
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  )
}

function readString(
  ctx: Ctx,
  obj: Record<string, unknown>,
  key: string,
  path: string,
  opts: { required?: boolean; max?: number } = {},
): string {
  const { required = true, max = 400 } = opts
  const value = obj[key]
  if (value === undefined || value === null) {
    if (required) ctx.error(path, '缺少必填字段')
    return ''
  }
  if (typeof value !== 'string') {
    ctx.error(path, '应为字符串')
    return ''
  }
  const trimmed = value.trim()
  if (required && !trimmed) {
    ctx.error(path, '不能为空')
    return ''
  }
  if (trimmed.length > max) {
    ctx.error(path, `长度超过 ${max} 个字符`)
  }
  return trimmed
}

function readNumber(
  ctx: Ctx,
  obj: Record<string, unknown>,
  key: string,
  path: string,
  opts: { min?: number; max?: number; required?: boolean } = {},
): number {
  const { min, max, required = true } = opts
  const value = obj[key]
  if (value === undefined || value === null) {
    if (required) ctx.error(path, '缺少必填字段')
    return 0
  }
  if (typeof value !== 'number' || Number.isNaN(value)) {
    ctx.error(path, '应为数字')
    return 0
  }
  if (min !== undefined && value < min) ctx.error(path, `不能小于 ${min}`)
  if (max !== undefined && value > max) ctx.error(path, `不能大于 ${max}`)
  return value
}

function readStringArray(
  ctx: Ctx,
  obj: Record<string, unknown>,
  key: string,
  path: string,
  maxLength = 40,
): string[] {
  const value = obj[key]
  if (!Array.isArray(value)) {
    ctx.error(path, '应为字符串数组')
    return []
  }
  const result: string[] = []
  value.forEach((item, i) => {
    if (typeof item !== 'string' || !item.trim()) {
      ctx.error(`${path}[${i}]`, '应为非空字符串')
      return
    }
    result.push(item.trim())
  })
  if (result.length > maxLength) {
    ctx.warning(path, `数量超过 ${maxLength} 个，建议精简`)
  }
  return result
}

function readLevel(ctx: Ctx, obj: Record<string, unknown>, path: string): Scene['level'] {
  const value = obj.level
  if (typeof value !== 'string' || !LEVELS.includes(value)) {
    ctx.error(path, `难度只能是 ${LEVELS.join(' / ')}`)
    return 'A2'
  }
  return value as Scene['level']
}

function validateChunk(
  ctx: Ctx,
  raw: unknown,
  path: string,
): Chunk | null {
  if (!isPlainObject(raw)) {
    ctx.error(path, '语块应为对象')
    return null
  }
  const id = readString(ctx, raw, 'id', `${path}.id`, { max: 80 })
  if (id && !/^[a-z0-9][a-z0-9-]*$/.test(id)) {
    ctx.error(`${path}.id`, '只能使用小写字母、数字和连字符，例如 cafe-01')
  }
  const en = readString(ctx, raw, 'en', `${path}.en`, { max: 200 })
  const zh = readString(ctx, raw, 'zh', `${path}.zh`, { max: 200 })
  if (en && !/[a-zA-Z]/.test(en)) {
    ctx.warning(`${path}.en`, '英文内容里没有英文字母，确认一下？')
  }
  return {
    id,
    en,
    zh,
    note: readString(ctx, raw, 'note', `${path}.note`, {
      required: false,
      max: 300,
    }),
    exampleEn: readString(ctx, raw, 'exampleEn', `${path}.exampleEn`, {
      required: false,
      max: 300,
    }),
    exampleZh: readString(ctx, raw, 'exampleZh', `${path}.exampleZh`, {
      required: false,
      max: 300,
    }),
    tags: Array.isArray(raw.tags)
      ? readStringArray(ctx, raw, 'tags', `${path}.tags`, 12)
      : [],
  }
}

function validateRoleplayLine(
  ctx: Ctx,
  raw: unknown,
  path: string,
): RoleplayLine | null {
  if (!isPlainObject(raw)) {
    ctx.error(path, '台词应为对象')
    return null
  }
  const speaker = raw.speaker
  if (typeof speaker !== 'string' || !SPEAKERS.includes(speaker)) {
    ctx.error(`${path}.speaker`, `只能是 ${SPEAKERS.join(' / ')}`)
  }
  return {
    speaker: (typeof speaker === 'string' && SPEAKERS.includes(speaker)
      ? speaker
      : 'other') as RoleplayLine['speaker'],
    en: readString(ctx, raw, 'en', `${path}.en`, { max: 300 }),
    zh: readString(ctx, raw, 'zh', `${path}.zh`, { max: 300 }),
  }
}

function validateRoleplay(ctx: Ctx, raw: unknown, path: string): Roleplay {
  if (!isPlainObject(raw)) {
    ctx.error(path, 'roleplay 应为对象')
    return { promptZh: '', promptEn: '', goals: [], script: [] }
  }
  const script = Array.isArray(raw.script)
    ? raw.script
        .map((line, i) => validateRoleplayLine(ctx, line, `${path}.script[${i}]`))
        .filter((line): line is RoleplayLine => line !== null)
    : []
  if (!Array.isArray(raw.script) || script.length === 0) {
    ctx.error(`${path}.script`, '角色扮演至少需要 1 句台词')
  }
  return {
    promptZh: readString(ctx, raw, 'promptZh', `${path}.promptZh`, {
      max: 300,
    }),
    promptEn: readString(ctx, raw, 'promptEn', `${path}.promptEn`, {
      max: 300,
    }),
    goals: Array.isArray(raw.goals)
      ? readStringArray(ctx, raw, 'goals', `${path}.goals`, 8)
      : [],
    script,
  }
}

export function validateScene(
  raw: unknown,
  file: string,
  issues: ValidationIssue[],
): Scene | null {
  const ctx = createCtx(file, issues)
  if (!isPlainObject(raw)) {
    ctx.error('', '场景文件的最外层必须是 JSON 对象')
    return null
  }
  const id = readString(ctx, raw, 'id', 'id', { max: 80 })
  if (id && !/^[a-z0-9][a-z0-9-]*$/.test(id)) {
    ctx.error('id', '只能使用小写字母、数字和连字符，例如 cafe-ordering')
  }
  const chunkIds = new Set<string>()
  const targetChunks = Array.isArray(raw.targetChunks)
    ? raw.targetChunks
        .map((chunk, i) => {
          const result = validateChunk(ctx, chunk, `targetChunks[${i}]`)
          if (result?.id) {
            if (chunkIds.has(result.id)) {
              ctx.error(`targetChunks[${i}].id`, `语块 id 重复：${result.id}`)
            }
            chunkIds.add(result.id)
          }
          return result
        })
        .filter((chunk): chunk is Chunk => chunk !== null)
    : []
  if (!Array.isArray(raw.targetChunks) || targetChunks.length === 0) {
    ctx.error('targetChunks', '至少需要 1 个语块')
  } else if (targetChunks.length < 10) {
    ctx.warning('targetChunks', '建议每个场景至少 10 个高频语块')
  }

  const targetPatterns = Array.isArray(raw.targetPatterns)
    ? readStringArray(ctx, raw, 'targetPatterns', 'targetPatterns', 20)
    : []
  if (!Array.isArray(raw.targetPatterns)) {
    ctx.warning('targetPatterns', '建议填写关联句式 id（字符串数组）')
  }

  return {
    id,
    titleZh: readString(ctx, raw, 'titleZh', 'titleZh', { max: 40 }),
    titleEn: readString(ctx, raw, 'titleEn', 'titleEn', { max: 80 }),
    category: readString(ctx, raw, 'category', 'category', { max: 20 }),
    level: readLevel(ctx, raw, 'level'),
    description: readString(ctx, raw, 'description', 'description', {
      max: 200,
    }),
    coverEmoji: readString(ctx, raw, 'coverEmoji', 'coverEmoji', { max: 8 }),
    tags: Array.isArray(raw.tags)
      ? readStringArray(ctx, raw, 'tags', 'tags', 12)
      : [],
    estimatedMinutes: readNumber(ctx, raw, 'estimatedMinutes', 'estimatedMinutes', {
      min: 1,
      max: 60,
    }),
    order: readNumber(ctx, raw, 'order', 'order', { min: 0, max: 999 }),
    targetChunks,
    targetPatterns,
    roleplay: validateRoleplay(ctx, raw.roleplay, 'roleplay'),
  }
}

export function validatePattern(
  raw: unknown,
  file: string,
  issues: ValidationIssue[],
): Pattern | null {
  const ctx = createCtx(file, issues)
  if (!isPlainObject(raw)) {
    ctx.error('', '句式应为对象')
    return null
  }
  const id = readString(ctx, raw, 'id', 'id', { max: 80 })
  if (id && !/^[a-z0-9][a-z0-9-]*$/.test(id)) {
    ctx.error('id', '只能使用小写字母、数字和连字符')
  }
  const patternEn = readString(ctx, raw, 'patternEn', 'patternEn', { max: 200 })
  const examples = Array.isArray(raw.examples)
    ? raw.examples
        .map((example, i) => {
          if (!isPlainObject(example)) {
            ctx.error(`examples[${i}]`, '例句应为对象')
            return null
          }
          return {
            en: readString(ctx, example, 'en', `examples[${i}].en`, { max: 300 }),
            zh: readString(ctx, example, 'zh', `examples[${i}].zh`, { max: 300 }),
          }
        })
        .filter((x): x is { en: string; zh: string } => x !== null)
    : []
  if (examples.length === 0) {
    ctx.error('examples', '至少需要 1 个例句')
  }

  const substitutions = Array.isArray(raw.substitutions)
    ? raw.substitutions
        .map((sub, i) => {
          if (!isPlainObject(sub)) {
            ctx.error(`substitutions[${i}]`, '替换项应为对象 { zh, en }')
            return null
          }
          return {
            zh: readString(ctx, sub, 'zh', `substitutions[${i}].zh`, { max: 200 }),
            en: readString(ctx, sub, 'en', `substitutions[${i}].en`, { max: 200 }),
          }
        })
        .filter((x): x is { zh: string; en: string } => x !== null)
    : []

  return {
    id,
    functionCategory: readString(ctx, raw, 'functionCategory', 'functionCategory', {
      max: 40,
    }),
    patternEn,
    patternZh: readString(ctx, raw, 'patternZh', 'patternZh', { max: 200 }),
    usageNote: readString(ctx, raw, 'usageNote', 'usageNote', { max: 400 }),
    examples,
    substitutions,
    level: readLevel(ctx, raw, 'level'),
    tags: Array.isArray(raw.tags)
      ? readStringArray(ctx, raw, 'tags', 'tags', 12)
      : [],
  }
}

/** 从 import.meta.glob 的模块对象里取出内容数组，同时兼容 { patterns: [...] } 包装 */
export function unwrapCollection(
  mod: unknown,
  expectedKey: 'patterns',
): unknown[] {
  if (Array.isArray(mod)) return mod
  if (isPlainObject(mod) && Array.isArray(mod[expectedKey])) {
    return mod[expectedKey] as unknown[]
  }
  return []
}
