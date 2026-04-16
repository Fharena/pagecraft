/**
 * 메모리 기반 일일 사용량 제한
 * 서버리스 환경에서는 인스턴스 간 공유 안 되지만,
 * 150명 데모 수준에서는 충분한 방어선
 */

const DAILY_LIMIT = 10 // 1인 1일 상세페이지 생성 10회
const AI_IMAGE_LIMIT = 5 // 1인 1일 AI 이미지 생성 5회

interface UsageEntry {
  count: number
  date: string // YYYY-MM-DD
}

const usageMap = new Map<string, UsageEntry>()

function getToday(): string {
  // 한국 시간(KST, UTC+9) 기준 날짜
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[0]
}

function getUsage(userId: string, prefix: string): UsageEntry {
  const key = `${prefix}:${userId}`
  const entry = usageMap.get(key)
  const today = getToday()
  if (!entry || entry.date !== today) {
    // 날짜 바뀌면 리셋
    const fresh = { count: 0, date: today }
    usageMap.set(key, fresh)
    return fresh
  }
  return entry
}

export function checkRateLimit(userId: string, type: 'generate' | 'image'): {
  allowed: boolean
  remaining: number
  limit: number
} {
  const limit = type === 'generate' ? DAILY_LIMIT : AI_IMAGE_LIMIT
  const prefix = type === 'generate' ? 'gen' : 'img'
  const usage = getUsage(userId, prefix)

  return {
    allowed: usage.count < limit,
    remaining: Math.max(0, limit - usage.count),
    limit,
  }
}

export function incrementUsage(userId: string, type: 'generate' | 'image'): void {
  const prefix = type === 'generate' ? 'gen' : 'img'
  const usage = getUsage(userId, prefix)
  usage.count++
}

// 오래된 엔트리 정리 (메모리 누수 방지)
setInterval(() => {
  const today = getToday()
  for (const [key, entry] of usageMap) {
    if (entry.date !== today) usageMap.delete(key)
  }
}, 60 * 60 * 1000) // 1시간마다
