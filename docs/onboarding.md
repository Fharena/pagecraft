# 온보딩 가이드

> 이 프로젝트를 처음 접하는 개발자를 위한 안내서.

## 프로젝트가 뭔가요?

쿠팡 셀러가 상품을 등록할 때 필요한 작업을 AI로 자동화하는 **Next.js 웹 도구**입니다.

**사용자 시나리오:**
1. 셀러가 상품 사진을 찍어 업로드
2. (선택) 사진 배경을 흰색으로 제거
3. (선택) AI 모델이 상품을 착용한 컷 생성
4. AI가 상세 콘텐츠 + SEO 상품명 5개 + 쿠팡 태그 20개를 한 번에 생성
5. 상세페이지 미리보기를 실시간으로 확인 + 텍스트 수정
6. PNG 파일로 다운로드 (본문 + 상하단 원본 이미지 합성)

---

## 로컬 세팅 (5분)

### 1. 레포 클론 & 설치

```bash
git clone <repo-url>
cd pagecraft
npm install
```

### 2. 환경 변수

```bash
cp .env.example .env.local
```

`.env.local`에 키 입력. 발급 방법은 [api-keys.md](api-keys.md) 참고.

**최소 실행**: `SKIP_AUTH=true` + `NEXT_PUBLIC_SKIP_AUTH=true` + `GEMINI_API_KEY`만 있으면 로컬에서 전체 기능 테스트 가능 (인증/크레딧 스킵됨).

### 3. 실행

```bash
npm run dev
# http://localhost:3000
```

---

## 코드 읽는 순서

### 1. 메인 플로우 페이지

```
src/app/product/new/page.tsx   ← 여기서 시작
```

상품 등록의 모든 단계가 이 페이지에서 진행됨. 좌/우 사이드 패널 + 가운데 실시간 미리보기 구조.

### 2. 컴포넌트

```
src/components/
├── editor/
│   ├── DetailPagePreview.tsx   ← 실시간 HTML 미리보기 (핵심)
│   ├── CopyPanel.tsx           ← 텍스트 수정 + 고시정보
│   ├── TitlePanel.tsx          ← 상품명 5개 표시/선택
│   ├── TagPanel.tsx            ← 태그 20개
│   ├── ExportPanel.tsx         ← 썸네일 크롭
│   └── ResultTabs.tsx
├── image/
│   ├── ImageUploader.tsx       ← 드래그 업로드 + IndexedDB 저장
│   ├── ImageGrid.tsx
│   ├── BgRemovalToggle.tsx     ← 서버 Gemini 배경제거
│   ├── AiModelToggle.tsx       ← AI 모델 이미지 생성
│   ├── CropEditor.tsx
│   └── SingleImageUpload.tsx
├── layout/
│   ├── Header.tsx              ← 크레딧 패널 + 로그아웃
│   ├── ProductForm.tsx         ← 상품 메타 입력
│   └── StatusBar.tsx
├── auth/AuthProvider.tsx
└── ui/ (Button, Input, Modal, Toast, Card)
```

### 3. API 라우트 (Next.js)

```
src/app/api/
├── ai/copy/route.ts            ← 통합 생성 (content + titles + tags)
├── image/
│   ├── generate/route.ts       ← AI 모델 이미지
│   └── bg-remove/route.ts      ← 배경 제거
├── render/route.ts             ← 본문 PNG 서버 렌더
├── usage/route.ts              ← 크레딧 조회
├── market/suggest/route.ts     ← 쿠팡 자동완성 프록시
└── auth/[...nextauth]/route.ts ← NextAuth 콜백
```

API 라우트는 요청/응답만 처리. 실제 로직은 `src/services/`에 분리.

### 4. 비즈니스 로직

```
src/services/
├── ai.service.ts           ← Gemini 호출, 프롬프트, safeParseJSON
├── render.service.ts       ← @napi-rs/canvas로 본문 PNG
└── market.service.ts       ← 쿠팡 자동완성 API
```

### 5. 유틸 라이브러리

```
src/lib/
├── api.ts                  ← 클라이언트 fetch 래퍼 (ApiError 포함)
├── apiAuth.ts              ← requireAuth + 크레딧 선차감
├── auth.ts                 ← NextAuth 설정 (Google Provider)
├── rateLimit.ts            ← Redis INCRBY, 크레딧 로직, 환불
├── errorMessage.ts         ← 사용자 친화 에러 변환
├── image.ts                ← 압축/리사이즈/whitenNearWhite
└── imageDB.ts              ← IndexedDB 래퍼 (idb)
```

### 6. 상태 관리 (Zustand)

