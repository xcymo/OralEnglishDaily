import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '@/lib/cn'

type ToastTone = 'default' | 'success' | 'error'

interface ToastItem {
  id: number
  message: string
  tone: ToastTone
}

interface ToastContextValue {
  show: (message: string, tone?: ToastTone) => void
  success: (message: string) => void
  error: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let toastSeq = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef<number[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const show = useCallback(
    (message: string, tone: ToastTone = 'default') => {
      const id = toastSeq++
      setToasts((prev) => [...prev.slice(-2), { id, message, tone }])
      const timer = window.setTimeout(() => dismiss(id), 2800)
      timers.current.push(timer)
    },
    [dismiss],
  )

  useEffect(() => {
    return () => {
      timers.current.forEach((timer) => window.clearTimeout(timer))
    }
  }, [])

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (message) => show(message, 'success'),
      error: (message) => show(message, 'error'),
    }),
    [show],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex justify-center px-4 pb-[calc(96px+env(safe-area-inset-bottom,0px))]"
      >
        <div className="flex w-full max-w-[480px] flex-col items-center gap-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={cn(
                'pointer-events-auto flex w-full items-start gap-2.5 rounded-2xl px-3.5 py-3 text-[13.5px] font-medium shadow-lift animate-fade-up',
                toast.tone === 'default' && 'bg-ink text-bg',
                toast.tone === 'success' && 'bg-success text-on-brand',
                toast.tone === 'error' && 'bg-danger text-on-brand',
              )}
              role="status"
            >
              <span className="mt-0.5 shrink-0">
                {toast.tone === 'success' ? (
                  <CheckCircle2 size={17} />
                ) : toast.tone === 'error' ? (
                  <AlertCircle size={17} />
                ) : (
                  <Info size={17} />
                )}
              </span>
              <span className="min-w-0 flex-1 leading-snug">{toast.message}</span>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="关闭提示"
                className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full opacity-70 transition-opacity hover:opacity-100"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast 必须在 ToastProvider 内使用')
  }
  return ctx
}
