import { NextResponse } from 'next/server'
import { removeBackgroundGemini } from '@/services/ai.service'
import { requireAuth, refundOnFailure } from '@/lib/apiAuth'
import { friendlyErrorMessage } from '@/lib/errorMessage'

export const maxDuration = 60

export async function POST(req: Request) {
  const { session, error } = await requireAuth('bg-remove')
  if (error) return error

  try {
    const body = (await req.json()) as { image: string }
    if (!body.image) {
      await refundOnFailure(session!.user.id, 'bg-remove', session!.user.email)
      return NextResponse.json(
        { error: '이미지가 필요합니다.' },
        { status: 400 },
      )
    }

    const result = await removeBackgroundGemini(body.image)
    return NextResponse.json({ image: result })
  } catch (err) {
    console.error('배경 제거 오류:', err)
    if (session) {
      await refundOnFailure(session.user.id, 'bg-remove', session.user.email)
    }
    return NextResponse.json(
      { error: friendlyErrorMessage(err) },
      { status: 500 },
    )
  }
}
