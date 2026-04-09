'use client'

import { useRef } from 'react'
import { compressImage } from '@/lib/image'

interface SingleImageUploadProps {
  label: string
  imageData: string | null
  onImageChange: (dataUrl: string | null) => void
}

export default function SingleImageUpload({
  label,
  imageData,
  onImageChange,
}: SingleImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    const compressed = await compressImage(file)
    onImageChange(compressed)
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted">{label}</p>
      {imageData ? (
        <div className="relative">
          <img
            src={imageData}
            alt={label}
            className="w-full rounded-lg border border-border"
          />
          <button
            className="absolute top-2 right-2 bg-red-500/80 text-white text-xs px-2 py-1 rounded cursor-pointer hover:bg-red-600"
            onClick={() => onImageChange(null)}
          >
            삭제
          </button>
        </div>
      ) : (
        <div
          className="border border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-accent/50 transition-colors text-sm text-muted"
          onClick={() => inputRef.current?.click()}
        >
          클릭하여 업로드
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
    </div>
  )
}
