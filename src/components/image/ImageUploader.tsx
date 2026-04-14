'use client'

import { useRef } from 'react'
import { useImageUpload } from '@/hooks/useImageUpload'
import { useImageStore } from '@/stores/imageStore'

export default function ImageUploader() {
  const inputRef = useRef<HTMLInputElement>(null)
  const { handleFiles, handleDrop, handleDragOver } = useImageUpload()
  const { images } = useImageStore()

  return (
    <div
      className="border-[1.5px] border-dashed border-border2 rounded-xl py-[70px] px-[14px] text-center cursor-pointer hover:border-accent hover:bg-accent-dim transition-all duration-200 relative"
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
      <p className="text-2xl mb-2">📷</p>
      <p className="text-[13px] font-semibold text-text mb-[4px]">사진 업로드</p>
      <p className="text-[11px] text-text2 leading-[1.5]">
        클릭하거나 드래그<br />
        JPG · PNG · {images.length > 0 ? `${images.length}/10장` : '최대 10장'}
      </p>
    </div>
  )
}
