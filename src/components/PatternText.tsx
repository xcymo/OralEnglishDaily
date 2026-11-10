import { cn } from '@/lib/cn'

/** 把 patternEn 里的 [可替换部分] 高亮出来 */
export function PatternText({
  text,
  className,
  highlightClassName,
  showBrackets = false,
}: {
  text: string
  className?: string
  highlightClassName?: string
  /** true 时保留 [方括号]，用于「替换练习」里明确标出可替换位置 */
  showBrackets?: boolean
}) {
  const parts = text.split(/(\[[^\]]+\])/g).filter(Boolean)
  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.startsWith('[') && part.endsWith(']') ? (
          <span
            key={`${part}-${index}`}
            className={cn(
              'rounded-md bg-brand-soft px-0.5 text-brand [box-decoration-break:clone]',
              highlightClassName,
            )}
          >
            {showBrackets ? part : part.slice(1, -1)}
          </span>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </span>
  )
}