```
src/stores/
├── productStore.ts         ← 상품명, 카테고리, 가격 등 메타
├── imageStore.ts           ← 이미지 목록 (IndexedDB 연동)
├── editorStore.ts          ← AI 생성 결과 (content, titles, tags)
└── usageStore.ts           ← 크레딧 UI 상태 (fetchUsage)
```

---

## 주요 개념

### 하이브리드 렌더링

같은 상세페이지를 **두 가지 방식**으로 렌더링:

| 용도 | 방식 | 이유 |
|------|------|------|
| 실시간 미리보기 | React HTML (`DetailPagePreview.tsx`) | 편집 즉시 반영 |
| PNG 다운로드 | `@napi-rs/canvas` 서버 렌더 | 한글 폰트 품질 보장 |

상하단 이미지(스토어 소개 / 약관)는 서버에 보내지 않고 **클라이언트에서 canvas로 본문 PNG와 합성**. Vercel 4.5MB body 제한 회피 + 원본 화질 유지.

### 크레딧 시스템 (원자 소비)

- 월 500 크레딧, KST 1일 초기화
- Redis `INCRBY` 선차감 → 실패 시 `DECRBY` 환불
- 동시 요청 race condition 없음
- 구현: `src/lib/rateLimit.ts`의 `consumeCreditsAtomic()`

### AI 통합 생성 (1회 호출)

과거엔 content / titles / tags 각각 3번 호출했지만, 현재는 **단일 프롬프트로 통합** (`generateAll`). Gemini 503 확률 1/3 + 레이턴시 단축.

### AI API 프록시 패턴

프론트에서 Gemini를 직접 호출하지 않음. API 키 노출 방지 + 크레딧 선차감 로직을 위해 **Next.js API Route를 프록시**로 사용.

```
프론트 → /api/ai/copy (Next.js) → Gemini API
          ↑ API 키 + 크레딧 체크는 여기서만
```

### 이미지 압축 전략

| 함수 | 해상도/품질 | 용도 |
|------|------------|------|
| `compressForAI()` | 400px / 0.5 | AI **텍스트 분석용** — Gemini는 내용만 파악 |
| `compressForImageGen()` | 1024px / 0.9 | AI **이미지 생성용** — Gemini 출력 품질 보존 |
| `compressForRender()` | 780px / 0.75 | 서버 렌더 전송용 — Vercel 4.5MB 대응 |

---

## 자주 하는 작업

### 새 컴포넌트 추가

```
src/components/{기능별폴더}/MyComponent.tsx
```

### 새 API 엔드포인트 추가

1. `src/services/`에 비즈니스 로직 작성
2. `src/app/api/{경로}/route.ts`에서 서비스 호출 + 인증/크레딧

```ts
// src/app/api/something/route.ts
import { NextResponse } from 'next/server'
import { requireAuth, refundOnFailure } from '@/lib/apiAuth'
import { friendlyErrorMessage } from '@/lib/errorMessage'

export async function POST(req: Request) {
  // 'generate' / 'image' / 'bg-remove' 중 하나 또는 undefined(인증만)
  const { session, error } = await requireAuth('generate')
  if (error) return error

  try {
    const body = await req.json()
    const result = await mySomething(body)
    return NextResponse.json(result)
  } catch (err) {
    if (session) await refundOnFailure(session.user.id, 'generate', session.user.email)
    return NextResponse.json({ error: friendlyErrorMessage(err) }, { status: 500 })
  }
}
```

### 새 Zustand 스토어 추가

```ts
// src/stores/myStore.ts
import { create } from 'zustand'

interface MyState {
  data: string
  setData: (data: string) => void
}

export const useMyStore = create<MyState>((set) => ({
  data: '',
  setData: (data) => set({ data }),
}))
```

영구 저장이 필요하면 `persist` 미들웨어 추가 (기존 스토어 참고). 이미지는 반드시 IndexedDB로.

---

## 개발 주의사항

### Git 규칙
- 브랜치: `feat/xxx`, `fix/xxx` 한글 커밋 메시지
- 수정 중간에 push 금지 → 작업 완료 후 한 번에
- PR 머지 여부 확인 후 새 브랜치 생성

### 패키지 매니저
- **npm** 사용 (pnpm 아님)

### 환경 변수 변경 시
- 로컬 `.env.local` + Vercel 대시보드 양쪽 업데이트
- Vercel Preview/Production 체크박스 구분해서 설정

---

## 다음으로 읽을 것

- [architecture.md](architecture.md) — 왜 이런 구조인지 의사결정 배경
- [api-spec.md](api-spec.md) — API 엔드포인트 상세 명세
- [known-issues.md](known-issues.md) — 남은 이슈와 기술 부채
- [issues.md](issues.md) — 해결된 이슈 이력
- [monetization-plan.md](monetization-plan.md) — 유료화 계획
