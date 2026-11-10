import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: SheetProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label="关闭"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-[rgb(8_10_16/0.45)] backdrop-blur-[2px]"
      />
      <div
        className={cn(
          'relative w-full max-w-[520px] animate-fade-up rounded-t-3xl border border-line bg-surface px-5 pb-safe-bottom-fixed pt-3 shadow-lift sm:mx-4 sm:rounded-3xl sm:pb-5',
          className,
        )}
      >
        <div className="mx-auto mb-3 h-1 w-9 rounded-pill bg-line sm:hidden" />
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {title && (
              <h2 className="text-[17px] font-bold tracking-tight">{title}</h2>
            )}
            {description && (
              <p className="mt-1 text-[13px] leading-relaxed text-muted">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="-mr-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-2"
          >
            <X size={19} />
          </button>
        </div>
        <div className="mt-4 max-h-[70dvh] overflow-y-auto">{children}</div>
        {footer && <div className="mt-5 flex gap-2.5">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
