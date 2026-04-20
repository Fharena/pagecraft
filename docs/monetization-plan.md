# PageCraft 유료화 계획서

> 데모 기간(2개월) 이후 유료 전환을 위한 설계 문서
> 작성: 2026-04

---

## 1. 과금 모델: 크레딧제 (방식 A+C)

- **구독 크레딧**: 매달 초기화 (월 구독료로 지급)
- **충전 크레딧**: 영구 보유 (유저가 별도 결제로 구매)
- **사용 순서**: 구독 크레딧 먼저 소진 → 이후 충전 크레딧 차감

### 1.1 크레딧 단가

| 기능 | 원가 | 소모 크레딧 |
|------|------|-----------|
| 상세페이지 생성 | ~12원 | **1** |
| AI 이미지 생성 | ~55원 | **5** |
| 배경 제거 (Gemini) | ~55원 | **5** |
| 배경 제거 (Replicate BRIA) | ~25원 | **2** |

**1 크레딧 판매가 ≈ 30원** (원가의 ~2.5배, 업계 표준 마진)

---

## 2. 요금제

| 플랜 | 월 요금 | 지급 크레딧 | 크레딧 단가 | 타겟 |
|------|--------|-----------|-----------|------|
| **무료** | 0원 | 20 | — | 체험 |
| **베이직** | 9,900원 | 400 | 24.75원 | 부업 셀러 |
| **프로** | 29,900원 | 1,500 | 19.9원 | 전업 셀러 |
| **팀** | 79,900원 | 5,000 | 15.98원 | 대행사 |
| **연간 결제** | 각 플랜 × 12 × **0.8** | 동일 | — | 20% 할인 |

### 2.1 추가 충전

| 패키지 | 크레딧 | 가격 | 크레딧당 |
|--------|-------|------|---------|
| 스몰 | 100 | 3,000원 | 30원 |
| 미디엄 | 500 | 13,000원 | 26원 |
| 라지 | 1,500 | 35,000원 | 23.33원 |

**충전 크레딧 = 영구 보유**, 구독 해지해도 남음.

---

## 3. 기술 아키텍처

### 3.1 백엔드 전환

현재 서버리스(Vercel)에서 **Supabase + Next.js** 구조로:

```
[현재 데모]
  Client → Vercel Next.js API → Gemini
  (사용량 Vercel KV에 임시 저장)

[유료화 이후]
  Client → Vercel Next.js API → Gemini
                ↓
          Supabase (DB + Auth + Payment records)
```

### 3.2 DB 스키마 (Supabase PostgreSQL)

```sql
-- 유저 (Google OAuth → Supabase Auth)
users (
  id uuid PRIMARY KEY,
  email text UNIQUE,
  name text,
  created_at timestamp,
  plan text DEFAULT 'free',  -- 'free' | 'basic' | 'pro' | 'team'
  plan_expires_at timestamp
)

-- 크레딧 잔액
credit_balances (
  user_id uuid PRIMARY KEY REFERENCES users(id),
  subscription_credits int DEFAULT 0,  -- 매달 초기화
  topup_credits int DEFAULT 0,         -- 영구 보유
  reset_at timestamp                   -- 구독 크레딧 다음 초기화 시점
)

-- 크레딧 사용 내역
credit_transactions (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  type text,              -- 'generate' | 'image' | 'bg-remove' | 'charge' | 'subscription'
  amount int,             -- 음수: 사용, 양수: 지급/충전
  balance_after int,
  source text,            -- 'subscription' | 'topup'
  metadata jsonb,         -- 요청 ID, 생성물 정보
  created_at timestamp
)

-- 결제 내역
payments (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  amount int,             -- 원 단위
  currency text DEFAULT 'KRW',
  product_type text,      -- 'subscription_basic' | 'topup_small' 등
  toss_payment_key text,  -- 토스 결제 키
  status text,            -- 'pending' | 'paid' | 'failed' | 'refunded'
  paid_at timestamp,
  created_at timestamp
)

-- 구독 정보
subscriptions (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  plan text,              -- 'basic' | 'pro' | 'team'
  status text,            -- 'active' | 'canceled' | 'expired'
  billing_key text,       -- 토스 정기결제 키
  next_billing_at timestamp,
  canceled_at timestamp
)
```

### 3.3 크레딧 차감 로직 (트랜잭션)

