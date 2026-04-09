'use client'

import { useState, useCallback } from 'react'
import { useImageStore } from '@/stores/imageStore'
import Modal from '@/components/ui/Modal'
import CropEditor from '@/components/image/CropEditor'

export default function ImageGrid() {
  const { images, removeImage, reorderImages } = useImageStore()
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [previewIdx, setPreviewIdx] = useState<number | null>(null)
  const [cropIdx, setCropIdx] = useState<number | null>(null)

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
      <div className="grid grid-cols-3 gap-1.5">
        {images.map((img, idx) => (
          <div
            key={img.id}
            className={`relative aspect-square rounded-lg overflow-hidden border group cursor-grab active:cursor-grabbing transition-all ${
              dragIdx === idx ? 'border-accent opacity-50' : 'border-border'
            }`}
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

            {/* Index badge */}
            <div className="absolute top-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
              {idx + 1}
            </div>

            {/* BG removed badge */}
            {img.bgRemoved && (
              <div className="absolute top-1 left-7 bg-green/80 text-white text-[9px] px-1 py-0.5 rounded">
                ✓
              </div>
            )}

            {/* Crop button */}
            <button
              className="absolute bottom-1 right-7 bg-black/60 text-white text-[10px] w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-black/80"
              onClick={(e) => {
                e.stopPropagation()
                setCropIdx(idx)
              }}
              title="자르기"
            >
              ✂
            </button>

            {/* Delete button */}
            <button
              className="absolute top-1 right-1 bg-red-500/80 text-white text-[10px] w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-red-600"
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
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70"
          onClick={() => setPreviewIdx(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl cursor-pointer"
            onClick={() => setPreviewIdx(null)}
          >
            ✕
          </button>
          <img
            src={images[previewIdx].dataUrl}
            alt="미리보기"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
          />
        </div>
      )}

      {/* Crop modal */}
      {cropIdx !== null && images[cropIdx] && (
        <Modal isOpen title="이미지 자르기" onClose={() => setCropIdx(null)}>
          <CropEditor
            imageData={images[cropIdx].dataUrl}
            imageId={images[cropIdx].id}
            onClose={() => setCropIdx(null)}
          />
        </Modal>
      )}
    </>
  )
}
