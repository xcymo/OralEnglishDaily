import { lazy, Suspense } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { PageSkeleton } from '@/components/Skeleton'
import { ProgressProvider } from '@/store/progress'
import { ToastProvider } from '@/store/toast'
import NotFoundPage from '@/pages/NotFoundPage'

const TodayPage = lazy(() => import('@/pages/TodayPage'))
const ScenesPage = lazy(() => import('@/pages/ScenesPage'))
const SceneDetailPage = lazy(() => import('@/pages/SceneDetailPage'))
const PatternsPage = lazy(() => import('@/pages/PatternsPage'))
const PatternDetailPage = lazy(() => import('@/pages/PatternDetailPage'))
const PracticePage = lazy(() => import('@/pages/PracticePage'))
const ProgressPage = lazy(() => import('@/pages/ProgressPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <ProgressProvider>
          <HashRouter>
            <AppShell>
              <Suspense fallback={<PageSkeleton />}>
                <Routes>
                  <Route index element={<TodayPage />} />
                  <Route path="scenes" element={<ScenesPage />} />
                  <Route path="scenes/:sceneId" element={<SceneDetailPage />} />
                  <Route path="patterns" element={<PatternsPage />} />
                  <Route path="patterns/:patternId" element={<PatternDetailPage />} />
                  <Route path="practice/task/:taskId" element={<PracticePage />} />
                  <Route path="practice/scene/:sceneId" element={<PracticePage />} />
                  <Route path="practice/pattern/:patternId" element={<PracticePage />} />
                  <Route path="progress" element={<ProgressPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </AppShell>
          </HashRouter>
        </ProgressProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}
