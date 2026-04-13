'use client'

import { useRef } from 'react'
import { useImageUpload } from '@/hooks/useImageUpload'

export default function ImageUploader() {
  const inputRef = useRef<HTMLInputElement>(null)
  const { handleFiles, handleDrop, handleDragOver } = useImageUpload()

  return (
    <div
      className="border-[1.5px] border-dashed border-border2 rounded-xl py-[70px] px-[14px] text-center cursor-pointer hover:border-accent transition-all duration-200 relative"
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
      <div className="text-text3">
        <p className="text-2xl mb-2">📷</p>
        <p className="text-[11px] font-medium">사진 업로드</p>
        <p className="text-[11px] text-text3 mt-0.5">클릭하거나 드래그</p>
        <p className="text-[11px] text-text3">JPG · PNG · 최대 10장</p>
      </div>
    </div>
  )
}
