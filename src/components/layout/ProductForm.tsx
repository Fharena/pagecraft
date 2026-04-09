'use client'

import { useProductStore } from '@/stores/productStore'
import Input from '@/components/ui/Input'

const CATEGORIES = [
  '패션의류', '패션잡화', '뷰티', '식품', '생활용품',
  '가전디지털', '스포츠', '유아동', '반려동물', '기타',
]

const FEATURES = [
  '프리미엄', '가성비', '트렌디', '핸드메이드', '친환경', '국내산',
  '수입', '한정판', '시즌상품', '베스트셀러', '신상품', '묶음할인',
]

export default function ProductForm() {
  const { product, setProduct } = useProductStore()

  const toggleFeature = (feature: string) => {
    const features = product.features.includes(feature)
      ? product.features.filter((f) => f !== feature)
      : [...product.features, feature]
    setProduct({ features })
  }

  return (
    <div className="space-y-4">
      <Input label="브랜드" id="brand" placeholder="예: 내셔널 지오그래픽" value={product.brand} onChange={(e) => setProduct({ brand: e.target.value })} />
      <Input label="상품명" id="pname" placeholder="예: 슬라이드 슬리퍼 남녀공용" value={product.name} onChange={(e) => setProduct({ name: e.target.value })} />
      <Input label="가격" id="price" placeholder="예: 39,900" value={product.price} onChange={(e) => setProduct({ price: e.target.value })} />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-muted">카테고리</label>
        <select
          className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text focus:outline-none focus:ring-2 focus:ring-accent/50"
          value={product.category}
          onChange={(e) => setProduct({ category: e.target.value })}
        >
          <option value="">선택하세요</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
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

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-muted">특징</label>
        <div className="flex flex-wrap gap-1.5">
          {FEATURES.map((feat) => (
            <button
              key={feat}
              className={`px-2.5 py-1 rounded-full text-xs cursor-pointer transition-colors ${
                product.features.includes(feat)
                  ? 'bg-accent text-black'
                  : 'bg-surface border border-border text-muted hover:border-accent/50'
              }`}
              onClick={() => toggleFeature(feat)}
            >
              {feat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="memo" className="text-sm text-muted">메모 (선택)</label>
        <textarea
          id="memo"
          className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
          rows={3}
          placeholder="색상, 소재, 특징 등 AI에게 전달할 추가 정보"
          value={product.memo}
          onChange={(e) => setProduct({ memo: e.target.value })}
        />
      </div>
    </div>
  )
}
