# PageCraft

쿠팡 셀러를 위한 AI 상품 등록 자동화 도구.
이미지 업로드부터 상세페이지 생성, 상품명/태그까지 한 번에.

---

## 시작하기

### 요구사항

- Node.js 20+
- npm

### 설치 & 실행

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local 파일에 API 키 입력 (아래 환경 변수 섹션 참고)

# 개발 서버 실행
npm run dev

# http://localhost:3000 에서 확인
```

### 환경 변수

`.env.local` 파일에 아래 키를 설정:

```env
# === Gemini (필수) — 텍스트 + AI 모델 이미지 생성 ===
GEMINI_API_KEY=             # Google AI Studio에서 발급
GEMINI_TEXT_MODEL=          # 기본값: gemini-2.5-flash
GEMINI_IMAGE_MODEL=         # 기본값: gemini-2.5-flash-image

# === Replicate (필수) — 배경 제거 (Recraft) ===
REPLICATE_API_TOKEN=        # replicate.com/account/api-tokens ($0.01/건)

# === 인증 (배포 시 필수) ===
GOOGLE_CLIENT_ID=           # Google Cloud OAuth 클라이언트 ID
GOOGLE_CLIENT_SECRET=       # Google Cloud OAuth 시크릿
NEXTAUTH_SECRET=            # openssl rand -base64 32 로 생성
NEXTAUTH_URL=               # 배포 URL (예: https://pagecraft.vercel.app)

# === 크레딧 저장소 (프로덕션 필수) ===
KV_REDIS_URL=               # Vercel Marketplace Redis TCP URL
ADMIN_EMAILS=               # 쉼표 구분, 해당 계정은 크레딧 무제한

# === 에러 모니터링 (선택) ===
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_DSN=

# === 개발/Preview용 ===
# SKIP_AUTH=true             # API 인증 + 크레딧 체크 스킵
# NEXT_PUBLIC_SKIP_AUTH=true # 클라이언트 인증 체크 스킵
```

### 개발 모드 (인증 스킵)

로컬에서 인증 없이 개발하려면 `.env.local`에 추가:

```env
SKIP_AUTH=true
NEXT_PUBLIC_SKIP_AUTH=true
```

이러면 Google 로그인 없이 바로 서비스 사용 가능. API 크레딧 체크도 스킵됨.

**배포 환경에서는 절대 설정하지 않을 것** — Vercel 환경변수에 넣지 않으면 자동으로 인증 활성화.
(Vercel Preview에서만 임시로 사용하는 경우 Preview 체크박스로 환경 분리 필요)

---

## 기술 스택

| 레이어 | 기술 | 비고 |
|--------|------|------|
| **프레임워크** | Next.js 16 (App Router) | 프론트 + API 라우트 통합 |
| **언어** | TypeScript strict | 전체 적용 |
| **UI** | Tailwind CSS v4 | `@theme` 디자인 토큰 |
| **상태 관리** | Zustand v5 | persist (IndexedDB + localStorage + sessionStorage) |
| **AI 텍스트** | Gemini 2.5 Flash | 카피 + 상품명 + 태그 통합 1회 생성 |
| **AI 모델 이미지** | Gemini 2.5 Flash Image | 상품 착용 모델 이미지 생성 (생성형) |
| **배경 제거** | Replicate Recraft (`recraft-remove-background`) | 진짜 픽셀 마스크, 투명 PNG, $0.01/건 |
| **서버 렌더링** | @napi-rs/canvas | PNG 본문 렌더 (한글 폰트 보장) |
| **인증** | NextAuth v4 + Google OAuth | JWT 세션 쿠키 |
| **크레딧 저장** | Vercel Marketplace Redis (ioredis) | `KV_REDIS_URL` TCP 연결, 원자 INCRBY |
| **이미지 저장** | IndexedDB (idb 래퍼) | 용량 무제한, sessionStorage 5MB 제한 회피 |
| **에러 모니터링** | Sentry v10 | `instrumentation-client.ts` |
| **배포** | Vercel | main 브랜치 자동 배포 |

---

## 핵심 플로우

```
이미지 업로드 → (선택) 배경제거/AI모델 → AI 통합 생성 → 실시간 미리보기 → PNG 다운로드
```

| 단계 | 기능 | 처리 위치 |
|------|------|----------|
| 1 | 상품 사진 업로드 (원본 저장, IndexedDB) | 클라이언트 |
| 2 | 배경 제거 (선택) | 서버 Replicate Recraft → 투명 PNG |
| 3 | AI 모델 이미지 생성 (선택) | 서버 (Gemini) |
| 4 | 상세페이지 콘텐츠 + 상품명 5개 + 태그 20개 통합 생성 | 서버 (Gemini 1회 호출) |
| 5 | 실시간 미리보기 (HTML React 컴포넌트) | 클라이언트 |
| 6 | PNG 다운로드 (하이브리드 렌더링) | 서버(본문) + 클라이언트(상하단 합성) |
| 7 | 썸네일 1000×1000 크롭 + 다운로드 | 클라이언트 |

---

## 렌더링 전략 (하이브리드)

| 역할 | 처리 위치 | 이유 |
|------|----------|------|
| **미리보기** | 클라이언트 (React HTML) | 실시간 반영, 원본 이미지 |
| **본문 PNG** | 서버 (@napi-rs/canvas) | 한글 폰트 완벽 |
| **상하단 이미지 합성** | 클라이언트 (canvas) | 원본 화질, 서버 전송 불필요 |

```
다운로드 흐름:
  서버 → 본문만 PNG (한글 완벽)
  클라이언트 → 스토어소개(원본) + 본문PNG + 약관(원본) 세로 이어붙이기
