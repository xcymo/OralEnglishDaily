import { useCallback, useEffect, useRef, useState } from 'react'

interface RecognitionAlternative {
  transcript: string
  confidence: number
}

interface RecognitionResult {
  readonly isFinal: boolean
  readonly length: number
  readonly [index: number]: RecognitionAlternative
}

interface RecognitionEvent {
  resultIndex: number
  results: {
    readonly length: number
    readonly [index: number]: RecognitionResult
  }
}

interface RecognitionErrorEvent {
  error: string
}

interface RecognitionLike {
  lang: string
  interimResults: boolean
  continuous: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: RecognitionEvent) => void) | null
  onerror: ((event: RecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}

type RecognitionCtor = new () => RecognitionLike

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor
    webkitSpeechRecognition?: RecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

/**
 * 语音识别（可选增强）。
 * 不支持的浏览器只是把 supported 设为 false，练习流程完全不受影响。
 */
export function useSpeechRecognition(lang = 'en-US') {
  const [supported] = useState(() => Boolean(getRecognitionCtor()))
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<RecognitionLike | null>(null)

  const stop = useCallback(() => {
    try {
      recognitionRef.current?.stop()
    } catch {
      // ignore
    }
  }, [])

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor()
    if (!Ctor) {
      setError('当前浏览器不支持语音识别，录完自己听一遍就好。')
      return
    }
    try {
      recognitionRef.current?.abort()
      const recognition = new Ctor()
      recognition.lang = lang
      recognition.interimResults = true
      recognition.continuous = false
      recognition.maxAlternatives = 1
      let finalText = ''
      recognition.onresult = (event) => {
        let text = ''
        for (let i = 0; i < event.results.length; i += 1) {
          text += event.results[i][0]?.transcript ?? ''
        }
        if (event.results[event.results.length - 1]?.isFinal) {
          finalText = text
        }
        setTranscript((finalText || text).trim())
      }
      recognition.onerror = (event) => {
        const map: Record<string, string> = {
          'not-allowed': '麦克风或识别权限被拒绝',
          'service-not-allowed': '浏览器暂时不允许语音识别',
          'no-speech': '没听到声音，再试一次',
          network: '识别服务连接失败',
          aborted: '',
        }
        const message = map[event.error] ?? '语音识别暂时不可用'
        if (message) setError(message)
        setListening(false)
      }
      recognition.onend = () => setListening(false)
      recognitionRef.current = recognition
      setTranscript('')
      setError(null)
      setListening(true)
      recognition.start()
    } catch {
      setError('语音识别启动失败，可以继续用录音功能。')
      setListening(false)
    }
  }, [lang])

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.abort()
      } catch {
        // ignore
      }
    }
  }, [])

  return {
    supported,
    listening,
    transcript,
    error,
    start,
    stop,
    reset: () => {
      setTranscript('')
      setError(null)
    },
  }
}
