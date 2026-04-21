# API 명세

모든 API는 `src/app/api/` 하위에 위치. 인증은 **NextAuth JWT 세션 쿠키**로 자동 처리 (Google OAuth).

개발 환경에서 `SKIP_AUTH=true`이면 모든 인증/크레딧 체크가 스킵됨.

---

## 인증 & 크레딧

- 모든 보호된 엔드포인트는 `src/lib/apiAuth.ts`의 `requireAuth(type)` 헬퍼를 사용
- `type`이 지정되면 해당 작업의 크레딧을 **원자 INCRBY**로 선차감
- 실패 시 `refundOnFailure()`로 자동 환불
- 401: 로그인 필요 / 429: 크레딧 부족 (초기화일 안내 포함)

### 크레딧 단가

| 기능 | type | 크레딧 |
|------|------|--------|
| 상세페이지 통합 생성 | `generate` | 1 |
| AI 모델 이미지 생성 | `image` | 5 |
| 배경 제거 | `bg-remove` | 5 |
| PNG 렌더링 | (인증만) | 0 |

---

## AI 통합 생성

### `POST /api/ai/copy`

상품 정보와 이미지에서 **상세 콘텐츠 + 상품명 5개 + 태그 20개**를 한 번에 생성.

**Request**
```json
{
  "images": ["data:image/jpeg;base64,..."],
  "brand": "BRAND",
  "productName": "여성 캐시미어 니트",
  "price": "39900",
  "category": "상의/니트",
  "platform": "쿠팡",
  "memo": "",
  "features": ["캐시미어 혼방", "루즈핏"],
  "coupangSuggestions": ["캐시미어니트 여성", ...]
}
```

- `images`: 최대 5장, 클라이언트에서 `compressForAI(400px, 0.5)` 압축
- `coupangSuggestions`: (선택) 쿠팡 자동완성 키워드

**Response**
```json
{
  "content": {
    "product_name": "캐시미어 블렌드 라운드넥 니트",
    "subtitle": "부드러운 촉감, 매일 입고 싶은 니트",
    "main_copy": "...",
    "selling_points": ["...", "...", "..."],
    "description": "...",
    "specs": [{"key": "소재", "value": "캐시미어 10%, 울 90%"}],
    "keywords": ["캐시미어니트", "여성니트"],
    "caution": "..."
  },
  "titles": [
    {
      "rank": 1, "strategy": "키워드형",
      "title": "[브랜드] 여성 캐시미어 니트 라운드넥",
      "used_keywords": ["캐시미어", "여성", "라운드넥"],
      "char_count": 22
    }
  ],
  "tags": ["캐시미어니트", "여성니트", ...]
}
```

**Service**: `ai.service.ts` → `generateAll()` → Gemini 2.5 Flash (단일 호출)
**크레딧**: 1
**실패 처리**: 크레딧 자동 환불

> **이전 v1** (`/api/ai/titles`, `/api/ai/tags`)는 통합 엔드포인트로 병합됨 — Gemini 503 확률 감소 + 레이턴시 단축 목적.

---

## AI 이미지

### `POST /api/image/generate`

상품 이미지로 AI 모델(사람) 컷을 생성.

**Request**
```json
{
  "productName": "여성 캐시미어 니트",
  "category": "상의/니트",
  "gender": "female",
  "images": ["data:image/jpeg;base64,..."]
}
```

- `images`: 최대 3장, 클라에서 `compressForImageGen(1024px, 0.9)` 압축 (품질 보존)
- `gender`: `"male"` | `"female"`

**Response**
```json
{ "image": "data:image/png;base64,..." }
```

**Service**: `ai.service.ts` → `generateModelImage()` → Gemini 2.5 Flash Image
**크레딧**: 5
**실패 처리**: 크레딧 자동 환불

---

### `POST /api/image/bg-remove`

이미지에서 배경을 제거하고 흰 배경으로 치환.

**Request**
```json
{ "image": "data:image/jpeg;base64,..." }
```

