import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  const { username, password } = await request.json()

  if (!username || !password) {
    return NextResponse.json({ error: '아이디와 비밀번호를 입력해주세요' }, { status: 400 })
  }
  if (username.length < 2 || username.length > 20) {
    return NextResponse.json({ error: '아이디는 2~20자여야 합니다' }, { status: 400 })
  }
  if (password.length < 4) {
    return NextResponse.json({ error: '비밀번호는 4자 이상이어야 합니다' }, { status: 400 })
  }

  const exists = await prisma.user.findUnique({ where: { username } })
  if (exists) {
    return NextResponse.json({ error: '이미 사용 중인 아이디입니다' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  await prisma.user.create({ data: { username, passwordHash } })

  return NextResponse.json({ ok: true }, { status: 201 })
}
