/**
 * 示范朗读：支持两种来源
 * 1. browser：浏览器 speechSynthesis（无需配置，但部分手机浏览器没有英文语音或无法播放）
 * 2. mimo：小米 MiMo 2.5 TTS（OpenAI 兼容的 chat/completions 接口）
 *
 * MiMo 请求：
 * POST {baseUrl}/chat/completions
 * header: api-key: <key>
 * body: { model: 'mimo-v2.5-tts', messages: [user 风格, assistant 正文],
 *         audio: { format: 'wav', voice }, stream: false }
 * 响应音频：choices[0].message.audio.data（Base64）
 *
 * 播放优先用 HTMLAudioElement + preservesPitch：变速不变调。
 * 如果媒体元素被浏览器自动播放策略拦截，再退回 Web Audio（可能变调，但至少有声音）。
 * 所有失败最终回退浏览器语音，不阻塞练习。
 */
import type { TtsProvider } from '@/types'

export const DEFAULT_MIMO_BASE_URL = 'https://api.xiaomimimo.com/v1'
export const MIMO_MODEL = 'mimo-v2.5-tts'
export const DEFAULT_MIMO_VOICE = 'Chloe'
/** MiMo 生成的人声略慢于 native，播放端统一补偿 0.1 倍速，使设置 1.0 ≈ 正常语速 */
export const MIMO_PLAYBACK_OFFSET = 0.1

export const MIMO_VOICES = [
  { id: 'Chloe', label: 'Chloe', hint: '英文女声' },
  { id: 'Mia', label: 'Mia', hint: '英文女声' },
  { id: 'Milo', label: 'Milo', hint: '英文男声' },
  { id: 'Dean', label: 'Dean', hint: '英文男声' },
  { id: 'mimo_default', label: '自动', hint: '默认音色' },
] as const

export const MIMO_VOICE_IDS: string[] = MIMO_VOICES.map((voice) => voice.id)

const MIMO_STYLE_INSTRUCTION =
  'Read this in clear, natural American English with a friendly, steady pace. Sound like a native speaker, not a robot.'

/** 用于在用户手势里解锁移动端 audio 元素；本身是静音 WAV，用户听不到 */
const SILENT_WAV =
  'data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YSADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=='

interface TtsConfig {
  provider: TtsProvider
  rate: number
  apiKey: string
  voice: string
  baseUrl: string
}

let config: TtsConfig = {
  provider: 'browser',
  rate: 1.0,
  apiKey: '',
  voice: DEFAULT_MIMO_VOICE,
  baseUrl: DEFAULT_MIMO_BASE_URL,
}

export function configureTts(patch: Partial<TtsConfig>): void {
  config = {
    ...config,
    ...patch,
    rate: clampRate(patch.rate ?? config.rate),
    baseUrl: normalizeMimoBaseUrl(patch.baseUrl ?? config.baseUrl),
    voice: patch.voice || config.voice,
  }
}

function clampRate(rate: number): number {
  if (!Number.isFinite(rate)) return 1.0
  return Math.min(2.2, Math.max(0.8, rate))
}

