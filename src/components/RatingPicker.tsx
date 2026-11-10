import { cn } from '@/lib/cn'

export function RatingPicker({
  value,
  onChange,
  lowLabel,
  highLabel,
  ariaLabel,
  emojis,
}: {
  value: number
  onChange: (value: number) => void
  lowLabel: string
  highLabel: string
  ariaLabel: string
  emojis?: string[]
}) {
  return (
    <div>
      <div
        role="radiogroup"
        aria-label={ariaLabel}
        className="grid grid-cols-5 gap-2"
      >
        {[1, 2, 3, 4, 5].map((score) => {
          const active = value === score
          return (
            <button
              key={score}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={`${ariaLabel} ${score} 分`}
              onClick={() => onChange(score)}
              className={cn(
                'flex min-h-[52px] flex-col items-center justify-center rounded-xl border text-[15px] font-semibold transition-all duration-200 press',
                active
                  ? 'border-brand bg-brand text-on-brand shadow-[0_8px_20px_-12px_rgb(var(--brand)/0.9)]'
                  : 'border-line bg-surface text-muted hover:border-brand/30 hover:text-ink',
              )}
            >
              {emojis ? (
                <span className="text-xl leading-none">{emojis[score - 1]}</span>
              ) : (
                <span>{score}</span>
              )}
              {emojis && (
                <span
                  className={cn(
                    'mt-0.5 text-2xs',
                    active ? 'text-on-brand/70' : 'text-muted',
                  )}
                >
                  {score}
                </span>
              )}
            </button>
          )
        })}
      </div>
      <div className="mt-1.5 flex justify-between text-2xs text-muted">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  )
}

export function YesNoPicker({
  value,
  onChange,
  yesLabel,
  noLabel,
}: {
  value: boolean | null
  onChange: (value: boolean) => void
  yesLabel: string
  noLabel: string
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {[
        { v: false, label: noLabel, emoji: '😌' },
        { v: true, label: yesLabel, emoji: '😵' },
      ].map((option) => {
        const active = value === option.v
        return (
          <button
            key={String(option.v)}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.v)}
            className={cn(
              'flex min-h-[52px] items-center justify-center gap-2 rounded-xl border text-[13.5px] font-semibold transition-all duration-200 press',
              active
                ? 'border-brand bg-brand-soft text-brand'
                : 'border-line bg-surface text-muted hover:text-ink',
            )}
          >
            <span className="text-lg leading-none">{option.emoji}</span>
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
