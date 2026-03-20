import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: '파일이 없습니다' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // 원본 파일명 안전하게 처리
  const ext = file.name.split('.').pop() ?? 'bin'
  const safeName = `${randomUUID()}.${ext}`
  const filePath = join(process.cwd(), 'public', 'uploads', safeName)

  await writeFile(filePath, buffer)

  return NextResponse.json({
    name: file.name,
    path: `/uploads/${safeName}`,
  })
}
