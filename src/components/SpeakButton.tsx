import { useEffect, useState } from 'react'
import { Volume2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { speak, ttsSupported } from '@/lib/tts'

export function SpeakButton({
  text,
  label = '听示范',
  variant = 'icon',
  className,
  rateHint,
}: {
  text: string
  label?: string
  variant?: 'icon' | 'pill'
  className?: string
  rateHint?: number
}) {
  const supported = ttsSupported()
  const [playing, setPlaying] = useState(false)

  useEffect(() => () => setPlaying(false), [])

  const handleClick = () => {
    if (!supported) return
    setPlaying(true)
    const ok = speak(text, () => setPlaying(false))
    if (!ok) setPlaying(false)
  }

  if (!supported) {
    return (
      <span
        className={cn(
          'inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-3 text-[12px] text-muted',
          className,
        )}
        title="当前浏览器不支持语音播放，可用自己的方式读一遍"
      >
        <Volume2 size={16} className="opacity-40" />
        {variant === 'pill' && '无语音播放'}
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`${label}${rateHint ? `，语速 ${rateHint} 倍` : ''}`}
      className={cn(
        'press inline-flex items-center justify-center transition-colors',
        variant === 'icon' &&
          'h-11 w-11 shrink-0 rounded-full bg-brand-soft text-brand hover:bg-brand/15',
        variant === 'pill' &&
          'min-h-[44px] gap-1.5 rounded-pill border border-line bg-surface px-3.5 text-[13px] font-medium text-ink hover:bg-surface-2',
        playing && 'opacity-70',
        className,
      )}
    >
      <Volume2
        size={variant === 'icon' ? 19 : 16}
        className={cn(playing && 'animate-pulse')}
      />
      {variant === 'pill' && <span>{playing ? '播放中…' : label}</span>}
    </button>
  )
}
