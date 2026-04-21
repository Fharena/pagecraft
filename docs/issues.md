# PageCraft 이슈 트래커

> 개발 중 해결한 주요 이슈와 아키텍처 변경 기록

---

## #1. Vercel 배포 환경 payload 제한 대응

**오류 텍스트**
```
POST /api/ai/copy 413 (Content Too Large)
ApiError: Request Entity Too Large — FUNCTION_PAYLOAD_TOO_LARGE
```

**문제 상황**
- 상품 이미지 3~4장 이상 업로드 후 상세페이지 생성 시 413 에러
- 로컬에서는 정상, Vercel 배포 후에만 발생

**원인**
- Vercel 무료/Pro 티어 공통 body 제한: **4.5MB**
- 이미지를 base64 원본으로 서버에 전송하면 초과
- `next.config.ts`의 `bodySizeLimit` 설정은 Vercel 플랫폼 제한과 무관

**해결**
- AI 분석용만 `compressForAI(400px, 0.5)` 압축 후 전송 (최대 5장)
- 렌더링은 클라이언트 HTML로 전환, 다운로드 시에만 서버 호출

**관련 파일**: `src/lib/image.ts`, `src/hooks/useAIGenerate.ts`

---

## #2. 실시간 렌더링 + 상세페이지 품질을 위한 하이브리드 아키텍처

**문제**
- 서버 canvas 렌더링은 매 수정마다 API 호출 (2~3초 대기)
- 이미지를 서버에 보내야 해서 압축 필수 → 화질 저하
- 클라이언트 렌더링(html2canvas, dom-to-image-more)은 한글 폰트 깨짐

**최종 해결: 하이브리드**
| 역할 | 처리 위치 | 이유 |
|------|----------|------|
| 미리보기 | 클라이언트 (React HTML) | 실시간 반영 |
| 본문 PNG | 서버 (@napi-rs/canvas) | 한글 폰트 완벽 |
| 상하단 이미지 합성 | 클라이언트 (canvas) | 원본 화질 유지 |

**관련 파일**: `src/components/editor/DetailPagePreview.tsx`, `src/services/render.service.ts`

---

## #3. React Hydration Mismatch (Error #418)

**증상**: `Uncaught Error: Minified React error #418`

**원인**
- `imageStore` 초기값에서 `localStorage.getItem()` 직접 호출
- 서버 렌더 시 `null`, 클라이언트 렌더 시 실제 값 → 불일치

**해결**
- 스토어 초기값 `null`로 통일
- 클라이언트 측 `_hydrate()`에서 `localStorage` 복원

**관련 파일**: `src/stores/imageStore.ts`

---

## #4. sessionStorage 용량 초과 (QuotaExceededError)

**증상**: 이미지 3~4장 업로드 시 `QuotaExceededError`

**원인**
- zustand persist가 이미지 base64를 sessionStorage에 저장
- sessionStorage 용량 제한: ~5MB

**해결**
- 이미지 저장소를 `sessionStorage` → **IndexedDB**로 전환
- `idb` 패키지 사용, `src/lib/imageDB.ts` 모듈 생성
- 메타데이터만 sessionStorage, 실제 이미지는 IndexedDB (용량 무제한)

---

## #5. layout.tsx script 태그 에러

**증상**
```
Encountered a script tag while rendering React component
```

**원인**: Next.js App Router에서 React 컴포넌트 내부의 `<script>` 미실행

**해결**
- `<script>` → `next/script`의 `<Script>` 컴포넌트
- `strategy="beforeInteractive"` 지정

---

## #6. 이미지 삭제/자르기 버튼 hover 안 보임

**원인**: inline `opacity: 0`이 Tailwind `group-hover:opacity-100`보다 CSS 우선순위 높음

**해결**
- Tailwind 클래스로 이동: `className="opacity-0 group-hover:!opacity-100"`
- `!important`로 hover 확실하게

---

## #7. Gemini JSON 파싱 실패

**오류**: `Unterminated string in JSON` / `Expected ',' or ']'`

**원인**
- Gemini가 `responseMimeType: 'application/json'` 지정해도 가끔 깨진 JSON 반환
- 코드블록, trailing comma, 이스케이프 안 된 줄바꿈 등

