import { NextResponse } from 'next/server'
import { removeBackgroundGemini } from '@/services/ai.service'
import { requireAuth, recordUsage } from '@/lib/apiAuth'

export const maxDuration = 60

export async function POST(req: Request) {
  const { session, error } = await requireAuth('bg-remove')
  if (error) return error

  try {
    const body = (await req.json()) as { image: string }
    if (!body.image) {
      return NextResponse.json(
        { error: '이미지가 필요합니다.' },
        { status: 400 },
      )
    }

    const result = await removeBackgroundGemini(body.image)
    await recordUsage(session!.user.id, 'bg-remove')
    return NextResponse.json({ image: result })
  } catch (err) {
    console.error('배경 제거 오류:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '배경 제거 실패' },
      { status: 500 },
    )
  }
}
