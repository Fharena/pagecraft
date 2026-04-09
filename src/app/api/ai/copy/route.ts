import { NextResponse } from 'next/server'
import { generateContent } from '@/services/ai.service'
import type { AIGenerateRequest } from '@/types/ai'

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AIGenerateRequest

    if (!body.images || body.images.length === 0) {
      return NextResponse.json(
        { error: '상품 이미지가 필요합니다.' },
        { status: 400 },
      )
    }

    const result = await generateContent(body)
    return NextResponse.json(result)
  } catch (err) {
    console.error('AI 카피 생성 오류:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'AI 생성 실패' },
      { status: 500 },
    )
  }
}
