import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/apiAuth'
import { getCreditStatus, CREDIT_COST } from '@/lib/rateLimit'

export async function GET() {
  // requireAuth로 통일 — SKIP_AUTH 환경변수 지원 (다른 라우트와 일관성)
  // type 미지정 → 크레딧 소비 없이 인증만 체크
  const { session, error } = await requireAuth()
  if (error) return error

  const status = await getCreditStatus(session!.user.id, session!.user.email)

  return NextResponse.json({
    credits: status,       // { used, remaining, limit }
    cost: CREDIT_COST,     // { generate, image, 'bg-remove' }
  })
}
