'use client'

import { useImageStore } from '@/stores/imageStore'
import { useProductStore } from '@/stores/productStore'
import { useEditorStore } from '@/stores/editorStore'

export default function StatusBar() {
  const { images } = useImageStore()
  const { product } = useProductStore()
  const { isGenerating, isRenderingPng, loadingMessage } = useEditorStore()

  const isLoading = isGenerating || isRenderingPng
  const statusColor = isLoading
    ? 'bg-yellow-400'
    : images.length > 0
      ? 'bg-green'
      : 'bg-muted'

  return (
    <footer className="h-7 bg-surface border-t border-border flex items-center justify-between px-4 text-[11px] text-muted shrink-0 z-50">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />
          {isLoading ? (
            <span>{loadingMessage || '처리 중...'}</span>
          ) : (
            <span>사진 {images.length}장</span>
          )}
        </div>
        <span>플랫폼: {product.platform || '쿠팡'}</span>
      </div>
      <span>PageCraft Pro v2.0</span>
    </footer>
  )
}