```

---

## 인증 & 크레딧 시스템

### Google OAuth
- NextAuth v4 + Google Provider
- 로그인하지 않으면 서비스 이용 불가
- 헤더 프로필 사진 클릭 → 크레딧 패널 + 로그아웃

### 월 500 크레딧 시스템
| 기능 | 비용 |
|------|------|
| 상세페이지 생성 | 1 크레딧 |
| AI 이미지 생성 | 5 크레딧 |
| 배경 제거 | 5 크레딧 |

- 유저별(Google 계정) 월간 카운트
- **매월 1일 00:00 KST** 자동 초기화 (Redis TTL 32일)
- 원자 INCRBY + 실패 시 자동 환불 → 동시 요청 race condition 차단
- 관리자(`ADMIN_EMAILS`)는 무제한
- 헤더 프로필 패널에서 잔여 크레딧 확인 가능

---

## 스크립트

```bash
npm run dev          # 개발 서버 (http://localhost:3000)
npm run build        # 프로덕션 빌드
npm run start        # 프로덕션 서버
npm run lint         # ESLint
```

---

## 배포 (Vercel)

### 환경변수 설정

Vercel 대시보드 → Settings → Environment Variables:

```
GEMINI_API_KEY=xxx
REPLICATE_API_TOKEN=r8_xxx
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
NEXTAUTH_SECRET=xxx
NEXTAUTH_URL=https://your-domain.vercel.app
KV_REDIS_URL=rediss://default:xxxxx@host:6379
ADMIN_EMAILS=you@example.com
```

### Vercel Marketplace Redis 연결

1. Vercel 프로젝트 → Storage → Create → **Redis** (Redis Cloud) 선택
   - Upstash Redis 등 다른 Marketplace Redis 제공자도 가능 — 전부 TCP `KV_REDIS_URL` 주입 방식 동일
2. 자동으로 `KV_REDIS_URL` 환경변수 주입됨
3. `@vercel/kv`가 아닌 **`ioredis`** 로 TCP 직접 연결 (Marketplace Redis는 REST API 미제공)

### Google OAuth 리디렉션 URI

Google Cloud Console → OAuth 클라이언트 → 승인된 리디렉션 URI:

```
https://your-domain.vercel.app/api/auth/callback/google
http://localhost:3000/api/auth/callback/google    # 로컬 개발용
```

---

## 문서

| 문서 | 설명 |
|------|------|
| [docs/architecture.md](docs/architecture.md) | 시스템 아키텍처 + 의사결정 배경 |
| [docs/api-spec.md](docs/api-spec.md) | API 엔드포인트 명세 |
| [docs/api-keys.md](docs/api-keys.md) | 외부 API 키 발급 가이드 |
| [docs/onboarding.md](docs/onboarding.md) | 신규 개발자 온보딩 가이드 |
| [docs/issues.md](docs/issues.md) | 해결된 이슈 + 아키텍처 변경 기록 |
| [docs/known-issues.md](docs/known-issues.md) | 남은 이슈 + 기술 부채 |
| [docs/monetization-plan.md](docs/monetization-plan.md) | 유료화 계획 |
| [docs/remake.md](docs/remake.md) | pagecraft-pro → pagecraft 리메이크 기록 |
