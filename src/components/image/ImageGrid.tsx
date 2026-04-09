'use client'

import { useState, useCallback } from 'react'
import { useImageStore } from '@/stores/imageStore'

export default function ImageGrid() {
  const { images, removeImage, reorderImages } = useImageStore()
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [previewIdx, setPreviewIdx] = useState<number | null>(null)

  const handleDragStart = useCallback((idx: number) => {
    setDragIdx(idx)
  }, [])

  const handleDragOver = useCallback(
    (e: React.DragEvent, idx: number) => {
      e.preventDefault()
      if (dragIdx !== null && dragIdx !== idx) {
        reorderImages(dragIdx, idx)
        setDragIdx(idx)
      }
    },
    [dragIdx, reorderImages],
  )

  if (images.length === 0) return null

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {images.map((img, idx) => (
          <div
            key={img.id}
            className="relative aspect-square rounded-lg overflow-hidden border border-border group cursor-grab active:cursor-grabbing"
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragEnd={() => setDragIdx(null)}
            onClick={() => setPreviewIdx(idx)}
          >
            <img
              src={img.dataUrl}
              alt={`상품 이미지 ${idx + 1}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
              {idx + 1}
            </div>
            {img.bgRemoved && (
              <div className="absolute top-1 right-8 bg-green-500/80 text-white text-xs px-1.5 py-0.5 rounded">
                BG
              </div>
            )}
            <button
              className="absolute top-1 right-1 bg-red-500/80 text-white text-xs w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                removeImage(img.id)
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Preview modal */}
      {previewIdx !== null && images[previewIdx] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setPreviewIdx(null)}
        >
          <img
            src={images[previewIdx].dataUrl}
            alt="미리보기"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
          />
        </div>
      )}
    </>
  )
}
