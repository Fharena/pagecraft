import { NextResponse } from 'next/server'
import { generateTags } from '@/services/ai.service'
import type { AITagRequest } from '@/types/ai'

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AITagRequest

    if (!body.productName) {
      return NextResponse.json(
        { error: '상품명이 필요합니다.' },
        { status: 400 },
      )
    }

    const result = await generateTags(body)
    return NextResponse.json(result)
  } catch (err) {
    console.error('태그 생성 오류:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '태그 생성 실패' },
      { status: 500 },
    )
  }
}
