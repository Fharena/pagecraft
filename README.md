# PageCraft

쿠팡 셀러를 위한 AI 상품 등록 자동화 도구.
이미지 업로드부터 상세페이지 생성, 상품명/태그까지 한 번에.

---

## 시작하기

### 요구사항

- Node.js 20+
- npm
- Supabase 프로젝트 (DB + Storage + Auth)

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
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# AI APIs
ANTHROPIC_API_KEY=sk-ant-...       # Claude (카피/태그 생성)
OPENAI_API_KEY=sk-...              # GPT Image (이미지 생성)
REPLICATE_API_TOKEN=r8_...         # Stability AI (인페인팅)
GEMINI_API_KEY=AI...               # Gemini Flash (벌크 처리, 선택)

# 쿠팡
COUPANG_ACCESS_KEY=...             # 쿠팡 파트너스 API (선택)
COUPANG_SECRET_KEY=...             # 쿠팡 파트너스 API (선택)
```

> API 키 발급 방법은 [docs/api-keys.md](docs/api-keys.md) 참고

---

## 기술 스택

| 레이어 | 기술 | 비고 |
|--------|------|------|
| **프레임워크** | Next.js 15 (App Router) | 프론트 + API 라우트 통합 |
| **언어** | TypeScript | 전체 적용 |
| **UI** | React 19 + Tailwind CSS | 유틸리티 퍼스트 |
| **상태 관리** | Zustand | 경량, 스토어별 관심사 분리 |
| **DB** | Supabase (PostgreSQL) | 상품/시장 데이터, 유저 |
| **스토리지** | Supabase Storage (S3 호환) | 이미지 저장 |
| **인증** | Supabase Auth | JWT 기반, 소셜 로그인 |
| **AI 텍스트** | Claude Sonnet 4 | 상품 카피, 상품명, 태그 20개 |
| **AI 이미지** | GPT Image 1.5 | 상품 이미지 7장 생성 |
| **인페인팅** | Stability AI (Replicate) | 가격태그 제거 |
| **배포** | Vercel | Next.js 올인원 배포 |

---

## 프로젝트 구조

```
pagecraft/
├── src/
│   ├── app/                          # Next.js App Router (페이지)
│   │   ├── layout.tsx                # 루트 레이아웃
│   │   ├── page.tsx                  # 홈 (대시보드)
│   │   ├── product/
│   │   │   ├── new/page.tsx          # 상품 등록 (메인 플로우)
│   │   │   └── [id]/page.tsx         # 상품 상세 보기
│   │   ├── history/page.tsx          # 작업 히스토리
│   │   │
│   │   └── api/                      # API 라우트 (백엔드)
│   │       ├── ai/
│   │       │   ├── copy/route.ts     # POST - AI 카피 생성
│   │       │   ├── titles/route.ts   # POST - 상품명 5개 생성
│   │       │   └── tags/route.ts     # POST - 태그 20개 생성
│   │       ├── image/
│   │       │   ├── generate/route.ts # POST - AI 이미지 7장 생성
│   │       │   └── inpaint/route.ts  # POST - 가격태그 인페인팅
│   │       ├── render/
│   │       │   └── route.ts          # POST - 상세페이지 PNG 렌더링
│   │       └── market/
│   │           ├── route.ts          # GET  - 쿠팡 시장 데이터
│   │           └── suggest/route.ts  # GET  - 쿠팡 키워드 자동완성
│   │
│   ├── components/                   # React 컴포넌트
│   │   ├── ui/                       # 공통 UI (Button, Input, Modal, Card)
│   │   ├── image/                    # ImageUploader, ImageGrid, Cropper
│   │   ├── editor/                   # PagePreview, CopyEditor, TagManager
│   │   ├── market/                   # MarketCard, MarginCalculator
│   │   └── layout/                   # Header, Sidebar, StepIndicator
│   │
│   ├── services/                     # 비즈니스 로직 (API 라우트와 분리)
│   │   ├── ai.service.ts             # Claude/Gemini 호출, 프롬프트 빌더
│   │   ├── image.service.ts          # GPT Image, Stability AI 호출
│   │   ├── render.service.ts         # Canvas 렌더링 로직
│   │   ├── market.service.ts         # 쿠팡 데이터 수집
│   │   └── product.service.ts        # 상품 CRUD
│   │
│   ├── stores/                       # Zustand 상태 관리
│   │   ├── productStore.ts           # 상품 정보
│   │   ├── imageStore.ts             # 이미지 목록 + 처리 상태
│   │   └── editorStore.ts            # 에디터 (카피, 태그, 레이아웃)
│   │
│   ├── hooks/                        # 커스텀 훅
│   │   ├── useImageUpload.ts         # 업로드 + 압축
│   │   ├── useAIGenerate.ts          # AI 생성 요청 + 상태
│   │   └── useMarketData.ts          # 시장 데이터 조회
│   │
│   ├── lib/                          # 유틸리티
│   │   ├── api.ts                    # API 클라이언트 (fetch wrapper)
│   │   ├── supabase/
│   │   │   ├── client.ts             # 브라우저용 클라이언트
│   │   │   └── server.ts             # 서버용 클라이언트
│   │   └── image.ts                  # 이미지 압축, base64 변환
│   │
│   ├── types/                        # TypeScript 타입 정의
│   │   ├── product.ts
│   │   ├── market.ts
│   │   └── ai.ts
│   │
│   └── templates/                    # 상세페이지 렌더링 템플릿
│       ├── base.template.ts          # 기본 레이아웃 설정
│       └── fashion.template.ts       # 패션/의류 특화
│
├── public/                           # 정적 파일
│   └── fonts/                        # 한글 폰트 (NotoSansKR)
│
├── docs/                             # 프로젝트 문서
│   ├── onboarding.md                 # 신규 개발자 온보딩 가이드
│   ├── architecture.md               # 아키텍처 설명 + 의사결정 배경
│   ├── api-spec.md                   # API 엔드포인트 명세
│   ├── api-keys.md                   # 외부 API 키 발급 방법
│   └── known-issues.md              # 크리티컬 이슈 + 기술 부채
│
├── .env.example                      # 환경 변수 템플릿
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### 구조 설계 원칙

