import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCreditStatus, CREDIT_COST } from '@/lib/rateLimit'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: '로그인 필요' }, { status: 401 })
  }

  const status = await getCreditStatus(session.user.id, session.user.email)

  return NextResponse.json({
    credits: status,       // { used, remaining, limit }
    cost: CREDIT_COST,     // { generate, image, 'bg-remove' }
  })
}
