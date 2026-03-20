import { prisma } from '@/lib/prisma'
import TagSearchPage from './TagSearchPage'

export const metadata = { title: '태그' }

export default async function TagsPage() {
  const tags = await prisma.tag.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { schedules: true } },
    },
  })

  return <TagSearchPage tags={tags} />
}
