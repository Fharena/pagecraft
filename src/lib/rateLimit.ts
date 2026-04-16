/**
 * 일일 사용량 제한
 * - 배포: Vercel KV (Redis) — 인스턴스 간 공유, 정확한 카운트
 * - 로컬: 메모리 폴백 — KV 환경변수 없으면 자동 전환
 */
import { kv } from '@vercel/kv'

const DAILY_LIMIT = 10 // 1인 1일 상세페이지 생성 10회
const AI_IMAGE_LIMIT = 5 // 1인 1일 AI 이미지 생성 5회

const useKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)

// ── 메모리 폴백 (로컬 개발용) ──
const memoryMap = new Map<string, number>()

function getToday(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[0]
}

function makeKey(userId: string, type: string): string {
  return `usage:${type}:${userId}:${getToday()}`
}

// ── KV 기반 ──
async function getCountKV(key: string): Promise<number> {
  try {
    const val = await kv.get<number>(key)
    return val || 0
  } catch {
    return 0
  }
}

async function incrementKV(key: string): Promise<void> {
  try {
    await kv.incr(key)
    // 자정 지나면 자동 삭제 (TTL 25시간)
    await kv.expire(key, 25 * 60 * 60)
  } catch { /* ignore */ }
}

// ── 메모리 기반 ──
function getCountMemory(key: string): number {
  return memoryMap.get(key) || 0
}

function incrementMemory(key: string): void {
  memoryMap.set(key, (memoryMap.get(key) || 0) + 1)
}

// ── 공통 API ──
export async function checkRateLimit(userId: string, type: 'generate' | 'image'): Promise<{
  allowed: boolean
  remaining: number
  limit: number
}> {
  const limit = type === 'generate' ? DAILY_LIMIT : AI_IMAGE_LIMIT
  const key = makeKey(userId, type)
  const count = useKV ? await getCountKV(key) : getCountMemory(key)

  return {
    allowed: count < limit,
    remaining: Math.max(0, limit - count),
    limit,
  }
}

export async function incrementUsage(userId: string, type: 'generate' | 'image'): Promise<void> {
  const key = makeKey(userId, type)
  if (useKV) {
    await incrementKV(key)
  } else {
    incrementMemory(key)
  }
}
