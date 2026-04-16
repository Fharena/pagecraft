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
# === Gemini (필수) ===
GEMINI_API_KEY=             # Google AI Studio에서 발급
GEMINI_TEXT_MODEL=          # 기본값: gemini-2.5-flash
GEMINI_IMAGE_MODEL=         # 기본값: gemini-2.5-flash-image

# === 인증 (배포 시 필수) ===
GOOGLE_CLIENT_ID=           # Google Cloud OAuth 클라이언트 ID
GOOGLE_CLIENT_SECRET=       # Google Cloud OAuth 시크릿
NEXTAUTH_SECRET=            # openssl rand -base64 32 로 생성
NEXTAUTH_URL=               # 배포 URL (예: https://pagecraft.vercel.app)

# === 개발용 ===
# SKIP_AUTH=true             # API 인증 + 사용량 제한 스킵
# NEXT_PUBLIC_SKIP_AUTH=true # 클라이언트 인증 체크 스킵
```

### 개발 모드 (인증 스킵)

로컬에서 인증 없이 개발하려면 `.env.local`에 추가:

```env
SKIP_AUTH=true
NEXT_PUBLIC_SKIP_AUTH=true
```

이러면 Google 로그인 없이 바로 서비스 사용 가능. API 사용량 제한도 스킵됨.

**배포 환경에서는 절대 설정하지 않을 것** — Vercel 환경변수에 넣지 않으면 자동으로 인증 활성화.

---

## 기술 스택

| 레이어 | 기술 | 비고 |
|--------|------|------|
| **프레임워크** | Next.js 16 (App Router) | 프론트 + API 라우트 통합 |
| **언어** | TypeScript | 전체 적용 |
| **UI** | Tailwind CSS v4 | @theme 디자인 토큰 |
| **상태 관리** | Zustand v5 | persist (IndexedDB + localStorage) |
| **AI 텍스트** | Gemini 2.5 Flash | 카피, 상품명, 태그 통합 생성 |
| **AI 이미지** | Gemini 2.5 Flash Image | 모델 이미지 생성 |
| **배경 제거** | @imgly/background-removal | 클라이언트 ONNX |
| **서버 렌더링** | @napi-rs/canvas | PNG 상세페이지 생성 |
| **인증** | NextAuth v4 + Google OAuth | 세션 기반 |
| **배포** | Vercel | 자동 배포 (main 브랜치) |

---

## 핵심 플로우

```
이미지 업로드 → AI 생성 (카피+상품명+태그) → 실시간 미리보기 → PNG 다운로드
```

| 단계 | 기능 | 처리 위치 |
|------|------|----------|
| 1 | 상품 사진 업로드 (원본 저장, IndexedDB) | 클라이언트 |
| 2 | 배경 제거 (선택) | 클라이언트 (ONNX) |
| 3 | AI 모델 이미지 생성 (선택) | 서버 (Gemini) |
| 4 | 상세페이지 콘텐츠 + 상품명 5개 + 태그 20개 통합 생성 | 서버 (Gemini 1회 호출) |
| 5 | 실시간 미리보기 (HTML React 컴포넌트) | 클라이언트 |
| 6 | PNG 다운로드 (하이브리드 렌더링) | 서버(본문) + 클라이언트(상하단 합성) |
| 7 | 썸네일 1000x1000 크롭 + 다운로드 | 클라이언트 |

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

## 인증 & 사용량 제한

### Google OAuth
- NextAuth v4 + Google Provider
- 로그인하지 않으면 서비스 이용 불가
- 헤더 프로필 사진 클릭 → 사용량 패널 + 로그아웃

### 일일 사용량 제한
| 기능 | 제한 |
|------|------|
| 상세페이지 생성 | 10회/일 |
| AI 이미지 생성 | 5회/일 |

- 유저별(Google 계정) 카운트
- 매일 한국 자정(KST) 초기화
- 헤더 프로필 패널에서 잔여 횟수 확인 가능

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
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
NEXTAUTH_SECRET=xxx
NEXTAUTH_URL=https://your-domain.vercel.app
```

### Google OAuth 리디렉션 URI

Google Cloud Console → OAuth 클라이언트 → 승인된 리디렉션 URI:

```
https://your-domain.vercel.app/api/auth/callback/google
```

로컬 개발도 하려면 추가:
```
http://localhost:3000/api/auth/callback/google
```

---

## 문서

| 문서 | 설명 |
|------|------|
| [docs/onboarding.md](docs/onboarding.md) | 신규 개발자 온보딩 가이드 |
| [docs/issues.md](docs/issues.md) | 해결된 이슈 + 아키텍처 변경 기록 |