export function normalizeMimoBaseUrl(input: string): string {
  const trimmed = (input || '').trim().replace(/\/+$/, '')
  if (!/^https?:\/\//i.test(trimmed)) return DEFAULT_MIMO_BASE_URL
  return trimmed
}

/* ------------------------------------------------------------------ */
/* 通用状态                                                             */
/* ------------------------------------------------------------------ */

let playbackToken = 0
const bytesCache = new Map<string, ArrayBuffer>()
const MAX_CACHE = 30

function cacheBytes(key: string, bytes: ArrayBuffer) {
  if (bytesCache.size >= MAX_CACHE) {
    const oldest = bytesCache.keys().next().value
    if (oldest) bytesCache.delete(oldest)
  }
  bytesCache.set(key, bytes)
}

/* ------------------------------------------------------------------ */
/* 浏览器语音                                                           */
/* ------------------------------------------------------------------ */

let browserUtterance: SpeechSynthesisUtterance | null = null
let browserOnEnd: (() => void) | null = null

function browserSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

function pickBrowserVoice(): SpeechSynthesisVoice | null {
  if (!browserSpeechSupported()) return null
  const voices = window.speechSynthesis.getVoices()
  if (voices.length === 0) return null
  const english = voices.filter((voice) => /^en/i.test(voice.lang))
  return (
    english.find(
      (voice) =>
        /en[-_]US/i.test(voice.lang) &&
        /Samantha|Aria|Jenny|Google US|Microsoft/i.test(voice.name),
    ) ??
    english.find((voice) => /en[-_]US/i.test(voice.lang)) ??
    english.find((voice) => /en[-_]GB/i.test(voice.lang)) ??
    english[0] ??
    null
  )
}

function speakBrowser(text: string, onEnd?: () => void): boolean {
  if (!browserSpeechSupported() || !text.trim()) {
    onEnd?.()
    return false
  }
  try {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = config.rate
    utterance.pitch = 1
    const voice = pickBrowserVoice()
    if (voice) utterance.voice = voice
    browserUtterance = utterance
    browserOnEnd = onEnd ?? null
    utterance.onend = () => {
      if (browserUtterance !== utterance) return
      browserUtterance = null
      const callback = browserOnEnd
      browserOnEnd = null
      callback?.()
    }
    utterance.onerror = () => {
      if (browserUtterance !== utterance) return
      browserUtterance = null
      const callback = browserOnEnd
      browserOnEnd = null
      callback?.()
    }
    window.speechSynthesis.speak(utterance)
    return true
  } catch {
    browserUtterance = null
    browserOnEnd = null
    onEnd?.()
    return false
  }
}

/* ------------------------------------------------------------------ */
/* MiMo：HTMLAudioElement（保持音调）+ Web Audio 兜底                    */
/* ------------------------------------------------------------------ */

type PitchPreservingAudio = HTMLAudioElement & {
  preservesPitch?: boolean
  webkitPreservesPitch?: boolean
}

type AudioContextCtor = new () => AudioContext

function getAudioContextCtor(): AudioContextCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    AudioContext?: AudioContextCtor
    webkitAudioContext?: AudioContextCtor
  }
  return w.AudioContext ?? w.webkitAudioContext ?? null
}

function setPreservesPitch(audio: HTMLAudioElement) {
  const target = audio as PitchPreservingAudio
  target.preservesPitch = true
  target.webkitPreservesPitch = true
}

let audioElement: HTMLAudioElement | null = null
let audioElementUnlocked = false
let currentAudioUrl: string | null = null
let currentAudioOnEnd: (() => void) | null = null

function getAudioElement(): HTMLAudioElement | null {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return null
  if (audioElement) return audioElement
  const audio = new Audio()
  audio.preload = 'auto'
  audio.setAttribute('playsinline', '')
  setPreservesPitch(audio)
  audio.style.position = 'fixed'
  audio.style.left = '-10px'
  audio.style.bottom = '-10px'
  audio.style.width = '1px'
  audio.style.height = '1px'
  audio.style.opacity = '0'
  audio.style.pointerEvents = 'none'
  audio.setAttribute('aria-hidden', 'true')
  document.body.appendChild(audio)
  audioElement = audio
  return audio
}

/** 必须在用户点击的同步阶段调用，iOS 才允许后续异步播放 */
function unlockAudioElement(audio: HTMLAudioElement) {
  if (audioElementUnlocked) return
  try {
    audio.loop = true
    audio.src = SILENT_WAV
    audio.playbackRate = 1
    setPreservesPitch(audio)
    const promise = audio.play()
    if (promise) {
      promise
        .then(() => {
          audioElementUnlocked = true
        })
        .catch(() => {
          // 允许失败；真正播放时会再试一次，失败后走 Web Audio 兜底
        })
    }
  } catch {
    // ignore
  }
}

function stopAudioElement(notify: boolean) {
  const audio = audioElement
  if (audio) {
    try {
      audio.pause()
    } catch {
      // ignore
    }
    audio.loop = false
    audio.onended = null
    audio.onerror = null
    if (currentAudioUrl) {
      URL.revokeObjectURL(currentAudioUrl)
      currentAudioUrl = null
    }
    if (audio.getAttribute('src')) {
      audio.removeAttribute('src')
      try {
        audio.load()
      } catch {
        // ignore
      }
    }
  }
  const callback = currentAudioOnEnd
  currentAudioOnEnd = null
  if (notify) callback?.()
}

