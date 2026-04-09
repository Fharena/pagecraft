'use client'

import { useImageStore } from '@/stores/imageStore'
import { useEditorStore } from '@/stores/editorStore'

export default function StatusBar() {
  const { images } = useImageStore()
  const { isGenerating, isRenderingPng, loadingMessage } = useEditorStore()

  const isLoading = isGenerating || isRenderingPng
  const statusColor = isLoading
    ? 'bg-yellow-400'
    : images.length > 0
      ? 'bg-green-400'
      : 'bg-muted'

  return (
    <footer className="h-8 bg-surface border-t border-border flex items-center px-4 text-xs text-muted">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${statusColor}`} />
        {isLoading ? (
          <span>{loadingMessage || '처리 중...'}</span>
        ) : (
          <span>이미지 {images.length}장</span>
        )}
      </div>
    </footer>
  )
}
