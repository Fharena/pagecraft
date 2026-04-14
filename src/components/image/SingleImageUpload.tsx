'use client'

import { useRef } from 'react'
/** 원본 File → dataURL 변환 (압축 없음) */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

interface SingleImageUploadProps {
  label: string
  icon?: string
  description?: string
  imageData: string | null
  onImageChange: (dataUrl: string | null) => void
}

export default function SingleImageUpload({
  label,
  icon = '📁',
  description,
  imageData,
  onImageChange,
}: SingleImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    const dataUrl = await fileToDataUrl(file)
    onImageChange(dataUrl)
  }

  return (
    <div>
      {!imageData ? (
        <div
          style={{
            border: '1.5px dashed var(--border2)',
            borderRadius: 12,
            padding: '40px 14px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            position: 'relative',
            overflow: 'hidden',
          }}
          onClick={() => inputRef.current?.click()}
          onDrop={(e) => {
            e.preventDefault()
            const file = e.dataTransfer.files?.[0]
            if (file) handleFile(file)
            const el = e.currentTarget as HTMLDivElement
            el.style.borderColor = 'var(--border2)'
            el.style.background = 'transparent'
          }}
          onDragOver={(e) => {
            e.preventDefault()
            const el = e.currentTarget as HTMLDivElement
            el.style.borderColor = 'var(--accent)'
            el.style.background = 'var(--accent-dim)'
          }}
          onDragLeave={(e) => {
            const el = e.currentTarget as HTMLDivElement
            el.style.borderColor = 'var(--border2)'
            el.style.background = 'transparent'
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLDivElement
            el.style.borderColor = 'var(--accent)'
            el.style.background = 'var(--accent-dim)'
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLDivElement
            el.style.borderColor = 'var(--border2)'
            el.style.background = 'transparent'
          }}
        >
          <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
          <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--text)' }}>{label}</h4>
          {description && (
            <p style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.5 }}>
              {description.split('\n').map((line, i) => (
                <span key={i}>{line}{i < description.split('\n').length - 1 && <br />}</span>
              ))}
            </p>
          )}
        </div>
      ) : (
        <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageData} alt={label} style={{ width: '100%', display: 'block' }} />
          <button
            style={{
              position: 'absolute', top: 6, right: 6,
              background: 'rgba(0,0,0,0.75)', color: '#fff', border: 'none',
              borderRadius: '50%', width: 24, height: 24,
              cursor: 'pointer', fontSize: 12, lineHeight: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onClick={() => onImageChange(null)}
          >
            ✕
          </button>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
    </div>
  )
}
