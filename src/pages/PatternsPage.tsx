import { useMemo, useState } from 'react'
import { MessageSquareText, Search, X } from 'lucide-react'
import { content, functionCategoryLabel } from '@/content'
import { FUNCTION_CATEGORIES } from '@/content/curriculum'
import { useProgress } from '@/store/progress'
import { isPatternMastered } from '@/lib/complete'
import { PageIntro } from '@/components/PageHeader'
import { Chip } from '@/components/Chip'
import { PatternCard } from '@/components/PatternCard'
import { EmptyState } from '@/components/Skeleton'
import { Button } from '@/components/Button'

export default function PatternsPage() {
  const { progress } = useProgress()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')

  const categories = useMemo(() => {
    const used = new Set(content.patterns.map((pattern) => pattern.functionCategory))
    return FUNCTION_CATEGORIES.filter((item) => used.has(item.key))
  }, [])

  const patterns = useMemo(() => {
    const q = query.trim().toLowerCase()
    return content.patterns.filter((pattern) => {
      if (category !== 'all' && pattern.functionCategory !== category) return false
      if (!q) return true
      return [
        pattern.patternEn,
        pattern.patternZh,
        pattern.usageNote,
        ...pattern.examples.map((example) => example.en),
        ...pattern.tags,
      ].some((value) => value.toLowerCase().includes(q))
    })
  }, [query, category])

  const masteredCount = content.patterns.filter((pattern) =>
    isPatternMastered(progress, pattern.id),
  ).length
  const hasFilter = Boolean(query.trim()) || category !== 'all'

  return (
    <div className="px-4 pb-8 pt-safe">
      <div className="pt-3">
        <PageIntro
          eyebrow="句式库"
          title="一个句式，到处能用"
          description={`${content.patterns.length} 个功能句式 · 已掌握 ${masteredCount} 个。按「你想做什么」来找。`}
        />
      </div>

      <div className="relative mt-4">
        <Search
          size={17}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索句式，比如「再说一遍」"
          aria-label="搜索句式"
          enterKeyHint="search"
          className="h-12 w-full rounded-xl border border-line bg-surface pl-10 pr-11 text-[16px] outline-none transition-colors placeholder:text-[13px] placeholder:text-muted/70 focus:border-brand/40"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="清空搜索"
            className="absolute right-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-surface-2"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 py-0.5 no-scrollbar">
        <Chip
          active={category === 'all'}
          onClick={() => setCategory('all')}
          className="shrink-0"
        >
          全部
        </Chip>
        {categories.map((item) => (
          <Chip
            key={item.key}
            active={category === item.key}
            onClick={() => setCategory(item.key)}
            className="shrink-0"
          >
            <span aria-hidden>{item.emoji}</span>
            {item.label}
          </Chip>
        ))}
      </div>

      <div className="mb-2.5 mt-4 flex items-center justify-between">
        <p className="text-[12.5px] text-muted">
          {category === 'all'
            ? `${patterns.length} 个句式`
            : `${functionCategoryLabel(category)} · ${patterns.length} 个`}
        </p>
        {hasFilter && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setCategory('all')
            }}
            className="min-h-[44px] text-2xs font-medium text-brand"
          >
            重置筛选
          </button>
        )}
      </div>

      {patterns.length === 0 ? (
        <EmptyState
          icon={<MessageSquareText size={20} />}
          title="没有匹配的句式"
          description="换个说法搜搜，或者直接看全部分类。"
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setQuery('')
                setCategory('all')
              }}
            >
              查看全部
            </Button>
          }
        />
      ) : (
        <div className="space-y-2.5">
          {patterns.map((pattern) => (
            <PatternCard
              key={pattern.id}
              pattern={pattern}
              learned={progress.learnedPatternIds.includes(pattern.id)}
              mastered={isPatternMastered(progress, pattern.id)}
            />
          ))}
        </div>
      )}

      <p className="mt-5 text-center text-2xs text-muted/70">
        新增句式：在 src/content/patterns 里加一个 JSON 数组
      </p>
    </div>
  )
}
