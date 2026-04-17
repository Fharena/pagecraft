'use client'

import { useProductStore } from '@/stores/productStore'

const CATEGORIES = [
  '패딩/점퍼', '집업/후리스', '티셔츠/맨투맨', '바지/하의', '가방/배낭',
  '모자/액세서리', '신발/부츠', '슬리퍼/샌들', '스카프/머플러', '기타 의류/잡화',
]

export default function ProductForm() {
  const { product, setProduct } = useProductStore()

  return (
    <div>
      {/* Brand */}
      <div className="field-group">
        <div className="flex items-center gap-[5px] text-[11px] font-medium text-text2 mb-[6px]">
          <span className="w-[5px] h-[5px] rounded-full bg-accent opacity-70" />브랜드명
        </div>
        <input className="w-full bg-surface2 border border-border rounded-lg px-[11px] py-2 text-[12.5px] text-text font-sans placeholder:text-text3 focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-dim)] transition-[border-color,box-shadow] duration-150 appearance-none" placeholder="예: 내셔널 지오그래픽" value={product.brand} onChange={(e) => setProduct({ brand: e.target.value })} />
      </div>

      {/* Product Name */}
      <div className="field-group">
        <div className="flex items-center gap-[5px] text-[11px] font-medium text-text2 mb-[6px]">
          <span className="w-[5px] h-[5px] rounded-full bg-accent opacity-70" />상품명
        </div>
        <input className="w-full bg-surface2 border border-border rounded-lg px-[11px] py-2 text-[12.5px] text-text font-sans placeholder:text-text3 focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-dim)] transition-[border-color,box-shadow] duration-150 appearance-none" placeholder="예: 슬라이드 슬리퍼 남녀공용" value={product.name} onChange={(e) => setProduct({ name: e.target.value })} />
      </div>

      {/* Category */}
      <div className="field-group">
        <div className="flex items-center gap-[5px] text-[11px] font-medium text-text2 mb-[6px]">
          <span className="w-[5px] h-[5px] rounded-full bg-accent opacity-70" />카테고리
        </div>
        <select className="w-full bg-surface2 border border-border rounded-lg px-[11px] py-2 text-[12.5px] text-text font-sans appearance-none focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-dim)] transition-[border-color,box-shadow] duration-150" value={product.category} onChange={(e) => setProduct({ category: e.target.value })}>
          {CATEGORIES.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
        </select>
      </div>

      {/* Platform */}
      <div className="field-group">
        <div className="flex items-center gap-[5px] text-[11px] font-medium text-text2 mb-[6px]">
          <span className="w-[5px] h-[5px] rounded-full bg-accent opacity-70" />플랫폼
        </div>
        <select className="w-full bg-surface2 border border-border rounded-lg px-[11px] py-2 text-[12.5px] text-text font-sans appearance-none focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-dim)] transition-[border-color,box-shadow] duration-150" value={product.platform} onChange={(e) => setProduct({ platform: e.target.value })}>
          <option value="쿠팡">쿠팡</option>
          <option value="스마트스토어">스마트스토어</option>
          <option value="쿠팡+스마트스토어">쿠팡+스마트스토어</option>
          <option value="기타">기타</option>
        </select>
      </div>

      {/* Memo */}
      <div className="field-group">
        <div className="flex items-center gap-[5px] text-[11px] font-medium text-text2 mb-[6px]">
          <span className="w-[5px] h-[5px] rounded-full bg-accent opacity-70" />추가 설명 (선택)
        </div>
        <textarea
          className="w-full bg-surface2 border border-border rounded-lg px-[11px] py-2 text-[12.5px] text-text font-sans placeholder:text-text3 focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-dim)] transition-[border-color,box-shadow] duration-150 resize-y min-h-[68px] leading-[1.6]"
          rows={3}
          placeholder="색상, 소재, 특징, 타깃 고객 등 자유롭게 입력"
          value={product.memo}
          onChange={(e) => setProduct({ memo: e.target.value })}
        />
      </div>
    </div>
  )
}
