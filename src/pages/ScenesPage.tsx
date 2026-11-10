import { useMemo, useState } from 'react'
import { Compass, Search, SlidersHorizontal, X } from 'lucide-react'
import { content, sceneCategories } from '@/content'
import { LEVELS } from '@/content/curriculum'
import type { Level } from '@/types'
import { useProgress } from '@/store/progress'
import { PageIntro } from '@/components/PageHeader'
import { Chip } from '@/components/Chip'
import { SceneCard } from '@/components/SceneCard'
import { EmptyState } from '@/components/Skeleton'
import { Button } from '@/components/Button'

type LevelFilter = '全部' | Level

export default function ScenesPage() {
  const { progress } = useProgress()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('全部')
  const [level, setLevel] = useState<LevelFilter>('全部')

  const categories = useMemo(() => ['全部', ...sceneCategories()], [])
  const availableLevels = useMemo(
    () => LEVELS.filter((item) => content.scenes.some((scene) => scene.level === item)),
    [],
  )

  const scenes = useMemo(() => {
    const q = query.trim().toLowerCase()
    return content.scenes.filter((scene) => {
      if (category !== '全部' && scene.category !== category) return false
      if (level !== '全部' && scene.level !== level) return false
      if (!q) return true
      const haystack = [
        scene.titleZh,
        scene.titleEn,
        scene.description,
        scene.category,
        ...scene.tags,
        ...scene.targetChunks.flatMap((chunk) => [chunk.en, chunk.zh]),
      ]
      return haystack.some((value) => value.toLowerCase().includes(q))
    })
  }, [query, category, level])

  const hasFilter = Boolean(query.trim()) || category !== '全部' || level !== '全部'

  const reset = () => {
    setQuery('')
    setCategory('全部')
    setLevel('全部')
  }

  return (
    <div className="px-4 pb-8 pt-safe">
      <div className="pt-3">
        <PageIntro
          eyebrow="场景库"
          title="把生活场景练熟"
          description={`${content.scenes.length} 个主题 · 已学完 ${progress.learnedSceneIds.length} 个。挑一个现在用得上的。`}
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
          placeholder="搜索场景或语块，比如「少冰」"
          aria-label="搜索场景"
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
        {categories.map((item) => (
          <Chip
            key={item}
            active={category === item}
            onClick={() => setCategory(item)}
            className="shrink-0"
          >
            {item}
          </Chip>
        ))}
      </div>

      <div className="mt-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <SlidersHorizontal size={13} className="shrink-0 text-muted" />
        <div className="flex gap-1.5">
          <Chip
            onClick={() => setLevel('全部')}
            active={level === '全部'}
            className="shrink-0 px-3 text-2xs"
          >
            全部难度
          </Chip>
          {availableLevels.map((item) => (
            <Chip
              key={item}
              onClick={() => setLevel(item)}
              active={level === item}
              className="shrink-0 px-3 text-2xs"
            >
              {item}
            </Chip>
          ))}
        </div>
      </div>

      <div className="mb-2.5 mt-4 flex items-center justify-between">
        <p className="text-[12.5px] text-muted">
          共 {scenes.length} 个场景
          {hasFilter && '（筛选后）'}
        </p>
        {hasFilter && (
          <button
            type="button"
            onClick={reset}
            className="min-h-[44px] text-2xs font-medium text-brand"
          >
            重置筛选
          </button>
        )}
      </div>

      {scenes.length === 0 ? (
        <EmptyState
          icon={<Compass size={20} />}
          title="没有匹配的场景"
          description="换个关键词或分类试试。内容一直在扩充，也可以自己新增一个场景 JSON。"
          action={
            <Button variant="secondary" size="sm" onClick={reset}>
              清除筛选
            </Button>
          }
        />
      ) : (
        <div className="space-y-2.5">
          {scenes.map((scene) => {
            const learned = progress.learnedChunkIds[scene.id]?.length ?? 0
            return (
              <SceneCard
                key={scene.id}
                scene={scene}
                learnedChunks={learned}
                complete={progress.learnedSceneIds.includes(scene.id)}
              />
            )
          })}
        </div>
      )}

      <p className="mt-5 text-center text-2xs text-muted/70">
        新增场景只需在 src/content/scenes 下放一个 JSON 文件
      </p>
    </div>
  )
}
