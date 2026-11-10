import { useNavigate } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { EmptyState } from '@/components/Skeleton'
import { Button } from '@/components/Button'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-dvh flex-col justify-center px-4">
      <EmptyState
        icon={<Compass size={22} />}
        title="这个页面不存在"
        description="可能链接过期了。回到今天，继续练你的口语。"
        action={<Button onClick={() => navigate('/')}>回到今天</Button>}
      />
    </div>
  )
}
