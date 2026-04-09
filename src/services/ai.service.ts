import type {
  AIGenerateRequest,
  AITitleRequest,
  AITagRequest,
  AIModelImageRequest,
  GeneratedContent,
  GeneratedTitle,
} from '@/types/ai'

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.')
  return key
}

function buildSystemPrompt(req: AIGenerateRequest): string {
  return `당신은 한국 이커머스(쿠팡, 네이버 스마트스토어 등) 상세페이지 전문 카피라이터입니다.
상품 이미지와 정보를 분석하여 구매 전환율이 높은 상세페이지 콘텐츠를 JSON으로 생성하세요.

상품 정보:
- 브랜드: ${req.brand || '없음'}
- 상품명: ${req.productName}
- 가격: ${req.price}원
- 카테고리: ${req.category}
- 판매 플랫폼: ${req.platform}
- 특징: ${req.features.join(', ') || '없음'}
${req.memo ? `- 메모: ${req.memo}` : ''}

반드시 아래 JSON 형식으로 응답:
{
  "product_name": "상품명 (30자 이내)",
  "subtitle": "부제 (40자 이내)",
  "main_copy": "메인 카피 (50자 이내, 임팩트 있게)",
  "selling_points": ["셀링포인트1", "셀링포인트2", "셀링포인트3"],
  "description": "상품 설명 (3-4문단, 줄바꿈으로 구분)",
  "specs": [{"key": "소재", "value": "값"}, ...],
  "keywords": ["키워드1", "키워드2", ...],
  "caution": "주의사항/안내 (1-2문장)"
}`
}

function buildTitlePrompt(req: AITitleRequest): string {
  return `당신은 쿠팡 상품명 SEO 최적화 전문가입니다.
아래 정보를 바탕으로 쿠팡 검색 최적화된 상품명 5개를 생성하세요.

상품: ${req.productName}
카테고리: ${req.category}
브랜드: ${req.brand || '없음'}
참고 키워드: ${req.keywords.join(', ')}
쿠팡 인기 검색어: ${req.coupangSuggestions.join(', ')}

각 상품명은 다른 전략을 사용:
1. 키워드 밀도 최대화
2. 브랜드 강조
3. 혜택/가성비 강조
4. 감성/라이프스타일
5. 스펙/기능 상세

반드시 아래 JSON 배열로 응답:
[{"rank":1,"strategy":"전략명","title":"상품명","used_keywords":["사용키워드"],"char_count":50}]`
}

function buildTagPrompt(req: AITagRequest): string {
  return `당신은 쿠팡 태그 최적화 전문가입니다.
아래 정보를 바탕으로 쿠팡 검색에 최적화된 태그 20개를 생성하세요.

상품: ${req.productName}
카테고리: ${req.category}
브랜드: ${req.brand || '없음'}
쿠팡 인기 검색어: ${req.coupangSuggestions.join(', ')}

규칙:
- 쿠팡 인기 검색어를 최대한 활용
- 핵심 키워드 + 롱테일 키워드 혼합
- 중복 없이 20개

반드시 JSON 문자열 배열로 응답: ["태그1", "태그2", ...]`
}

export async function generateContent(
  req: AIGenerateRequest,
): Promise<GeneratedContent> {
  const apiKey = getApiKey()
  const systemPrompt = buildSystemPrompt(req)

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []

  for (const img of req.images) {
    const base64 = img.replace(/^data:image\/\w+;base64,/, '')
    parts.push({
      inlineData: { mimeType: 'image/jpeg', data: base64 },
    })
  }

  parts.push({ text: '이 상품 이미지를 분석하고 상세페이지 콘텐츠를 생성해주세요.' })

  const body = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts }],
    generationConfig: {
      responseMimeType: 'application/json',
      maxOutputTokens: 2500,
    },
  }

  const res = await fetch(
    `${GEMINI_BASE}/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API 오류: ${res.status} ${err}`)
  }

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini 응답에서 텍스트를 찾을 수 없습니다.')

  return JSON.parse(text) as GeneratedContent
}

export async function generateTitles(
  req: AITitleRequest,
): Promise<GeneratedTitle[]> {
  const apiKey = getApiKey()
  const prompt = buildTitlePrompt(req)

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      maxOutputTokens: 2000,
    },
  }

  const res = await fetch(
    `${GEMINI_BASE}/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API 오류: ${res.status} ${err}`)
  }

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini 응답에서 텍스트를 찾을 수 없습니다.')

  return JSON.parse(text) as GeneratedTitle[]
}

export async function generateTags(req: AITagRequest): Promise<string[]> {
  const apiKey = getApiKey()
  const prompt = buildTagPrompt(req)

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      maxOutputTokens: 1000,
    },
  }

  const res = await fetch(
    `${GEMINI_BASE}/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API 오류: ${res.status} ${err}`)
  }

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini 응답에서 텍스트를 찾을 수 없습니다.')

  return JSON.parse(text) as string[]
}

