import { NextResponse } from 'next/server'
import { generateAll } from '@/services/ai.service'
import { requireAuth, recordUsage } from '@/lib/apiAuth'
import type { AIGenerateRequest } from '@/types/ai'

export async function POST(req: Request) {
  const { session, error } = await requireAuth('generate')
  if (error) return error

  try {
    const body = (await req.json()) as AIGenerateRequest & { coupangSuggestions?: string[] }

    if (!body.images || body.images.length === 0) {
      return NextResponse.json(
        { error: '상품 이미지가 필요합니다.' },
        { status: 400 },
      )
    }

    const result = await generateAll(body, body.coupangSuggestions || [])
    await recordUsage(session!.user.id, 'generate')
    return NextResponse.json(result)
  } catch (err) {
    console.error('AI 통합 생성 오류:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'AI 생성 실패' },
      { status: 500 },
    )
  }
}
