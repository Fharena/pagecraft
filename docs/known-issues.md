# 크리티컬 이슈 & 기술 부채

> 현재 데모 MVP 기준으로 남아있는 이슈와 기술 부채 정리

---

## 현재 남은 이슈

### 1. Vercel 함수 타임아웃
**문제**: `/api/render`에 `maxDuration = 60` 설정했지만, Hobby 플랜은 10초 제한

**영향**: 이미지 10장 + 폰트 로딩 시 타임아웃 가능

**현재 대응**
- 클라이언트에서 이미지 미리 압축 → 서버 처리 시간 단축
- 상하단 이미지는 서버에 안 보냄 → payload 감소

**근본 해결**
- Vercel Pro로 전환 (60초)
- 또는 Railway 같은 곳에 렌더 서버 분리

---

### 2. Google OAuth Preview 배포 로그인 불가
**문제**: Preview URL이 랜덤이라 OAuth redirect_uri_mismatch

**현재 대응**
- Preview 환경에만 `SKIP_AUTH=true`, `NEXT_PUBLIC_SKIP_AUTH=true` 설정
- Production에서는 정상 작동

**근본 해결 (필요 시)**
- Vercel Pro + 고정 Preview 도메인 할당

---

### 3. 모바일 미지원
**문제**: 3열 그리드 + 450px/480px 사이드 패널 고정 → 모바일 화면에서 사용 불가

**영향**: 데모 유저가 모바일 접속 시 UX 불가

**대응 (Phase 2)**
- 반응형 레이아웃으로 전환 (브레이크포인트 768px)
- 모바일은 탭 전환 방식 (사이드 패널 → 모달/드로어)

---

### 4. 크레딧 시스템 초기 사용자 대응
**문제**: 처음 접속한 유저가 크레딧 개념을 모름

**대응 (데모 중)**
- 프로필 패널 에 기능별 단가 표시 (상세 1, 이미지 5, 배경 5)
- 크레딧 부족 시 에러 메시지에 초기화일 안내 ("N월 1일 00:00 초기화")

**추가 개선 (선택)**
- 첫 접속 시 튜토리얼 모달
- "남은 크레딧" 헤더 상시 표시

---

## 기술 부채

### 코드 품질

| 항목 | 위치 | 해결 방향 |
|------|------|----------|
| `render.service.ts`와 `DetailPagePreview.tsx` 레이아웃 중복 | 서버/클라 양쪽에 동일 스펙 명시 | JSON 설정으로 추출해서 공유 |
| `any` 타입 일부 잔존 | `ai.service.ts`, `useBgRemoval.ts` | 타입 정의 강화 |
| 에러 핸들링 중복 | 각 API 라우트마다 try/catch + refundOnFailure | 미들웨어 또는 `withCreditGuard` 래퍼 |
| `console.error`와 Sentry 혼재 | 일부 에러만 Sentry 전송 | 통일된 에러 로거 |
| 배경제거 순차 처리 | `processAllImages`가 for 루프로 순차 호출 | `Promise.all` 병렬 처리 (Replicate rate limit 주의) |
| `whitenNearWhite` 후처리 불필요화 | Recraft는 투명 PNG 반환 → 후처리 없어도 됨 | 호출부 정리, 함수 자체는 유지(이미지 생성 결과에는 여전히 쓸모 있음) |

### 미구현 기능 (Phase 2+)

| 기능 | 우선순위 | 비고 |
|------|---------|------|
| 결제 시스템 (토스페이먼츠) | 🔥 유료화 시 필수 | `monetization-plan.md` 참고 |
| 유저 DB (히스토리/즐겨찾기) | 🔥 유료화 시 필수 | Supabase 또는 Neon |
| 모바일 반응형 | 높음 | Tailwind 브레이크포인트 |
| 인앱브라우저(카카오톡) OAuth 403 대응 | 높음 | `kakaotalk://web/openExternal?url=` 리디렉트 |
| 배경제거 클라이언트 WASM (@imgly) | 중간 | 장기 목표, 서버 비용 0원 (Recraft $0.01도 부담이면) |
| 태그(라벨) 제거 (인페인팅) | 중간 | Gemini 프롬프트 or Recraft 인페인팅 |
| 상세페이지 템플릿 다양화 | 낮음 | 의류/신발/가방 별 레이아웃 |
| 쿠팡 자동 업로드 | 낮음 | 쿠팡 API 연동 필요 |

### 보안/운영

| 항목 | 상태 |
|------|------|
| Google OAuth 리디렉션 제한 | ✅ 프로덕션 URL 등록됨 |
| Gemini API 키 서버 전용 | ✅ 클라이언트 노출 없음 |
| Rate limiting (크레딧) | ✅ Redis 기반 |
| Sentry 에러 모니터링 | ✅ |
| Vercel Analytics | ✅ |
| Google Cloud 지출 한도 | ✅ 월 설정됨 |
| CSP (Content Security Policy) | ❌ 미설정 |
| API 요청 크기 제한 | ⚠️ 4.5MB (Vercel 기본) |
| 이용약관/개인정보 처리방침 | ❌ 데모 후 필요 |
| 사업자 등록 (유료화 시) | ❌ 필요 |

---

## 환경별 차이

| 항목 | 로컬 (dev) | Vercel (Preview) | Vercel (Production) |
|------|-----------|-----------------|---------------------|
| API 타임아웃 | 무제한 | 10초 | 10초 (Hobby) / 60초 (Pro) |
| 인증 | SKIP_AUTH 가능 | SKIP_AUTH 권장 | 정상 Google OAuth |
| 크레딧 저장소 | 메모리 (폴백) | Redis (공유) | Redis (공유) |
| KV_REDIS_URL | 로컬 .env.local | Vercel env | Vercel env |
| Sentry | DSN 있으면 활성 | 활성 | 활성 |

---

## 비용 예상 (데모 기준)

### 단가
- Gemini 텍스트 입력/출력: $0.30 / $2.50 per 1M tokens
- Gemini 이미지 출력: $0.039/장
- **Replicate Recraft 배경제거: $0.01/호출** (고정)

### 작업별 단위 원가
| 작업 | 비용 | 비고 |
|------|------|------|
| 상세페이지 통합 생성 | ~$0.007 | Gemini 텍스트 (이미지 5장 입력 + 텍스트 출력) |
| AI 모델 이미지 생성 | ~$0.04 | Gemini 이미지 출력 1장 |
| **배경 제거** | **$0.01** | Replicate Recraft (Gemini $0.04 → 75% 절감) |

### 월 시나리오 (현재 구성: Gemini + Recraft)
| 시나리오 | 월 비용 | 비고 |
|---------|---------|------|
| 100명 × 40% 사용률 | ~12만원 | 데모 기준 |
| 150명 × 40% 사용률 | ~18만원 | |
| 150명 × 100% 사용률 (최악) | ~45만원 | 크레딧 한도 고려하면 실제 이보다 낮음 |

**예산 관리**
- Google Cloud: 월 50만원 한도 설정
- Replicate: Auto-reload threshold $5 / reload $15 권장 (데모 안전선)

### 추가 최적화 후보
- `@imgly/background-removal` (클라이언트 WASM, 무료) — Recraft $0.01 도 부담이 될 경우 서버 비용 0원으로 만들 수 있음. 단, 첫 로드 40MB + 모바일 느림 trade-off.