**해결**
- `safeParseJSON` 헬퍼 추가 (`src/services/ai.service.ts`)
  - 코드블록 제거
  - JSON 시작/끝 자동 추출
  - trailing comma 제거
  - 실패 시 문자열 내부 제어문자 이스케이프 후 재시도

---

## #8. Gemini 503 간헐적 오류

**오류**: `503 UNAVAILABLE — This model is currently experiencing high demand`

**원인**: `gemini-2.5-flash` 모델의 일시적 과부하

**해결**
- `geminiRequest()` 함수에 자동 재시도 (최대 3회, 2초/4초 간격)
- 지수 백오프는 아니지만 데모 수준 안정성 확보

---

## #9. AI 호출 3회 분리 → 통합 1회

**문제**: content / titles / tags를 각각 다른 API 호출 → 503 확률 3배 증가

**해결**
- 통합 프롬프트 작성 (`buildSystemPrompt` + titles + tags를 한번에 지시)
- `/api/ai/copy`에서 `GeneratedAll` (content + titles + tags) 반환
- Gemini API 호출 횟수 1/3로 감소

---

## #10. 클라이언트 렌더링 라이브러리 검토 (html2canvas, dom-to-image-more)

**시도 1: html2canvas** — 한글 자간 깨짐, scale:2 에서 빈 이미지
**시도 2: dom-to-image-more** — 텍스트마다 사각형 아티팩트
**결론**: 클라이언트 DOM 캡처로는 한글 품질 보장 불가 → 서버 `@napi-rs/canvas` 하이브리드로 최종 결정

---

## #11. Sentry v10 클라이언트 초기화

**증상**: 배포 후 Sentry Issues에 이벤트 수신 안 됨

**원인**: Sentry v10부터 `sentry.client.config.ts` 파일명 deprecated

**해결**: `sentry.client.config.ts` → `instrumentation-client.ts` 리네임

---

## #12. React Hooks 순서 위반 (인증 페이지)

**오류**: `Rendered more hooks than during the previous render`

**원인**
- `useSession` 조건부 early return → 이후 훅들이 조건에 따라 개수 달라짐
- `useCallback` 훅도 early return 아래 있어서 불규칙 호출

**해결**
- 훅은 모두 컴포넌트 최상단
- early return은 훅 호출 후 조건부 렌더링으로
- `handleDownload` `useCallback` → 일반 함수로 변경

---

## #13. Vercel Marketplace Redis 연결 방식 변경

**문제**: 크레딧이 실제로 저장되지 않고 계속 500/500 표시

**원인**
- Vercel이 최근 KV 제품을 Marketplace Redis(Redis Cloud / Upstash 등 선택)로 변경
- 제공 환경변수: `KV_REDIS_URL` (TCP) 하나만 — REST API 없음
- `@vercel/kv` 패키지는 `KV_REST_API_URL/TOKEN`을 요구 → 호환 안 됨

**해결**
- `@vercel/kv` → `ioredis`로 교체
- `KV_REDIS_URL` 직접 연결
- 전역 인스턴스 재사용으로 서버리스 cold-start 대응

---

## #14. 월간 크레딧 시스템 도입

**배경**: 일일 제한 방식은 사용자가 필요한 기능에 크레딧을 몰아서 못 쓰는 제약

**전환**
```
기존: 상세 5회/일, AI 이미지 3회/일, 배경제거 3회/일 (분리 quota)
변경: 월 500 크레딧 단일 풀 (상세 1 / 이미지 5 / 배경 5)
```

**특징**
- 매달 1일 KST 자정 초기화 (TTL 32일)
- 유저가 원하는 조합으로 자유롭게 소비
- 관리자(`ADMIN_EMAILS`)는 무제한

**관련 파일**: `src/lib/rateLimit.ts`, `src/lib/apiAuth.ts`

---

## #15. Gemini 배경 제거 한계

**문제**
- `gemini-2.5-flash-image`는 "생성" 모델이라 배경제거가 재현성 낮음
- 박스 위에 상품 있으면 박스 일부를 상품으로 오인
- 흰 배경 지시해도 살짝 회색빛으로 생성

**해결 (단기 대응)**
1. 프롬프트 강화: 객체 수/포즈/위치 유지 명시
2. 클라이언트 후처리: `whitenNearWhite()` 함수로 threshold 245 이상 픽셀을 순수 #FFFFFF로 치환