function getCameraFocus(
  category: string,
  productName: string,
): { part: string; shot: string; crop: string } {
  const name = (productName || '').toLowerCase()

  const earringPattern = /귀걸이|이어링|earring/
  const necklacePattern = /목걸이|넥클리스|necklace|펜던트/
  const braceletPattern = /팔찌|브레이슬릿|bracelet|뱅글/
  const ringPattern = /반지|링|ring/
  const glassesPattern = /안경|선글라스|glasses|sunglasses/
  const beltPattern = /벨트|belt/
  const sockPattern = /양말|sock/
  const bagPattern = /가방|백|bag|clutch|tote|숄더백|크로스백|토트/
  const hatPattern = /모자|hat|cap|beanie|버킷햇/
  const shoePattern = /신발|구두|운동화|슈즈|shoe|sneaker|boot|샌들/
  const scarfPattern = /스카프|머플러|scarf|muffler/

  if (earringPattern.test(name))
    return { part: '귀 주변', shot: '클로즈업', crop: '얼굴 측면 포커스' }
  if (necklacePattern.test(name))
    return { part: '목/쇄골', shot: '미디엄 클로즈업', crop: '상반신 상부' }
  if (braceletPattern.test(name))
    return { part: '손목', shot: '클로즈업', crop: '손목~손 포커스' }
  if (ringPattern.test(name))
    return { part: '손가락', shot: '매크로', crop: '손 클로즈업' }
  if (glassesPattern.test(name))
    return { part: '얼굴', shot: '미디엄', crop: '얼굴 정면' }
  if (beltPattern.test(name))
    return { part: '허리', shot: '미디엄', crop: '상반신~허리' }
  if (sockPattern.test(name))
    return { part: '발목~발', shot: '미디엄', crop: '하반신 하부' }
  if (bagPattern.test(name))
    return { part: '어깨/손', shot: '미디엄', crop: '상반신 + 가방 강조' }
  if (hatPattern.test(name))
    return { part: '머리', shot: '미디엄', crop: '상반신 상부' }
  if (shoePattern.test(name))
    return { part: '발', shot: '미디엄 로우앵글', crop: '하반신' }
  if (scarfPattern.test(name))
    return { part: '목/어깨', shot: '미디엄', crop: '상반신' }

  const catLower = (category || '').toLowerCase()
  if (/상의|티셔츠|셔츠|블라우스|니트|탑/.test(catLower))
    return { part: '상체', shot: '미디엄', crop: '상반신' }
  if (/하의|팬츠|바지|스커트|치마/.test(catLower))
    return { part: '하체', shot: '미디엄', crop: '전신 하반신 강조' }
  if (/원피스|드레스/.test(catLower))
    return { part: '전신', shot: '풀샷', crop: '전신' }
  if (/아우터|자켓|코트/.test(catLower))
    return { part: '전신', shot: '풀샷', crop: '전신' }

  return { part: '전신', shot: '풀샷', crop: '전신' }
}

export async function generateModelImage(
  req: AIModelImageRequest,
): Promise<string> {
  const apiKey = getApiKey()
  const focus = getCameraFocus(req.category, req.productName)
  const genderKo = req.gender === 'male' ? '남성' : '여성'

  const prompt = `Generate a photorealistic studio photograph of a Korean ${req.gender} model wearing/using "${req.productName}".

Camera: ${focus.shot} shot focusing on ${focus.part}
Crop: ${focus.crop}
Model: Korean ${genderKo}, natural pose, editorial style
Background: clean white or light gray studio
Lighting: professional studio, soft shadows
Style: high-end fashion e-commerce product photo

The product must be the clear focal point. No text, watermark, or logo.
Must look like a real photograph, not AI-generated.`

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [{ text: prompt }]

  for (const img of req.images.slice(0, 5)) {
    const base64 = img.replace(/^data:image\/\w+;base64,/, '')
    parts.push({
      inlineData: { mimeType: 'image/jpeg', data: base64 },
    })
  }

  const body = {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      responseModalities: ['IMAGE', 'TEXT'],
    },
  }

  const res = await fetch(
    `${GEMINI_BASE}/gemini-2.5-flash-preview-image-generation:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini Image API 오류: ${res.status} ${err}`)
  }

  const data = await res.json()
  const responseParts = data.candidates?.[0]?.content?.parts || []
  const imagePart = responseParts.find(
    (p: { inlineData?: { mimeType: string; data: string } }) => p.inlineData?.mimeType?.startsWith('image/'),
  )

  if (!imagePart?.inlineData) {
    throw new Error('AI 모델 이미지 생성에 실패했습니다.')
  }

  return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`
}
