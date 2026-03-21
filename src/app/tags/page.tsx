import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import TagSearchPage from './TagSearchPage'

export const dynamic = 'force-dynamic'
export const metadata = { title: '태그' }

export default async function TagsPage() {
  const session = await auth()
  const userId = parseInt(session?.user?.id ?? '0')
  const tags = await prisma.tag.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { schedules: true } },
    },
  })

  return <TagSearchPage tags={tags} />
}
