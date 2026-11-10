import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react'
import { clearProgress } from '@/lib/storage'

interface State {
  error: Error | null
}

/** 错误边界：渲染异常时给用户一条可执行的出路，而不是白屏 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error('[页面错误]', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg px-6">
        <div className="w-full max-w-[420px] rounded-3xl border border-line bg-surface p-6 text-center shadow-card">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
            <AlertTriangle size={26} />
          </div>
          <h1 className="mt-4 text-[19px] font-bold tracking-tight">
            页面出了点问题
          </h1>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">
            你的学习进度保存在浏览器本地，重新加载通常就能恢复。
          </p>
          <div className="mt-5 space-y-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 text-[15px] font-semibold text-white"
            >
              <RefreshCw size={17} />
              重新加载
            </button>
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    '如果反复出错，可以清除本地数据后重试。学习进度会丢失，确定继续吗？',
                  )
                ) {
                  clearProgress()
                  window.location.reload()
                }
              }}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-line px-4 text-[14px] font-medium text-muted"
            >
              <Trash2 size={16} />
              清除本地数据并重载
            </button>
          </div>
          <p className="mt-4 break-words text-2xs text-muted/70">
            {this.state.error.message}
          </p>
        </div>
      </div>
    )
  }
}
