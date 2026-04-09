'use client'

import { useProductStore } from '@/stores/productStore'
import { useImageStore } from '@/stores/imageStore'
import Input from '@/components/ui/Input'

const CATEGORIES = [
  '패션의류',
  '패션잡화',
  '뷰티',
  '식품',
  '생활용품',
  '가전디지털',
  '스포츠',
  '유아동',
  '반려동물',
  '기타',
]

const FEATURES = [
  '프리미엄',
  '가성비',
  '트렌디',
  '핸드메이드',
  '친환경',
  '국내산',
  '수입',
  '한정판',
  '시즌상품',
  '베스트셀러',
  '신상품',
  '묶음할인',
]

export default function ProductForm() {
  const { product, setProduct } = useProductStore()
  const { aiModelEnabled, aiModelGender, setAiModelEnabled, setAiModelGender } =
    useImageStore()

  const toggleFeature = (feature: string) => {
    const features = product.features.includes(feature)
      ? product.features.filter((f) => f !== feature)
      : [...product.features, feature]
    setProduct({ features })
  }

  return (
    <div className="space-y-4">
      <Input
        label="브랜드"
        id="brand"
        placeholder="브랜드명"
        value={product.brand}
        onChange={(e) => setProduct({ brand: e.target.value })}
      />

      <Input
        label="상품명"
        id="pname"
        placeholder="상품명을 입력하세요"
        value={product.name}
        onChange={(e) => setProduct({ name: e.target.value })}
      />

      <Input
        label="가격 (원)"
        id="price"
        type="number"
        placeholder="29900"
        value={product.price}
        onChange={(e) => setProduct({ price: e.target.value })}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-muted">카테고리</label>
        <select
          className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text focus:outline-none focus:ring-2 focus:ring-accent/50"
          value={product.category}
          onChange={(e) => setProduct({ category: e.target.value })}
        >
          <option value="">선택하세요</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-muted">판매 플랫폼</label>
        <select
          className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text focus:outline-none focus:ring-2 focus:ring-accent/50"
          value={product.platform}
          onChange={(e) => setProduct({ platform: e.target.value })}
        >
          <option value="쿠팡">쿠팡</option>
          <option value="네이버 스마트스토어">네이버 스마트스토어</option>
          <option value="11번가">11번가</option>
          <option value="G마켓">G마켓</option>
        </select>
      </div>

      {/* Features */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-muted">특징</label>
        <div className="flex flex-wrap gap-1.5">
          {FEATURES.map((feat) => (
            <button
              key={feat}
              className={`
                px-2.5 py-1 rounded-full text-xs cursor-pointer transition-colors
                ${
                  product.features.includes(feat)
                    ? 'bg-accent text-black'
                    : 'bg-surface border border-border text-muted hover:border-accent/50'
                }
              `}
              onClick={() => toggleFeature(feat)}
            >
              {feat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="memo" className="text-sm text-muted">
          메모 (선택)
        </label>
        <textarea
          id="memo"
          className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
          rows={3}
          placeholder="AI에게 전달할 추가 정보"
          value={product.memo}
          onChange={(e) => setProduct({ memo: e.target.value })}
        />
      </div>

      {/* AI Model toggle */}
      <div className="border border-border rounded-lg p-3 space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={aiModelEnabled}
            onChange={(e) => setAiModelEnabled(e.target.checked)}
            className="accent-accent"
          />
          <span className="text-sm text-text">AI 모델 이미지 생성</span>
        </label>
        {aiModelEnabled && (
          <div className="flex gap-2 ml-6">
            <button
              className={`px-3 py-1 rounded text-xs cursor-pointer ${aiModelGender === 'female' ? 'bg-accent text-black' : 'bg-surface border border-border text-muted'}`}
              onClick={() => setAiModelGender('female')}
            >
              여성
            </button>
            <button
              className={`px-3 py-1 rounded text-xs cursor-pointer ${aiModelGender === 'male' ? 'bg-accent text-black' : 'bg-surface border border-border text-muted'}`}
              onClick={() => setAiModelGender('male')}
            >
              남성
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
