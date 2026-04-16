import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rateLimit'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: '로그인 필요' }, { status: 401 })
  }

  const generate = await checkRateLimit(session.user.id, 'generate')
  const image = await checkRateLimit(session.user.id, 'image')

  return NextResponse.json({
    generate: { used: generate.limit - generate.remaining, limit: generate.limit, remaining: generate.remaining },
    image: { used: image.limit - image.remaining, limit: image.limit, remaining: image.remaining },
  })
}
