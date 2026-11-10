let currentRate = 0.9

export function setSpeechRate(rate: number) {
  currentRate = Math.min(1.4, Math.max(0.5, rate))
}

export function ttsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

function pickVoice(): SpeechSynthesisVoice | null {
  if (!ttsSupported()) return null
  const voices = window.speechSynthesis.getVoices()
  if (voices.length === 0) return null
  const english = voices.filter((v) => /^en/i.test(v.lang))
  return (
    english.find((v) => /en[-_]US/i.test(v.lang) && /Samantha|Aria|Jenny|Google US|Microsoft/i.test(v.name)) ??
    english.find((v) => /en[-_]US/i.test(v.lang)) ??
    english.find((v) => /en[-_]GB/i.test(v.lang)) ??
    english[0] ??
    null
  )
}

/** 播放英文示范。任何异常都静默降级，不影响练习流程。 */
export function speak(text: string, onEnd?: () => void): boolean {
  if (!ttsSupported() || !text.trim()) return false
  try {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = currentRate
    utterance.pitch = 1
    const voice = pickVoice()
    if (voice) utterance.voice = voice
    if (onEnd) {
      utterance.onend = () => onEnd()
      utterance.onerror = () => onEnd()
    }
    window.speechSynthesis.speak(utterance)
    return true
  } catch {
    onEnd?.()
    return false
  }
}

export function cancelSpeech(): void {
  if (!ttsSupported()) return
  try {
    window.speechSynthesis.cancel()
  } catch {
    // ignore
  }
}