```ts
// 의사 코드
async function consumeCredits(userId, amount) {
  return db.transaction(async (tx) => {
    const balance = await tx.select('credit_balances')
      .where({ user_id: userId }).forUpdate()  // Row lock

    const total = balance.subscription_credits + balance.topup_credits
    if (total < amount) throw new InsufficientCreditsError()

    // 구독 크레딧 먼저 차감
    const fromSub = Math.min(balance.subscription_credits, amount)
    const fromTopup = amount - fromSub

    await tx.update('credit_balances', {
      subscription_credits: balance.subscription_credits - fromSub,
      topup_credits: balance.topup_credits - fromTopup,
    })

    await tx.insert('credit_transactions', {
      user_id: userId,
      amount: -amount,
      balance_after: total - amount,
      // ...
    })
  })
}
```

**핵심**: `SELECT ... FOR UPDATE`로 동시성 제어. 동시에 여러 요청 와도 초과 사용 방지.

### 3.4 월간 초기화 (Cron)

```
매일 00:00 KST → Supabase Edge Function 실행
  WHERE reset_at <= NOW()
  → subscription_credits = plan_default_credits
  → reset_at = 다음달 동일시각
```

---

## 4. 결제 시스템 (토스페이먼츠)

### 4.1 왜 토스페이먼츠

- 한국 시장 1위, PG 인증 완료
- 정기결제(빌링키) 지원 → 구독에 필수
- 간편결제 (카드, 계좌이체, 페이, 카카오페이) 통합
- 테스트 환경 무료, 수수료 2.5~3.3%

### 4.2 결제 흐름

#### 일회성 결제 (크레딧 충전)
```
1. 유저 "충전" 클릭 → PaymentRequest 생성
2. 토스 결제창 → 카드 입력 → 승인
3. Webhook 수신 → 결제 검증 (서버에서 재확인)
4. DB 트랜잭션:
   - payments INSERT (status='paid')
   - credit_balances UPDATE (topup_credits += amount)
   - credit_transactions INSERT
5. 유저에게 완료 알림
```

#### 정기결제 (구독)
```
1. 유저 "구독" 클릭 → billingAuth로 빌링키 발급
2. 빌링키 저장 (암호화) → subscriptions INSERT
3. 즉시 첫 결제 + 크레딧 지급
4. 매달 cron → 토스 API로 자동 결제 → 크레딧 재지급
5. 결제 실패 3회 → 구독 자동 해지
```

### 4.3 보안 핵심

- **서버측 금액 검증 필수**
  - 클라이언트에서 온 `amount`를 절대 믿지 말 것
  - DB의 플랜 가격과 대조해서 확인
- **Webhook 서명 검증**
  - 토스에서 `X-Toss-Signature` 헤더로 검증
  - 가짜 Webhook으로 크레딧 지급 차단
- **빌링키 암호화**
  - Supabase Vault 또는 AES-256으로 DB에 저장
  - 코드에서 접근은 서버 전용 API만
- **Idempotency Key**
  - 중복 결제 방지 (네트워크 끊김 대응)
  - `orderId`를 UUID로 유니크하게

---

## 5. 보안 고려사항

### 5.1 인증/인가
- Google OAuth (현재 유지) + Supabase Auth 연동
- JWT → Supabase RLS (Row Level Security)로 유저별 데이터 격리
- 모든 API 라우트에 `requireAuth()` (현재 구조 유지)

### 5.2 Rate Limiting
- 크레딧제 자체가 Rate Limit (크레딧 소모)
- 추가: API당 분당 요청 제한 (Upstash Rate Limit)
- DDoS 방어: Vercel WAF 또는 Cloudflare

### 5.3 API 키 관리
- `GEMINI_API_KEY`, `REPLICATE_API_TOKEN`, `TOSS_SECRET_KEY`
- Vercel 환경변수 + Google Cloud Secret Manager (선택)
- 서버 전용, 클라이언트 노출 절대 금지
- 90일마다 로테이션

### 5.4 악용 방지
- **동일 이메일 다계정 차단**: Google OAuth로 1계정 제한
- **VPN 우회 감지**: IP 기반 이상 탐지 (선택)
- **비정상 사용량 알림**: 하루 100 크레딧 이상 사용 시 Sentry 알림
- **환불 정책**: 7일 이내 + 크레딧 미사용 시만

