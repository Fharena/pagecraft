/**
 * 월간 크레딧 시스템
 * - 매달 500 크레딧 지급 (월 초기화)
 * - 기능별 차등 소비: 상세 1, AI 이미지 5, 배경 제거 5
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

// 관리자 이메일 — 크레딧 무제한
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)

// 메모리 폴백
const memoryMap = new Map<string, number>()

/** KST 기준 이번 달 키 (YYYY-MM) */
function getMonthKey(userId: string): string {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000)
  const ym = kst.toISOString().slice(0, 7)
  return `credits:${userId}:${ym}`
}

async function getUsedRedis(key: string): Promise<number> {
  const r = getRedis()
  if (!r) return 0
  try {
    const val = await r.get(key)
    return val ? parseInt(val, 10) : 0
  } catch {
    return 0
  }
}

async function addUsedRedis(key: string, cost: number): Promise<void> {
  const r = getRedis()
  if (!r) return
  try {
    await r.incrby(key, cost)
    // 32일 TTL — 다음 달 초 지나면 자동 삭제
    await r.expire(key, 32 * 24 * 60 * 60)
  } catch (err) {
    console.error('[redis] addUsed 실패:', err)
  }
}

function getUsedMemory(key: string): number {
  return memoryMap.get(key) || 0
}

function addUsedMemory(key: string, cost: number): void {
  memoryMap.set(key, (memoryMap.get(key) || 0) + cost)
}

export function isAdmin(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email)
}

/**
 * 크레딧 잔액 + 요청한 기능 실행 가능 여부
 */
export async function checkCredits(
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

  if (isAdmin(email)) {
    return { allowed: true, used: 0, remaining: 99999, limit: 99999, cost }
  }

  const key = getMonthKey(userId)
  const used = useRedis ? await getUsedRedis(key) : getUsedMemory(key)
  const remaining = Math.max(0, MONTHLY_CREDITS - used)

  return {
    allowed: remaining >= cost,
    used,
    remaining,
    limit: MONTHLY_CREDITS,
    cost,
  }
}

/**
 * 현재 크레딧 상태만 조회 (기능 체크 없음)
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
  const used = useRedis ? await getUsedRedis(key) : getUsedMemory(key)
  return {
    used,
    remaining: Math.max(0, MONTHLY_CREDITS - used),
    limit: MONTHLY_CREDITS,
  }
}

/**
 * 크레딧 소비 (기능 실행 후)
 */
export async function consumeCredits(userId: string, type: CreditType): Promise<void> {
  const cost = CREDIT_COST[type]
  const key = getMonthKey(userId)
  if (useRedis) {
    await addUsedRedis(key, cost)
  } else {
    addUsedMemory(key, cost)
  }
}