- `image`: 1장, 클라에서 `compressForImageGen(1024px, 0.9)` 압축

**Response**
```json
{ "image": "data:image/png;base64,..." }
```

**Service**: `ai.service.ts` → `removeBackgroundGemini()` → Gemini 2.5 Flash Image (생성형 방식)
**후처리** (클라이언트): `whitenNearWhite(threshold=245)` — Gemini가 만드는 회색빛 배경을 순수 #FFFFFF로 치환
**크레딧**: 5
**실패 처리**: 크레딧 자동 환불

---

## 렌더링

### `POST /api/render`

상품 데이터 + 본문 이미지로 **본문만** PNG 생성. 상하단 이미지는 클라이언트에서 합성.

**Request**
```json
{
  "data": {
    "product_name": "...",
    "subtitle": "...",
    "main_copy": "...",
    "selling_points": ["...", "...", "..."],
    "description": "...",
    "specs": [{"key": "...", "value": "..."}],
    "keywords": ["..."],
    "caution": "..."
  },
  "price": "39,900",
  "images": ["data:image/jpeg;base64,..."]
}
```

- `images`: 본문에 들어가는 이미지 (상하단 제외)
- 상하단 `storeIntroImage`, `termsImage`는 서버에 **전송하지 않음** (클라에서 직접 합성)

**Response**: Binary PNG (`Content-Type: image/png`)

**Service**: `render.service.ts` → `@napi-rs/canvas`
**크레딧**: 0 (인증만)
**제한**: `maxDuration = 60s` (Vercel Pro 기준)

---

## 사용량

### `GET /api/usage`

현재 유저의 크레딧 잔량 조회.

**Response**
```json
{
  "credits": {
    "used": 47,
    "remaining": 453,
    "limit": 500
  },
  "cost": {
    "generate": 1,
    "image": 5,
    "bg-remove": 5
  }
}
```

**Service**: `rateLimit.ts` → `getCreditStatus()` → Redis `GET credits:{userId}:{YYYY-MM}`
**관리자**(`ADMIN_EMAILS`): `remaining: 99999`로 반환

---

## 시장 데이터

### `GET /api/market/suggest?keyword={keyword}`

쿠팡 자동완성 API 프록시. AI 생성 시 SEO 키워드 힌트로 사용.

**Response**
```json
{
  "seeds": ["캐시미어 니트"],
  "bySeed": { "캐시미어 니트": ["캐시미어 니트 여성", ...] },
  "suggestions": ["캐시미어 니트 여성", "캐시미어 니트 남성", ...]
}
```

**Service**: `market.service.ts` → 쿠팡 자동완성 엔드포인트 직접 호출
**크레딧**: 0 (인증 불필요)
**폴백**: 실패 시 빈 배열 반환 (200 OK)

---

## 인증 콜백

### `GET|POST /api/auth/[...nextauth]`

NextAuth v4가 관리. 로그인/로그아웃/세션 조회 자동 처리.

- `GET /api/auth/signin` → Google OAuth 리다이렉트
- `GET /api/auth/callback/google` → 콜백 처리 + JWT 쿠키 발급
- `POST /api/auth/signout` → 세션 종료

---

## 에러 응답 규약

모든 JSON 에러는 다음 형식:

```json
{ "error": "사용자 친화 한글 메시지" }
```

`src/lib/errorMessage.ts`의 `friendlyErrorMessage()`가 내부 에러를 사용자가 읽을 수 있는 형태로 매핑:

| 내부 에러 | 사용자 메시지 |
|----------|-------------|
| Gemini 503/unavailable | "AI 서버가 일시적으로 바쁩니다. 30초 후 다시 시도해주세요." |
| 네트워크/타임아웃 | "네트워크 오류가 발생했습니다." |
| 401 | "로그인이 필요합니다." |
| 429 | "크레딧이 부족합니다. N월 1일 00:00에 자동 초기화됩니다." |
