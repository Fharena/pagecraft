'use client'

import { useImageStore } from '@/stores/imageStore'
import { useProductStore } from '@/stores/productStore'

export default function StatusBar() {
  const { images } = useImageStore()
  const { product } = useProductStore()

  return (
    <footer
      style={{
        height: '26px',
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 18px',
        gap: '16px',
        fontSize: '10px',
        color: 'var(--text3)',
        fontFamily: 'var(--mono)',
        flexShrink: 0,
        zIndex: 100,
      }}
    >
      {/* Ready dot + label */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'var(--green)',
            marginRight: '5px',
            display: 'inline-block',
          }}
        />
        <span>Ready</span>
      </div>

      {/* Image count */}
      <span>사진 {images.length}장</span>

      {/* Platform */}
      <span>플랫폼: {product.platform || '쿠팡'}</span>

      {/* Version — pushed to right */}
      <span style={{ marginLeft: 'auto' }}>PageCraft Pro v2.0</span>
    </footer>
  )
}
