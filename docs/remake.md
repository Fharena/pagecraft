# pagecraft-pro → pagecraft 리메이크 요약

## 이전 (pagecraft-pro)
- **구조**: index.html 1개 파일에 HTML+CSS+JS 2,001줄 올인원
- **프레임워크**: 없음 (바닐라 JS)
- **상태 관리**: 전역 변수 (`let imgs = []`, `let resultData = null` 등)
- **API**: Vercel 서버리스 함수 4개 (JS)
- **스타일**: 인라인 CSS + CSS 변수
- **타입 체크**: 없음

## 이후 (pagecraft)
- **구조**: Next.js 15 App Router, 50+ 파일로 역할별 분리
- **프레임워크**: React 19 + TypeScript
- **상태 관리**: Zustand 스토어 3개 (product, image, editor) + sessionStorage 세션 유지
- **API**: Next.js API Routes 6개 (TS), services/ 레이어로 비즈니스 로직 분리
- **스타일**: Tailwind CSS 4 + 다크/라이트 모드
- **타입 체크**: TypeScript strict 모드

## 주요 개선
- 컴포넌트 단위 재사용 가능 (Button, Modal, Toast 등 공통 UI)
- 이미지 크롭, 배경 제거(@imgly), AI 모델 이미지 생성 독립 컴포넌트화
- Gemini 모델을 환경변수로 교체 가능
- 새로고침 시 데이터 유지 (sessionStorage)
- Express 백엔드 분리 시 services/ 코드 그대로 이식 가능