### 5.5 데이터 보호 (개인정보보호법)
- 유저 이미지는 **IndexedDB 로컬** 저장 (서버 저장 X)
- AI 요청 시 Gemini에 보낸 이미지는 **"데이터 학습 사용 안 함"** Paid tier
- 생성된 텍스트/이미지는 유저 소유 (이용약관 명시)
- 탈퇴 시 30일 내 모든 DB 데이터 삭제

### 5.6 결제 관련 법적 요건
- **전자상거래법**: 7일 청약철회권 (사용 안 한 크레딧만)
- **정기결제**: 결제 7일 전 알림 의무
- **이용약관/개인정보처리방침** 필수 게시
- **사업자 등록 + 통신판매업 신고** 필요

---

## 6. 구현 단계 (Phase별)

### Phase 1: DB + Auth 전환 (2주)
- [ ] Supabase 프로젝트 생성
- [ ] NextAuth → Supabase Auth 마이그레이션
- [ ] DB 스키마 생성 + RLS 정책
- [ ] 유저/크레딧 기본 CRUD

### Phase 2: 크레딧 시스템 (2주)
- [ ] `rateLimit.ts` → `creditManager.ts` 교체
- [ ] 크레딧 차감 트랜잭션 로직
- [ ] 월간 초기화 cron
- [ ] 프로필 UI → 크레딧 잔액 표시

### Phase 3: 결제 연동 (3주)
- [ ] 토스페이먼츠 계정 + 테스트 키
- [ ] 일회성 결제 (크레딧 충전)
- [ ] 정기결제 (구독 플랜)
- [ ] Webhook 처리 + 서명 검증
- [ ] 환불/해지 로직

### Phase 4: 운영 기능 (2주)
- [ ] 결제 내역 페이지
- [ ] 크레딧 사용 내역
- [ ] 관리자 대시보드 (수익/가입자 추적)
- [ ] 이메일 알림 (결제 완료, 실패)

### Phase 5: 런칭 준비 (1주)
- [ ] 이용약관/개인정보처리방침 작성
- [ ] 사업자 등록 + 통신판매업 신고
- [ ] PG사 심사 (토스페이먼츠)
- [ ] 실결제 테스트
- [ ] 런칭

**총 10주 (약 2.5개월)**

---

## 7. 예상 비용 / 수익 구조

### 원가 (유저 1명, 크레딧 100% 사용 기준)

| 플랜 | 크레딧 | 원가 (Gemini) | 원가 (Bria 섞기) |
|------|-------|-------------|---------------|
| 무료 | 20 | 300원 | 200원 |
| 베이직 | 400 | 4,800원 | 3,200원 |
| 프로 | 1,500 | 18,000원 | 12,000원 |
| 팀 | 5,000 | 60,000원 | 40,000원 |

### 수익 예상 (100명 유료 기준, 실 사용률 60%)

```
무료 60명  → 매출 0, 원가 ~10,000원
베이직 30명 × 9,900원 = 297,000원 / 원가 ~90,000원
프로 8명 × 29,900원 = 239,200원 / 원가 ~90,000원
팀 2명 × 79,900원 = 159,800원 / 원가 ~80,000원

매출: 696,000원
원가: 270,000원
결제 수수료(2.8%): 19,488원
서버 비용: ~30,000원
───────────────
순이익: ~376,000원/월 (마진 54%)
```

---

## 8. 우려사항 / 리스크

| 항목 | 위험도 | 대응 |
|------|-------|------|
| **Gemini 가격 인상** | 중 | Replicate/자체 모델 이전 대비 |
| **악용 (다계정)** | 중 | 결제 이력 기반 계정 검증 |
| **환불 요청 폭증** | 낮 | 크레딧 미사용분만 환불 정책 |
| **PG사 심사 지연** | 중 | 2~4주 예상, 사업자 등록 먼저 |
| **서비스 장애** | 낮 | Sentry + 상태 페이지 운영 |
| **경쟁 서비스 출현** | 중 | 빠른 기능 추가, 커뮤니티 구축 |

---

## 9. 결론

- **데모 완료 후 2.5개월** 개발 → 유료 런칭
- **초기 목표**: 100명 유료 유저, MRR 70만원
- **6개월 후 목표**: 500명, MRR 400만원 (손익분기점 여유)
- **핵심 성공 요인**: 쿠팡 셀러 커뮤니티 타겟 마케팅 + 환불 없는 유저 경험
