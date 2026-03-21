import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { timingSafeEqual } from 'crypto'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        password: { label: '비밀번호', type: 'password' },
      },
      authorize: async (credentials) => {
        const password = credentials?.password as string
        if (!password) return null

        const stored = process.env.AUTH_PASSWORD
        if (!stored) return null

        // timingSafeEqual로 타이밍 공격 방지
        const a = Buffer.from(password)
        const b = Buffer.from(stored)
        if (a.length !== b.length) return null
        const valid = timingSafeEqual(a, b)
        if (!valid) return null

        return { id: '1', name: 'owner' }
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
})
