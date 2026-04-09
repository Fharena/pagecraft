# 온보딩 가이드

> 이 프로젝트를 처음 접하는 개발자를 위한 가이드입니다.

## 프로젝트가 뭔가요?

쿠팡 셀러가 상품을 등록할 때 필요한 작업을 AI로 자동화하는 웹 도구입니다.

**사용자 시나리오:**
1. 셀러가 매장에서 상품 사진을 찍음
2. 앱에 업로드하면 가격 스티커를 AI가 자동 제거
3. 쿠팡에서 같은 상품의 시장 가격/경쟁 현황 조회
4. AI가 상품 이미지 7장을 자동 생성 (흰배경, 라이프스타일 등)
5. AI가 상품 카피, 상품명, 태그 20개 생성
6. 상세페이지 PNG/PDF 다운로드

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

`.env.local`에 API 키 입력. 키 발급 방법은 [api-keys.md](api-keys.md) 참고.

> 최소한 `ANTHROPIC_API_KEY`만 있어도 카피/태그 생성은 테스트 가능합니다.

### 3. 실행

```bash
npm run dev
# http://localhost:3000
```

## 코드를 어디서부터 읽을까?

### 프론트엔드

**메인 플로우 페이지:**
```
src/app/product/new/page.tsx   ← 여기서 시작
```
상품 등록의 6단계 플로우가 이 페이지에서 진행됩니다.

**컴포넌트 구조:**
```
src/components/
├── image/     → 이미지 업로드/크롭/인페인팅 관련
├── editor/    → 상세페이지 에디터, 카피, 태그
├── market/    → 시장 분석 카드, 마진 계산
└── ui/        → 공통 버튼, 인풋, 모달 등
```

### 백엔드 (API Routes)

```
src/app/api/
├── ai/        → AI 텍스트 생성 (Claude)
├── image/     → AI 이미지 생성/인페인팅
├── render/    → 상세페이지 PNG 렌더링
└── market/    → 쿠팡 시장 데이터
```

> API 라우트는 요청/응답만 처리합니다.
> 실제 로직은 `src/services/`에 분리되어 있습니다.

### 비즈니스 로직

```
src/services/
├── ai.service.ts       → Claude API 호출, 프롬프트 빌딩
├── image.service.ts    → GPT Image, Stability AI 호출
├── render.service.ts   → Canvas로 상세페이지 PNG 생성
├── market.service.ts   → 쿠팡 API/크롤링
└── product.service.ts  → 상품 CRUD (Supabase)
```

## 주요 개념

### 렌더링 이중 전략

상세페이지 렌더링이 두 곳에서 일어납니다:

- **클라이언트 Canvas** (`src/hooks/useCanvas.ts`): 브라우저에서 실시간 미리보기. 수정하면 바로 반영.
- **서버 Canvas** (`src/services/render.service.ts`): 최종 PNG 다운로드 시 서버에서 렌더링. 한글 폰트 보장.

### 상태 관리 (Zustand)

전역 상태는 3개 스토어로 분리:

```
stores/productStore.ts   → 상품명, 카테고리, 가격 등 메타 정보
stores/imageStore.ts     → 업로드된 이미지 목록, 처리 상태
stores/editorStore.ts    → 생성된 카피, 태그, 상품명 후보
```

### AI API 프록시 패턴

프론트에서 AI API를 직접 호출하지 않습니다.
API 키가 노출되므로, Next.js API Route를 프록시로 사용:

```
프론트 → /api/ai/copy (Next.js) → Claude API
          ↑ API 키는 여기서만 사용
```

## 자주 하는 작업

### 새 컴포넌트 추가

```
src/components/{기능별폴더}/MyComponent.tsx
```

### 새 API 엔드포인트 추가

1. `src/services/`에 비즈니스 로직 작성
2. `src/app/api/{경로}/route.ts`에서 서비스 호출

```ts
// src/app/api/something/route.ts
import { myService } from '@/services/my.service'

export async function POST(req: Request) {
  const body = await req.json()
  const result = await myService.doSomething(body)
  return Response.json(result)
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

## 다음으로 읽을 것

- [architecture.md](architecture.md) — 왜 이런 구조인지 배경 설명
- [api-spec.md](api-spec.md) — API 엔드포인트 상세 명세
- [known-issues.md](known-issues.md) — 알려진 이슈와 주의사항
