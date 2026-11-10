import { useCallback, useEffect, useRef, useState } from 'react'

export type RecorderStatus =
  | 'idle'
  | 'requesting'
  | 'recording'
  | 'ready'
  | 'denied'
  | 'unsupported'

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ]
  return candidates.find((type) => {
    try {
      return MediaRecorder.isTypeSupported(type)
    } catch {
      return false
    }
  })
}

function messageForError(error: unknown): string {
  const name = error instanceof DOMException ? error.name : ''
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return '麦克风权限被拒绝。可以在浏览器设置里允许后重试，也可以直接跳过录音。'
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return '没有检测到麦克风。可以继续练习，只是没法录音。'
  }
  if (name === 'NotReadableError') {
    return '麦克风正被其他应用占用。关掉占用的应用再试，或跳过录音。'
  }
  return '录音暂时不可用。可以继续下一步，不影响练习。'
}

/**
 * 录音 Hook：MediaRecorder 封装。
 * 权限失败/浏览器不支持时只返回状态和提示，绝不抛错阻塞页面。
 * loadBlob 用于把 IndexedDB 里恢复出来的录音装回同一个播放器。
 */
export function useRecorder(
  onComplete?: (blob: Blob, durationMs: number) => void,
) {
  const [status, setStatus] = useState<RecorderStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [blob, setBlob] = useState<Blob | null>(null)
  const [seconds, setSeconds] = useState(0)
  const [durationMs, setDurationMs] = useState(0)

  const onCompleteRef = useRef(onComplete)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const startAtRef = useRef(0)
  const urlRef = useRef<string | null>(null)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  const supported =
    typeof window !== 'undefined' &&
    typeof window.MediaRecorder !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia)

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const revokeUrl = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current)
      urlRef.current = null
    }
  }, [])

  const reset = useCallback(() => {
    clearTimer()
    revokeUrl()
    setUrl(null)
    setBlob(null)
    setSeconds(0)
    setDurationMs(0)
    setError(null)
    setStatus('idle')
  }, [clearTimer, revokeUrl])

  /** 把已有录音（例如 IndexedDB 里恢复的）装进播放器 */
  const loadBlob = useCallback(
    (nextBlob: Blob, nextDurationMs: number) => {
      clearTimer()
      stopTracks()
      revokeUrl()
      const nextUrl = URL.createObjectURL(nextBlob)
      urlRef.current = nextUrl
      setBlob(nextBlob)
      setUrl(nextUrl)
      setSeconds(Math.max(0, Math.round(nextDurationMs / 1000)))
      setDurationMs(nextDurationMs)
      setError(null)
      setStatus('ready')
    },
    [clearTimer, revokeUrl, stopTracks],
  )

  const start = useCallback(async () => {
    if (!supported) {
      setStatus('unsupported')
      setError('当前浏览器不支持录音，可以直接跳过这一项。')
      return
    }
    setError(null)
    revokeUrl()
    setUrl(null)
    setBlob(null)
    setSeconds(0)
    setDurationMs(0)
    setStatus('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []
      const mimeType = pickMimeType()
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      )
      recorderRef.current = recorder
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        clearTimer()
        stopTracks()
        const nextBlob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        })
        chunksRef.current = []
        if (nextBlob.size === 0) {
          setError('这次没有录到声音，可以重试或跳过。')
          setStatus('idle')
          return
        }
        const nextUrl = URL.createObjectURL(nextBlob)
        urlRef.current = nextUrl
        setBlob(nextBlob)
        setUrl(nextUrl)
        const duration = Math.max(0, Date.now() - startAtRef.current)
        setDurationMs(duration)
        setStatus('ready')
        // 立刻触发持久化：即使下一步紧接着卸载组件，写入也会继续
        onCompleteRef.current?.(nextBlob, duration)
      }
      recorder.start()
      startAtRef.current = Date.now()
      setStatus('recording')
      clearTimer()
      timerRef.current = window.setInterval(() => {
        setSeconds(Math.floor((Date.now() - startAtRef.current) / 1000))
      }, 250)
    } catch (err) {
      stopTracks()
      setError(messageForError(err))
      setStatus('denied')
    }
  }, [clearTimer, revokeUrl, stopTracks, supported])

  const stop = useCallback(() => {
    const recorder = recorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop()
    } else {
      clearTimer()
      stopTracks()
    }
    recorderRef.current = null
  }, [clearTimer, stopTracks])

  useEffect(() => {
    return () => {
      clearTimer()
      const recorder = recorderRef.current
      if (recorder && recorder.state !== 'inactive') {
        recorder.onstop = null
        recorder.stop()
      }
      stopTracks()
      revokeUrl()
    }
  }, [clearTimer, revokeUrl, stopTracks])

  const formatSeconds = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(
    seconds % 60,
  ).padStart(2, '0')}`

  return {
    supported,
    status,
    error,
    url,
    blob,
    seconds,
    durationMs,
    formatted: formatSeconds,
    start,
    stop,
    reset,
    loadBlob,
    clearError: () => setError(null),
  }
}
