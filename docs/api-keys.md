# 외부 API 키 발급 가이드

이 프로젝트는 외부 서비스를 **최소화**한 구조입니다. 필수 4개만 있으면 동작합니다.

---

## 필수

### 1. Google AI Studio (Gemini API)

**용도**: AI 텍스트 생성 + AI 모델 이미지 생성 (배경 제거는 Replicate Recraft 사용)

1. [aistudio.google.com](https://aistudio.google.com) 접속
2. "Get API key" → "Create API key"
3. **중요**: 사용량이 많으면 **유료 plan**(Pay-as-you-go) 필수 — 무료 tier는 분당 요청 제한 있음
4. `.env.local`에 설정:
   ```env
   GEMINI_API_KEY=AIza...
   GEMINI_TEXT_MODEL=gemini-2.5-flash          # 기본값
   GEMINI_IMAGE_MODEL=gemini-2.5-flash-image   # 기본값
   ```

**과금 참고** (2025년 4월 기준)
- 텍스트 입력/출력: $0.30 / $2.50 per 1M tokens
- 이미지 출력: **$0.039 per image** (≈ $30/1M tokens)
- Google Cloud Console에서 **월 예산 알림** 반드시 설정 (예: $50/월)

---

### 2. Google Cloud OAuth (NextAuth 로그인)

**용도**: 사용자 인증. 없으면 `SKIP_AUTH=true`로만 로컬 개발 가능.

1. [console.cloud.google.com](https://console.cloud.google.com) 프로젝트 생성
2. "APIs & Services" → "OAuth consent screen" 설정 (External / 앱 정보 입력)
3. "Credentials" → "Create Credentials" → "OAuth client ID" → Web application
4. **승인된 JavaScript 원본**:
   ```
   http://localhost:3000
   https://your-domain.vercel.app
   ```
5. **승인된 리디렉션 URI**:
   ```
   http://localhost:3000/api/auth/callback/google
   https://your-domain.vercel.app/api/auth/callback/google
   ```
6. 발급된 클라이언트 ID/시크릿을 `.env.local`에 설정:
   ```env
   GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
   NEXTAUTH_SECRET=                # openssl rand -base64 32 로 생성
   NEXTAUTH_URL=http://localhost:3000   # 배포 시 실제 URL
   ```

---

### 3. Vercel Marketplace Redis (크레딧 저장소)

**용도**: 월간 크레딧 원자 INCRBY 저장. 없으면 메모리 폴백(서버 재시작 시 초기화).

**권장 — Vercel Marketplace (원클릭)**:
1. Vercel 프로젝트 → Storage → Create → **Redis** 선택 (Redis Cloud by Redis Inc.)
   - 다른 제공자(Upstash Redis 등)도 사용 가능 — 모두 TCP `KV_REDIS_URL` 주입 방식이라 코드 변경 없음
2. 자동으로 `KV_REDIS_URL` 환경변수 주입됨
3. 로컬 개발에는 Vercel 대시보드에서 값 복사해서 `.env.local`에 붙여넣기

**직접 가입 (선택)**:
- Redis Cloud: [redis.com/cloud](https://redis.com/cloud) 가입 → Database 생성 → Connection string 복사
- Upstash Redis: [upstash.com](https://upstash.com) 가입 → Redis Database 생성 (Region: Asia Pacific)
- 어느 쪽이든 `rediss://...` TCP URL을 `KV_REDIS_URL`에 넣으면 동작

```env
KV_REDIS_URL=rediss://default:xxxxx@host:6379
```

> **주의**: `@vercel/kv` 패키지는 **사용 안 함**. Vercel Marketplace Redis 제공자들이 대체로 REST API를 기본 제공하지 않으므로 `ioredis`로 TCP 직접 연결함.

---

### 4. Replicate (배경 제거 — Recraft)

**용도**: 상품 사진 배경 제거. `recraft-ai/recraft-remove-background` 모델 사용.

1. [replicate.com](https://replicate.com) 가입 (GitHub 연동 로그인 가능)
2. [Account → API tokens](https://replicate.com/account/api-tokens) 에서 토큰 발급
3. **중요**: Billing 설정 필수
   - [Account → Billing](https://replicate.com/account/billing) 에서 카드 등록
   - **Auto-reload** 권장: Threshold $5, Reload $15 정도면 데모 수준 안전
4. `.env.local`에 설정:
   ```env
   REPLICATE_API_TOKEN=r8_xxxxx
   ```

**과금 참고**
- Recraft Remove Background: **$0.01 / 호출** (고정 단가)
- 입력 제한: 256~4096px, max 5MB (PNG/JPG/WEBP)
- 출력: 완전 투명 PNG (alpha channel 보존)

**왜 Gemini가 아니라 Recraft인가?**
- Gemini는 "생성형" 모델이라 상품의 pose/개수가 변형되는 경우 발생
- 비용: Gemini $0.04 → Recraft $0.01 (75% 절감)
- 출력: Gemini는 흰색 근사 → 후처리 필요 / Recraft는 진짜 픽셀 마스크 기반 투명 PNG

---

## 선택

### 5. Sentry (에러 모니터링)

```env
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

- [sentry.io](https://sentry.io) 프로젝트 생성 (Platform: Next.js)
- Sentry v10부터는 `instrumentation-client.ts`에서 초기화 (이미 설정됨)

### 6. 관리자 계정 (크레딧 무제한)

```env
ADMIN_EMAILS=admin@example.com,other@example.com
```

- 쉼표 구분
- 해당 Google 계정은 크레딧 체크 우회 (테스트/운영용)

---

## .env.local 전체 예시

```env
# === 필수 ===
GEMINI_API_KEY=AIza...
GEMINI_TEXT_MODEL=gemini-2.5-flash
GEMINI_IMAGE_MODEL=gemini-2.5-flash-image

REPLICATE_API_TOKEN=r8_xxxxx

GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
NEXTAUTH_SECRET=openssl_rand_base64_32_결과
NEXTAUTH_URL=http://localhost:3000

KV_REDIS_URL=rediss://default:xxxxx@host:6379
ADMIN_EMAILS=you@example.com

# === 선택 ===
NEXT_PUBLIC_SENTRY_DSN=https://...
SENTRY_DSN=https://...

# === 개발/Preview 전용 ===
# SKIP_AUTH=true
# NEXT_PUBLIC_SKIP_AUTH=true
```

---

## 주의사항

- `NEXT_PUBLIC_` 접두사가 붙은 변수만 브라우저에 노출됨
- `GEMINI_API_KEY`, `REPLICATE_API_TOKEN`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`, `KV_REDIS_URL`은 **서버 전용** — 절대 `NEXT_PUBLIC_` 붙이지 말 것
- `.env.local`은 `.gitignore`에 포함되어 있어 git에 올라가지 않음
- Vercel 배포 시 Settings → Environment Variables에 동일하게 설정
- `SKIP_AUTH=true`는 **로컬/Preview 전용** — Production에서는 절대 설정 금지

---

## 과거 사용했던 서비스 (현재 미사용)

다음 서비스는 프로젝트 초기 계획에 있었으나 최종적으로 **제거됨**:

| 서비스 | 제거 사유 |
|--------|-----------|
| Anthropic (Claude) | Gemini 통합으로 일원화 |
| OpenAI (GPT Image) | Gemini 이미지 모델로 대체 |
| Replicate (Stability AI) | 초기 Stability AI 배경제거는 제거했으나, 이후 **Recraft 전환으로 Replicate 재도입** (필수 #4 참조) |
| Supabase | 유저 DB/Storage 사용 안 함, IndexedDB + NextAuth로 대체 |
| @vercel/kv | Vercel Marketplace Redis가 REST API 미제공 → ioredis로 전환 |
| Gemini 배경제거 (`gemini-2.5-flash-image`) | 품질/비용 이슈로 Recraft 전환. 코드는 `ai.service.ts` 에 블록 주석으로 보존 (복귀 가능) |
