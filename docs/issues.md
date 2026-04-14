# PageCraft 이슈 트래커

> 해결된 이슈, 개선사항, 아키텍처 변경 기록

---

## #1. React Hydration Mismatch (Error #418)

**오류 텍스트**
```
Uncaught Error: Minified React error #418
```

**원인**
- `imageStore` 초기값에서 `localStorage.getItem()`을 바로 호출
- 서버 렌더링 시 `localStorage` 없음 → `null`
- 클라이언트 렌더링 시 `localStorage` 있음 → `"data:image/..."`
- 서버 HTML과 클라이언트 HTML이 달라서 React hydration 실패

**해결 방법**
- 스토어 초기값을 `null`로 통일 (서버/클라이언트 동일)
- `_hydrate()` 함수에서 클라이언트 측에서만 `localStorage` 복원
- 순서: 서버 렌더(null) → 클라이언트 시작(null, 일치) → hydrate(값 채움)

**관련 파일**: `src/stores/imageStore.ts`

---

## #2. sessionStorage 용량 초과 (QuotaExceededError)

**오류 텍스트**
```
Uncaught QuotaExceededError: Failed to execute 'setItem' on 'Storage':
Setting the value of 'pagecraft-images' exceeded the quota.
```

**원인**
- 이미지를 base64로 `sessionStorage`에 저장 (zustand persist)
- `sessionStorage` 용량 제한: ~5MB
- 이미지 3~4장만 올려도 초과

**해결 방법**
- 이미지 저장소를 `sessionStorage` → `IndexedDB`로 전환
- `idb` 패키지 사용, `src/lib/imageDB.ts` 모듈 생성
- IndexedDB는 디스크 용량의 ~50%까지 사용 가능 (사실상 무제한)

**개선 전후 비교**

| | 변경 전 | 변경 후 |
|---|---|---|
| 저장소 | sessionStorage | IndexedDB |
| 용량 제한 | ~5MB | 사실상 무제한 |
| 이미지 3장 이상 | 오류 발생 | 정상 |
| 세션 유지 | 탭 닫으면 삭제 | 탭 닫아도 유지 |

**관련 파일**: `src/stores/imageStore.ts`, `src/lib/imageDB.ts`

---

## #3. layout.tsx script 태그 에러

**오류 텍스트**
```
Encountered a script tag while rendering React component.
Scripts inside React components are never executed on the client.
Consider using template tag instead.
```

**원인**
- `layout.tsx`에서 `<script dangerouslySetInnerHTML>` 사용
- Next.js App Router에서는 React 컴포넌트 내부의 `<script>` 태그가 클라이언트에서 실행되지 않음

**해결 방법**
- `<script>` → `next/script`의 `<Script>` 컴포넌트로 변경
- `strategy="beforeInteractive"` 설정 → 페이지 로드 전 실행
- 테마 깜빡임(FOUC) 없이 정상 동작

**관련 파일**: `src/app/layout.tsx`

---

## #4. 이미지 삭제/자르기 버튼 hover 안 보임

**증상**
- 이미지 위에 마우스 올려도 삭제(✕), 자르기(✂) 버튼이 안 나타남

**원인**
- inline style `opacity: 0`이 Tailwind `group-hover:opacity-100`보다 CSS 우선순위 높음
- inline style은 class 기반 스타일보다 항상 우선

**해결 방법**
- `opacity: 0`을 inline style에서 제거
- Tailwind 클래스로 이동: `className="opacity-0 group-hover:!opacity-100"`
- `!important`로 hover 시 확실하게 override

**관련 파일**: `src/components/image/ImageGrid.tsx`

---

## #5. Vercel 배포 환경 payload 제한 대응

**오류 텍스트**
```
POST /api/ai/copy 413 (Content Too Large)
ApiError: Request Entity Too Large — FUNCTION_PAYLOAD_TOO_LARGE
```

**원인**
- Vercel 무료 티어 body 제한: **4.5MB**
- 상품 이미지를 base64 원본(800px)으로 서버에 전송
- 이미지 10장 × ~200KB = ~2MB + 스토어/약관 이미지 = 4.5MB 초과 가능
- `next.config.ts`의 `bodySizeLimit` 설정은 Vercel 플랫폼 제한과 무관

**해결 방법 (단계적 개선)**

### 5-1. AI 분석용 이미지 압축

| | 변경 전 | 변경 후 |
|---|---|---|
| 전송 이미지 | 원본 800px, 0.8 품질 | 400px, 0.5 품질 |
| 전송 장수 | 전체 (최대 10장) | 최대 5장 |
| payload 크기 | ~2MB | ~250KB |

- `compressForAI()` 함수 추가: AI는 상품 내용 파악만 하면 되므로 저해상도 충분
- `/api/ai/copy`, `/api/image/generate` 모두 적용

### 5-2. 상세페이지 렌더링 클라이언트 전환 (근본 해결)

| | 변경 전 (서버 렌더링) | 변경 후 (클라이언트 렌더링) |
|---|---|---|
| 렌더링 위치 | 서버 (@napi-rs/canvas) | 클라이언트 (HTML React) |
| 이미지 전송 | base64로 서버에 POST | 전송 없음 (로컬 사용) |
| Vercel 제한 | 4.5MB에 걸림 | API 호출 없음, 제한 무관 |
| 이미지 품질 | 압축 필요 (780px/0.75) | 원본 그대로 (800px/0.8) |
| 미리보기 반영 | API 호출 2~3초 | 실시간 즉시 반영 |
| 텍스트 수정 | 수정 → 재렌더링 버튼 → API | 수정 → 자동 반영 |
| 서버 부하 | 렌더링마다 CPU 사용 | 제로 |
| PNG 다운로드 | 서버에서 PNG 반환 | html2canvas로 클라이언트 변환 |

**아키텍처 변경 요약**
```
변경 전:
  프론트 → 이미지 압축 → POST /api/render (base64) → 서버 canvas 렌더 → PNG blob 반환 → 표시

변경 후:
  프론트 → generatedContent 변경 → React 리렌더링 → 즉시 표시
  다운로드 시에만 → html2canvas → PNG 변환 (클라이언트)
```

**단점/주의사항**
- `html2canvas`는 서버 `@napi-rs/canvas`보다 폰트 렌더링이 미세하게 다를 수 있음
- 브라우저 환경에 따라 렌더링 결과가 약간 다를 수 있음 (크로스 브라우저)
- 서버 렌더링 코드(`render.service.ts`, `/api/render`)는 fallback으로 유지

**관련 파일**:
- `src/components/editor/DetailPagePreview.tsx` (신규)
- `src/app/product/new/page.tsx`
- `src/hooks/useAIGenerate.ts`
- `src/lib/image.ts`

---

## #6. AI 이미지 생성 payload too large

**오류 텍스트**
```
POST /api/image/generate 413 (Content Too Large)
```

**원인**
- `AiModelToggle`에서 모든 상품 이미지를 원본 base64로 전송
- Next.js 기본 body 제한 1MB 초과

**해결 방법**
- `compressForAI()` 함수로 400px/0.5 품질 압축 후 전송
- 최대 5장만 전송 (AI 참고용이므로 전체 불필요)
- `next.config.ts`에 `bodySizeLimit: '10mb'` 설정 (안전망)

**관련 파일**: `src/components/image/AiModelToggle.tsx`, `src/lib/image.ts`, `next.config.ts`
