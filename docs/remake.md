# pagecraft-pro → pagecraft 리메이크 요약

## 이전 (pagecraft-pro)
- **구조**: index.html 1개 파일에 HTML+CSS+JS 2,001줄 올인원
- **프레임워크**: 없음 (바닐라 JS)
- **상태 관리**: 전역 변수 (`let imgs = []`, `let resultData = null` 등)
- **API**: Vercel 서버리스 함수 4개 (JS)
- **스타일**: 인라인 CSS + CSS 변수
- **타입 체크**: 없음

## 이후 (pagecraft)
- **구조**: Next.js 16 App Router, 50+ 파일로 역할별 분리
- **프레임워크**: React 19 + TypeScript strict
- **상태 관리**: Zustand v5 스토어 4개 (product, image, editor, usage) + IndexedDB/localStorage/sessionStorage 분리 저장
- **API**: Next.js API Routes 7개 (TS), services/ 레이어로 비즈니스 로직 분리
- **스타일**: Tailwind CSS v4 (`@theme` 디자인 토큰) + 다크/라이트 모드
- **타입 체크**: TypeScript strict 모드
- **인증**: NextAuth v4 + Google OAuth (JWT 세션)
- **크레딧**: Vercel Marketplace Redis 원자 INCRBY, 월 500 크레딧 시스템
- **렌더링**: 하이브리드 (클라 HTML 미리보기 + 서버 @napi-rs/canvas PNG + 클라 canvas 합성)

## 주요 개선
- 컴포넌트 단위 재사용 가능 (Button, Modal, Toast 등 공통 UI)
- 이미지 크롭, 배경 제거, AI 모델 이미지 생성 독립 컴포넌트화
- Gemini 모델을 환경변수로 교체 가능 (`GEMINI_TEXT_MODEL`, `GEMINI_IMAGE_MODEL`)
- 이미지는 IndexedDB에 저장 (sessionStorage 5MB 제한 회피)
- 통합 AI 생성 (content+titles+tags 1회 호출)로 Gemini 503 확률 1/3 감소
- Express 백엔드 분리 시 `services/` 코드 그대로 이식 가능

## 단순화된 외부 의존성
- 초기 계획: Claude + GPT Image + Stability AI + Supabase
- 현재: **Gemini 단독** + Google OAuth + Vercel Marketplace Redis
- 유지보수 부담 ↓, 단일 공급자 리스크는 향후 Recraft/@imgly로 배경제거 분리 검토