**장기 해결 대기**: Replicate BRIA RMBG 2.0 도입 ($0.018/장, 진짜 픽셀 마스크 기반)

**관련 파일**: `src/services/ai.service.ts`, `src/lib/image.ts`, `src/hooks/useBgRemoval.ts`

---

## #16. 크레딧 실시간 UI 반영

**문제**: 프로필 패널이 열 때만 조회 → 배경제거 직후 잔액 안 바뀜

**해결**
- `usageStore` (zustand) 신규 — 전역 사용량 상태
- Header: 마운트 + 패널 오픈 시 fetch
- AI 호출 성공 직후 각 훅에서 `useUsageStore.getState().fetchUsage()` 호출 → 즉시 반영

---

## #17. Google OAuth Preview 배포 로그인 불가

**증상**: Vercel Preview 배포에서 구글 로그인 불가 (redirect_uri_mismatch)

**원인**: Preview URL이 매번 랜덤으로 생성 (`pagecraft-git-xxx.vercel.app`) → Google OAuth 등록 불가능

**해결 (선택)**
- Preview 환경에만 `SKIP_AUTH=true`, `NEXT_PUBLIC_SKIP_AUTH=true` 설정
- Production은 정상 인증 유지
- Vercel Environment Variables에서 환경별 체크박스로 구분

---

## #18. 크레딧 소비 race condition

**문제 상황**
- 100명 동시 요청 시나리오에서 크레딧 체크와 기록이 **분리**되어 있었음
- `check → recordUsage` 사이 시간차 → 한도 초과 누적 가능
- 예: 잔여 1 크레딧 상태에서 2개 요청이 동시 도달 → 둘 다 `check` 통과 → 둘 다 `recordUsage` 성공 → -1 잔액

**해결: Redis INCRBY + 롤백 패턴**
```ts
// src/lib/rateLimit.ts
const newValue = await r.incrby(key, cost)          // 원자 증가
if (newValue > MONTHLY_CREDITS) {
  await r.decrby(key, cost)                         // 한도 초과 시 롤백
  return { allowed: false }
}
return { allowed: true, remaining: LIMIT - newValue }
```

- `consumeCreditsAtomic()` 함수로 체크+차감 1회 원자 연산
- API 실패 시 `refundCredits()` (DECRBY)로 자동 환불
- `apiAuth.ts`의 `requireAuth(type)` + `refundOnFailure()` 헬퍼로 래핑

**관련 파일**: `src/lib/rateLimit.ts`, `src/lib/apiAuth.ts`

---

## #19. 이미지 생성 품질 저하 (압축 분기)

**문제**: AI 이미지 생성/배경 제거 결과가 흐릿하거나 화질이 들쭉날쭉함

**원인**
- 모든 AI 호출이 `compressForAI(400px/0.5)`를 공용으로 사용
- 텍스트 분석엔 충분하지만 **이미지 생성 모델은 400px 입력으로 출력을 1024px로 업스케일 추정** → 품질 손실

**해결: 용도별 압축 분리**

| 함수 | 해상도/품질 | 용도 |
|------|------------|------|
| `compressForAI` | 400px / 0.5 | 텍스트 분석만 |
| `compressForImageGen` | 1024px / 0.9 | **이미지 생성/배경제거** |
| `compressForRender` | 780px / 0.75 | 서버 PNG 렌더 |

**페이로드 검증**
- 1024px × 0.9 JPEG 한 장 ≈ 300~500KB
- AI 모델 이미지: 최대 3장 → ~1.5MB (Vercel 4.5MB 제한 안전)
- 배경 제거: 1장 → 0.5MB (안전)

**관련 파일**: `src/lib/image.ts`, `src/hooks/useBgRemoval.ts`, `src/components/image/AiModelToggle.tsx`

---

## #20. 이미지 생성용 base64 payload 최적화

**문제**: AI 모델 이미지 생성에서 원래 5장까지 업로드 가능 → 1024px × 5 = ~2.5MB + 기타 → 4.5MB 한계 근접

**해결**
- AI 모델 이미지 입력을 **최대 3장**으로 제한 (`images.slice(0, 3)`)
- 실제 모델 생성에 3장 이상 참고 이미지는 불필요 (Gemini가 주요 특징만 추출)

**관련 파일**: `src/components/image/AiModelToggle.tsx`