async function playWithAudioElement(
  bytes: ArrayBuffer,
  onEnd?: () => void,
): Promise<void> {
  const audio = getAudioElement()
  if (!audio) throw new Error('当前浏览器不支持音频播放')
  stopAudioElement(false)
  const blob = new Blob([bytes], { type: 'audio/wav' })
  const url = URL.createObjectURL(blob)
  currentAudioUrl = url
  currentAudioOnEnd = onEnd ?? null
  audio.loop = false
  audio.src = url
  audio.playbackRate = clampRate(config.rate + MIMO_PLAYBACK_OFFSET)
  setPreservesPitch(audio)
  audio.onended = () => {
    currentAudioOnEnd = null
    onEnd?.()
  }
  audio.onerror = () => {
    currentAudioOnEnd = null
    onEnd?.()
  }
  try {
    await audio.play()
    audioElementUnlocked = true
  } catch (error) {
    if (currentAudioUrl === url) {
      URL.revokeObjectURL(url)
      currentAudioUrl = null
    }
    audio.onended = null
    audio.onerror = null
    currentAudioOnEnd = null
    throw error
  }
}

let audioContext: AudioContext | null = null
let currentSource: AudioBufferSourceNode | null = null
let currentSourceOnEnd: (() => void) | null = null

function getAudioContext(): AudioContext | null {
  if (audioContext && audioContext.state !== 'closed') return audioContext
  const Ctor = getAudioContextCtor()
  if (!Ctor) return null
  try {
    audioContext = new Ctor()
  } catch {
    return null
  }
  return audioContext
}

function stopMimoSource(): void {
  if (!currentSource) return
  const source = currentSource
  currentSource = null
  source.onended = null
  try {
    source.stop()
  } catch {
    // ignore
  }
  const callback = currentSourceOnEnd
  currentSourceOnEnd = null
  callback?.()
}

function decodeAudioBytes(
  ctx: AudioContext,
  bytes: ArrayBuffer,
): Promise<AudioBuffer> {
  const copy = bytes.slice(0)
  return new Promise<AudioBuffer>((resolve, reject) => {
    try {
      ctx.decodeAudioData(copy, resolve, reject)
    } catch (error) {
      reject(error)
    }
  })
}

function playAudioBuffer(buffer: AudioBuffer, ctx: AudioContext, onEnd?: () => void) {
  stopMimoSource()
  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.playbackRate.value = clampRate(config.rate + MIMO_PLAYBACK_OFFSET)
  source.connect(ctx.destination)
  currentSource = source
  currentSourceOnEnd = onEnd ?? null
  source.onended = () => {
    if (currentSource !== source) return
    currentSource = null
    const callback = currentSourceOnEnd
    currentSourceOnEnd = null
    callback?.()
  }
  source.start()
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const clean = (
    base64.includes(',') ? base64.split(',').pop() ?? '' : base64
  ).replace(/\s+/g, '')
  const binary = atob(clean)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

async function fetchMimoAudio(
  text: string,
  apiKey: string,
  voice: string,
  baseUrl: string,
): Promise<ArrayBuffer> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 30_000)
  let response: Response
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        model: MIMO_MODEL,
        messages: [
          { role: 'user', content: MIMO_STYLE_INSTRUCTION },
          { role: 'assistant', content: text },
        ],
        audio: { format: 'wav', voice },
        stream: false,
      }),
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('MiMo 请求超时')
    }
    throw new Error('MiMo 网络请求失败，请检查网络或 API 地址')
  } finally {
    window.clearTimeout(timeout)
  }

  if (!response.ok) {
    let apiMessage = ''
    try {
      const payload = (await response.json()) as {
        error?: { message?: string; code?: string }
      }
      apiMessage = payload?.error?.message ?? ''
    } catch {
      // ignore
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error(
        apiMessage
          ? `MiMo API Key 无效（${apiMessage}）`
          : 'MiMo API Key 无效或没有权限',
      )
    }
    if (response.status === 429) {
      throw new Error('MiMo 请求太频繁或额度已用尽')
    }
    if (response.status >= 500) {
      throw new Error('MiMo 服务暂时不可用')
    }
    throw new Error(
      apiMessage
        ? `MiMo 请求失败：${apiMessage}`
        : `MiMo 请求失败（${response.status}）`,
    )
  }

  const payload = (await response.json()) as {
    choices?: { message?: { audio?: { data?: string } } }[]
  }
  const base64 = payload?.choices?.[0]?.message?.audio?.data
  if (!base64) {
    throw new Error('MiMo 没有返回音频数据')
  }
  return base64ToArrayBuffer(base64)
}

