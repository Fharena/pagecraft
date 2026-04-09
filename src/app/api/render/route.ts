import { NextResponse } from 'next/server'
import { renderDetailPage } from '@/services/render.service'
import type { RenderRequest } from '@/types/ai'

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RenderRequest

    if (!body.data) {
      return NextResponse.json(
        { error: '렌더링 데이터가 필요합니다.' },
        { status: 400 },
      )
    }

    const pngBuffer = await renderDetailPage(body)

    return new Response(new Uint8Array(pngBuffer), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': String(pngBuffer.length),
      },
    })
  } catch (err) {
    console.error('렌더링 오류:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '렌더링 실패' },
      { status: 500 },
    )
  }
}
