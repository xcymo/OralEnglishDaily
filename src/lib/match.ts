const FILLERS = new Set([
  'um',
  'uh',
  'er',
  'ah',
  'like',
  'you',
  'know',
  'i',
  'mean',
])

function normalize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9'\s]/g, ' ')
    .split(/\s+/)
    .map((word) => word.replace(/^'+|'+$/g, ''))
    .filter((word) => word.length > 0)
}

/**
 * 粗略的口语识别匹配度，仅用于「可选增强」提示，绝不作为通过条件。
 * 返回 0-1；识别结果为空时返回 0。
 */
export function matchScore(target: string, transcript: string): number {
  const targetWords = normalize(target).filter((w) => !FILLERS.has(w))
  const spoken = new Set(normalize(transcript))
  if (targetWords.length === 0) return 0
  const matched = targetWords.filter((word) => spoken.has(word)).length
  return matched / targetWords.length
}

export function feedbackForScore(score: number): string {
  if (score >= 0.85) return '很接近了，语气再放松一点'
  if (score >= 0.6) return '关键词抓住了，再顺一遍'
  if (score > 0) return '听到了一部分，慢一点再来一次'
  return '这次没太识别到，可以再录一次，或者直接跳过'
}