async function speakMimo(
  text: string,
  onEnd: (() => void) | undefined,
  apiKey: string,
  voice: string,
  baseUrl: string,
  token: number,
): Promise<boolean> {
  if (!text.trim()) {
    onEnd?.()
    return false
  }
  const key = apiKey.trim()
  if (!key) {
    throw new Error('还没有填写 MiMo API Key')
  }
  const audio = getAudioElement()
  if (!audio) {
    throw new Error('当前浏览器不支持 HTMLAudio 播放')
  }
  // 在用户手势的同步阶段解锁：静音循环 + 预恢复 AudioContext 兜底
  unlockAudioElement(audio)
  const ctx = getAudioContext()
  if (ctx && ctx.state !== 'running') {
    void ctx.resume().catch(() => {
      // ignore
    })
  }

  const url = normalizeMimoBaseUrl(baseUrl)
  const cacheKey = `${url}|${voice}|${text}`
  try {
    let bytes = bytesCache.get(cacheKey)
    if (!bytes) {
      bytes = await fetchMimoAudio(text, key, voice, url)
      cacheBytes(cacheKey, bytes)
    }
    if (token !== playbackToken) {
      stopAudioElement(false)
      return false
    }
    try {
      await playWithAudioElement(bytes, onEnd)
      return true
    } catch {
      // HTMLAudio 被拦截时退回 Web Audio；此时可能变调，但保证有声音
      if (token !== playbackToken) return false
      if (!ctx) throw new Error('当前浏览器不支持音频播放')
      const buffer = await decodeAudioBytes(ctx, bytes)
      if (token !== playbackToken) return false
      playAudioBuffer(buffer, ctx, onEnd)
      return true
    }
  } catch (error) {
    stopAudioElement(false)
    throw error
  }
}

/* ------------------------------------------------------------------ */
/* 对外 API                                                             */
/* ------------------------------------------------------------------ */

export function ttsSupported(): boolean {
  if (config.provider === 'mimo') {
    return typeof Audio !== 'undefined' || browserSpeechSupported()
  }
  return browserSpeechSupported()
}

export async function speak(
  text: string,
  onEnd?: () => void,
  onError?: (message: string) => void,
): Promise<boolean> {
  cancelSpeech()
  if (!text.trim()) {
    onEnd?.()
    return false
  }

  if (config.provider === 'mimo') {
    if (!config.apiKey.trim()) {
      onError?.('还没有填写 MiMo API Key，已回退到浏览器语音')
      return speakBrowser(text, onEnd)
    }
    const token = ++playbackToken
    try {
      return await speakMimo(
        text,
        onEnd,
        config.apiKey,
        config.voice,
        config.baseUrl,
        token,
      )
    } catch (error) {
      stopAudioElement(false)
      const message = error instanceof Error ? error.message : 'MiMo 播放失败'
      onError?.(`${message}，已回退到浏览器语音`)
      return speakBrowser(text, onEnd)
    }
  }

  return speakBrowser(text, onEnd)
}

export async function previewMimoTts(
  text: string,
  apiKey: string,
  voice: string,
  onEnd?: () => void,
  baseUrl = config.baseUrl,
): Promise<boolean> {
  cancelSpeech()
  const token = ++playbackToken
  return speakMimo(
    text,
    onEnd,
    apiKey,
    voice,
    normalizeMimoBaseUrl(baseUrl),
    token,
  )
}

export function cancelSpeech(): void {
  playbackToken += 1
  if (browserSpeechSupported()) {
    try {
      window.speechSynthesis.cancel()
    } catch {
      // ignore
    }
  }
  const browserCallback = browserOnEnd
  browserUtterance = null
  browserOnEnd = null
  browserCallback?.()
  stopAudioElement(true)
  stopMimoSource()
}
