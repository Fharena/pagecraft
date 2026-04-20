import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from './auth'
import { checkCredits, consumeCredits, type CreditType } from './rateLimit'

/**
 * API 라우트 인증 + 크레딧 체크
 * 사용법: const { session, error } = await requireAuth('generate')
 */
export async function requireAuth(
  type?: CreditType
): Promise<{
  session: { user: { id: string; email?: string | null; name?: string | null } } | null
  error: NextResponse | null
}> {
  // 개발 모드: SKIP_AUTH=true면 인증+크레딧 스킵
  if (process.env.SKIP_AUTH === 'true') {
    return {
      session: { user: { id: 'dev', email: 'dev@local', name: 'Developer' } },
      error: null,
    }
  }

  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return {
      session: null,
      error: NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      ),
    }
  }

  if (type) {
    const { allowed, remaining, limit, cost } = await checkCredits(
      session.user.id,
      type,
      session.user.email,
    )
    if (!allowed) {
      // 다음 달 1일 KST 자정까지 남은 시간 계산
      const kst = new Date(Date.now() + 9 * 60 * 60 * 1000)
      const nextMonth = new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth() + 1, 1))
      const resetDate = `${nextMonth.getUTCMonth() + 1}월 1일`

      return {
        session: null,
        error: NextResponse.json(
          {
            error: `크레딧이 부족합니다 (필요 ${cost}개 · 잔여 ${remaining}개). ${resetDate} 00:00에 자동으로 초기화됩니다.`,
            remaining,
            limit,
            cost,
          },
          { status: 429 }
        ),
      }
    }
  }

  return { session, error: null }
}

/**
 * 기능 실행 후 크레딧 차감
 */
export async function recordUsage(userId: string, type: CreditType) {
  await consumeCredits(userId, type)
}
