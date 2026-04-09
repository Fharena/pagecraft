import { NextResponse } from 'next/server'
import { getCoupangSuggestions } from '@/services/market.service'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const keyword = searchParams.get('keyword')

    if (!keyword) {
      return NextResponse.json(
        { error: 'keyword 파라미터가 필요합니다.' },
        { status: 400 },
      )
    }

    const result = await getCoupangSuggestions(keyword)
    return NextResponse.json(result)
  } catch (err) {
    console.error('쿠팡 키워드 조회 오류:', err)
    return NextResponse.json(
      { seeds: [], bySeed: [], suggestions: [] },
      { status: 200 },
    )
  }
}
