# 외부 API 키 발급 가이드

이 프로젝트는 외부 서비스를 **최소화**한 구조입니다. 필수 3개만 있으면 동작합니다.

---

## 필수

### 1. Google AI Studio (Gemini API)

**용도**: AI 텍스트 생성 + 이미지 생성 + 배경 제거 (전체 AI 기능)

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

### 3. Upstash Redis (크레딧 저장소)

**용도**: 월간 크레딧 원자 INCRBY 저장. 없으면 메모리 폴백(서버 재시작 시 초기화).

**옵션 A — Vercel Marketplace (권장, 원클릭)**:
1. Vercel 프로젝트 → Storage → Create → **Upstash** Redis 선택
2. 자동으로 `KV_REDIS_URL` 환경변수 주입됨
3. 로컬 개발에는 Vercel 대시보드에서 값 복사해서 `.env.local`에 붙여넣기

**옵션 B — Upstash 직접 가입**:
1. [upstash.com](https://upstash.com) 가입
2. Redis Database 생성 (Region: Asia Pacific)
3. Connection string 복사:
   ```env
   KV_REDIS_URL=rediss://default:xxxxx@apn1-xxx.upstash.io:6379
   ```

> **주의**: `@vercel/kv` 패키지는 **사용 안 함**. Vercel Marketplace Redis는 TCP만 제공하고 REST API가 없으므로 `ioredis`로 직접 연결함.

---

## 선택

### 4. Sentry (에러 모니터링)

```env
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

- [sentry.io](https://sentry.io) 프로젝트 생성 (Platform: Next.js)
- Sentry v10부터는 `instrumentation-client.ts`에서 초기화 (이미 설정됨)

### 5. 관리자 계정 (크레딧 무제한)

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

GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
NEXTAUTH_SECRET=openssl_rand_base64_32_결과
NEXTAUTH_URL=http://localhost:3000

KV_REDIS_URL=rediss://default:xxxxx@xxx.upstash.io:6379
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
- `GEMINI_API_KEY`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`, `KV_REDIS_URL`은 **서버 전용** — 절대 `NEXT_PUBLIC_` 붙이지 말 것
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
| Replicate (Stability AI) | Gemini 배경제거로 대체 (품질 이슈 있으나 비용/구조 단순화) |
| Supabase | 유저 DB/Storage 사용 안 함, IndexedDB + NextAuth로 대체 |
| @vercel/kv | Vercel Marketplace Redis가 REST API 미제공 → ioredis로 전환 |

향후 BRIA RMBG 2.0 (Replicate) 또는 Recraft 배경제거 전환을 고려 중.
