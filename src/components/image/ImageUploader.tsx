'use client'

import { useRef } from 'react'
import { useImageUpload } from '@/hooks/useImageUpload'

export default function ImageUploader() {
  const inputRef = useRef<HTMLInputElement>(null)
  const { handleFiles, handleDrop, handleDragOver } = useImageUpload()

  return (
    <div
      className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-accent/50 transition-colors"
      onClick={() => inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
      <div className="text-muted">
        <p className="text-lg font-medium mb-1">상품 이미지 업로드</p>
        <p className="text-sm">
          클릭하거나 드래그하여 이미지를 추가하세요 (최대 10장, 800px 자동 압축)
        </p>
      </div>
    </div>
  )
}
