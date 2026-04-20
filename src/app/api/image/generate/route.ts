import { NextResponse } from 'next/server'
import { generateModelImage } from '@/services/ai.service'
import { requireAuth, recordUsage } from '@/lib/apiAuth'
import { friendlyErrorMessage } from '@/lib/errorMessage'
import type { AIModelImageRequest } from '@/types/ai'

export async function POST(req: Request) {
  const { session, error } = await requireAuth('image')
  if (error) return error

  try {
    const body = (await req.json()) as AIModelImageRequest

    if (!body.productName && !body.category) {
      return NextResponse.json(
        { error: '상품명 또는 카테고리가 필요합니다.' },
        { status: 400 },
      )
    }

    const image = await generateModelImage(body)
    await recordUsage(session!.user.id, 'image')
    return NextResponse.json({ image })
  } catch (err) {
    console.error('AI 모델 이미지 생성 오류:', err)
    return NextResponse.json(
      { error: friendlyErrorMessage(err) },
      { status: 500 },
    )
  }
}