| 원칙 | 설명 |
|------|------|
| **services/ 분리** | API 라우트는 요청/응답만 처리. 비즈니스 로직은 services/에. 이후 Express 분리 시 services/를 그대로 가져감 |
| **컴포넌트 캡슐화** | 기능별 폴더 (image/, editor/, market/)로 분리. 각 컴포넌트가 자체 상태와 로직 소유 |
| **스토어 관심사 분리** | 전역 변수 대신 Zustand 스토어. productStore, imageStore, editorStore로 역할 구분 |
| **템플릿 확장성** | 상세페이지 렌더링을 templates/에 분리. 레이아웃 JSON 설정으로 관리. 새 템플릿 추가 용이 |
| **타입 안전** | TypeScript 전면 적용. API 요청/응답, 컴포넌트 props, 스토어 모두 타입 정의 |

---

## 핵심 플로우 (MVP)

```
이미지 업로드 → 가격태그 제거 → 시장 조사 → AI 이미지 생성 → 카피/태그 생성 → 상세페이지 완성
     (1)            (2)           (3)           (4)              (5)             (6)
```

| 단계 | 기능 | 사용 기술 |
|------|------|----------|
| 1 | 상품 사진 업로드 (최대 10장, 800px 압축) | Client Canvas |
| 2 | 가격 스티커/택 AI 감지 + 인페인팅 제거 | Stability AI |
| 3 | 쿠팡 셀러 수, 최저가, 마진 계산 | 쿠팡 API + 크롤링 |
| 4 | 원본 1장 → 상품 이미지 7장 자동 생성 | GPT Image 1.5 |
| 5 | 상품 카피 + 상품명 5개 + 태그 20개 생성 | Claude Sonnet |
| 6 | 이미지 배치 + 카피 → PNG/PDF 다운로드 | Canvas 렌더링 |

---

## 렌더링 전략

상세페이지 렌더링은 **이중 전략**:

- **미리보기 (클라이언트)**: 브라우저 Canvas로 실시간 렌더링. 텍스트 수정 시 즉시 반영
- **최종 다운로드 (서버)**: `@napi-rs/canvas`로 서버사이드 PNG 생성. 한글 폰트 보장, 품질 일관성

미리보기에서 수정 → 만족하면 서버에 최종 렌더링 요청 → PNG/PDF 다운로드.

---

## 스크립트

```bash
npm run dev          # 개발 서버 (http://localhost:3000)
npm run build        # 프로덕션 빌드
npm run start        # 프로덕션 서버
npm run lint         # ESLint
npm run type-check   # TypeScript 타입 체크
```

---

## 이후 계획: 아키텍처 개선안

### Phase 1 → Phase 2: 백엔드 분리

현재는 Next.js API Routes에 모든 서버 로직이 포함되어 있지만, 아래 상황 발생 시 Express 백엔드를 분리합니다:

**분리 시점 판단 기준:**
- API 라우트가 20개 이상으로 증가
- 렌더링 타임아웃이 Vercel 제한(60초)을 초과
- WebSocket, 장시간 폴링 등 서버리스에서 불가능한 기능 필요
- 동시 사용자 증가로 서버리스 비용이 전용 서버보다 비싸질 때

**분리 전략:**
```
[현재]  Next.js (프론트 + API Routes) → Vercel

[이후]  Next.js (프론트만) → Vercel
        Express (API 서버) → Railway / AWS
```

`services/` 폴더가 분리되어 있으므로, Express 라우트에서 동일한 서비스를 import하면 됩니다.
API 라우트 문법만 변경 (`Response.json()` → `res.json()`), 비즈니스 로직은 변경 없음.

### Phase 2 → Phase 3: 모바일 앱

바코드 스캔, 현장 촬영 등 네이티브 기능이 필요해지면 React Native + Expo로 모바일 앱 추가:

```
[이후]  Next.js (웹 대시보드) → Vercel
        React Native (모바일 앱) → App Store / Play Store
        Express (공통 API 서버) → Railway / AWS
```

React 컴포넌트 로직과 Zustand 스토어는 React Native에서도 재사용 가능.
`services/`, `types/`, `stores/`를 공유 패키지로 분리하여 모노레포 구성.

### Phase 3+: 스케일업

```
[스케일]  Next.js → Vercel
          NestJS (API 서버) → AWS ECS
          Redis (캐시/세션) → ElastiCache
          PostgreSQL → Supabase 또는 AWS RDS
          S3 (이미지) → CloudFront CDN
          Bull Queue (AI 작업 큐) → Redis 기반
```

AI 이미지 생성 등 오래 걸리는 작업은 작업 큐로 분리.
NestJS 전환은 Express 라우트 구조가 유사하여 점진적 마이그레이션 가능.

---

## 문서

| 문서 | 설명 |
|------|------|
| [docs/onboarding.md](docs/onboarding.md) | 신규 개발자 온보딩 가이드 |
| [docs/architecture.md](docs/architecture.md) | 아키텍처 상세 + 의사결정 배경 |
| [docs/api-spec.md](docs/api-spec.md) | API 엔드포인트 명세 |
| [docs/api-keys.md](docs/api-keys.md) | 외부 API 키 발급 방법 |
| [docs/known-issues.md](docs/known-issues.md) | 크리티컬 이슈 + 기술 부채 |
