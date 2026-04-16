import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from './auth'
import { checkRateLimit, incrementUsage } from './rateLimit'

/**
 * API 라우트 인증 + 사용량 체크
 * 사용법: const { session, error } = await requireAuth(req, 'generate')
 */
export async function requireAuth(
  type?: 'generate' | 'image'
): Promise<{
  session: { user: { id: string; email?: string | null; name?: string | null } } | null
  error: NextResponse | null
}> {
  // 개발 모드: SKIP_AUTH=true면 인증+제한 스킵
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

  // 사용량 체크 (type이 있을 때만)
  if (type) {
    const { allowed, remaining, limit } = checkRateLimit(session.user.id, type)
    if (!allowed) {
      return {
        session: null,
        error: NextResponse.json(
          {
            error: `일일 사용 한도(${limit}회)에 도달했습니다. 내일 다시 이용해주세요.`,
            remaining: 0,
            limit,
          },
          { status: 429 }
        ),
      }
    }
  }

  return { session, error: null }
}

/**
 * 사용 후 카운트 증가
 */
export function recordUsage(userId: string, type: 'generate' | 'image') {
  incrementUsage(userId, type)
}
