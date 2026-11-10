import { createContext, useContext, type ReactNode } from 'react'
import type { RecordingSessionMeta } from '@/types'

/**
 * 练习页为当前步骤提供的录音上下文。
 * 有了它，RecordWidget 才能把录音按「任务 + 步骤」写进 IndexedDB。
 */
const RecordingSessionContext = createContext<RecordingSessionMeta | null>(null)

export function RecordingSessionProvider({
  value,
  children,
}: {
  value: RecordingSessionMeta
  children: ReactNode
}) {
  return (
    <RecordingSessionContext.Provider value={value}>
      {children}
    </RecordingSessionContext.Provider>
  )
}

export function useRecordingSession(): RecordingSessionMeta | null {
  return useContext(RecordingSessionContext)
}
