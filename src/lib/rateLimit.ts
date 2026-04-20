/**
 * 월간 크레딧 시스템
 * - 매달 500 크레딧 지급 (월 초기화)
 * - 기능별 차등 소비: 상세 1, AI 이미지 5, 배경 제거 5
 * - Redis INCR 기반 atomic 소비 → 동시성 안전
 * - 배포: Upstash Redis (KV_REDIS_URL) / 로컬: 메모리 폴백
 */
import Redis from 'ioredis'

const MONTHLY_CREDITS = 500

export const CREDIT_COST = {
  generate: 1,     // 상세페이지 생성
  image: 5,        // AI 이미지 생성
  'bg-remove': 5,  // 배경 제거
} as const

export type CreditType = keyof typeof CREDIT_COST

// 전역 Redis 인스턴스 (서버리스 cold-start 재사용)
let redis: Redis | null = null
function getRedis(): Redis | null {
  if (redis) return redis
  const url = process.env.KV_REDIS_URL
  if (!url) return null
  try {
    redis = new Redis(url, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: false,
      lazyConnect: false,
    })
    redis.on('error', (err) => console.error('[redis] error:', err.message))
    return redis
  } catch (err) {
    console.error('[redis] init 실패:', err)
    return null
  }
}

const useRedis = !!process.env.KV_REDIS_URL
const TTL_SECONDS = 32 * 24 * 60 * 60 // 32일

// 관리자 이메일 — 크레딧 무제한
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)

// 메모리 폴백 (로컬 개발용)
const memoryMap = new Map<string, number>()

/** KST 기준 이번 달 키 (YYYY-MM) */
function getMonthKey(userId: string): string {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000)
  const ym = kst.toISOString().slice(0, 7)
  return `credits:${userId}:${ym}`
}

export function isAdmin(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email)
}

async function getUsed(key: string): Promise<number> {
  if (useRedis) {
    const r = getRedis()
    if (!r) return 0
    try {
      const val = await r.get(key)
      return val ? parseInt(val, 10) : 0
    } catch {
      return 0
    }
  }
  return memoryMap.get(key) || 0
}

/**
 * 현재 크레딧 상태만 조회 (기능 체크 없음, 소비 없음)
 */
export async function getCreditStatus(userId: string, email?: string | null): Promise<{
  used: number
  remaining: number
  limit: number
}> {
  if (isAdmin(email)) {
    return { used: 0, remaining: 99999, limit: 99999 }
  }
  const key = getMonthKey(userId)
  const used = await getUsed(key)
  return {
    used,
    remaining: Math.max(0, MONTHLY_CREDITS - used),
    limit: MONTHLY_CREDITS,
  }
}

/**
 * 원자적 크레딧 소비
 * - Redis INCR로 즉시 증가 → 초과 시 DECR로 롤백
 * - 동시 요청이 와도 Redis는 순차 실행 보장 → 정확한 제한 적용
 * - 성공 시 { allowed: true, remaining }
 * - 초과 시 { allowed: false, remaining } (롤백 완료된 상태)
 */
export async function consumeCreditsAtomic(
  userId: string,
  type: CreditType,
  email?: string | null,
): Promise<{
  allowed: boolean
  used: number
  remaining: number
  limit: number
  cost: number
}> {
  const cost = CREDIT_COST[type]

  // 관리자 무제한 — 실제 카운트 안 함
  if (isAdmin(email)) {
    return { allowed: true, used: 0, remaining: 99999, limit: 99999, cost }
  }

  const key = getMonthKey(userId)

  // ── Redis 경로 (atomic) ──
  if (useRedis) {
    const r = getRedis()
    if (!r) {
      // Redis 초기화 실패 — 데모 운영 연속성을 위해 허용 (fail-open)
      return { allowed: true, used: 0, remaining: MONTHLY_CREDITS, limit: MONTHLY_CREDITS, cost }
    }

    try {
      // 1. 원자적으로 cost만큼 증가 → 새로운 누적값 반환
      const newValue = await r.incrby(key, cost)

      // 2. 한도 초과면 롤백
      if (newValue > MONTHLY_CREDITS) {
        await r.decrby(key, cost)
        const actualUsed = newValue - cost
        return {
          allowed: false,
          used: actualUsed,
          remaining: Math.max(0, MONTHLY_CREDITS - actualUsed),
          limit: MONTHLY_CREDITS,
          cost,
        }
      }

      // 3. TTL 재설정 (신규 키면 TTL 없음 상태라 반드시 설정)
      await r.expire(key, TTL_SECONDS)

      return {
        allowed: true,
        used: newValue,
        remaining: MONTHLY_CREDITS - newValue,
        limit: MONTHLY_CREDITS,
        cost,
      }
    } catch (err) {
      console.error('[redis] atomic consume 실패:', err)
      // Redis 장애 — fail-open (데모 운영 우선)
      return { allowed: true, used: 0, remaining: MONTHLY_CREDITS, limit: MONTHLY_CREDITS, cost }
    }
  }

  // ── 메모리 폴백 (로컬 개발) ──
  const current = memoryMap.get(key) || 0
  if (current + cost > MONTHLY_CREDITS) {
    return {
      allowed: false,
      used: current,
      remaining: Math.max(0, MONTHLY_CREDITS - current),
      limit: MONTHLY_CREDITS,
      cost,
    }
  }
  memoryMap.set(key, current + cost)
  return {
    allowed: true,
    used: current + cost,
    remaining: MONTHLY_CREDITS - (current + cost),
    limit: MONTHLY_CREDITS,
    cost,
  }
}

/**
 * 크레딧 환불 (API 실패 시 사용한 크레딧 복원)
 */
export async function refundCredits(userId: string, type: CreditType, email?: string | null): Promise<void> {
  if (isAdmin(email)) return
  const cost = CREDIT_COST[type]
  const key = getMonthKey(userId)

  if (useRedis) {
    const r = getRedis()
    if (!r) return
    try {
      await r.decrby(key, cost)
    } catch (err) {
      console.error('[redis] refund 실패:', err)
    }
    return
  }

  const current = memoryMap.get(key) || 0
  memoryMap.set(key, Math.max(0, current - cost))
}
