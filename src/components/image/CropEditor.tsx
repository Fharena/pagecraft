'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { useImageStore } from '@/stores/imageStore'
import { showToast } from '@/components/ui/Toast'
import Button from '@/components/ui/Button'

interface CropEditorProps {
  imageData: string
  imageId: string
  onClose: () => void
}

interface CropBox {
  x: number
  y: number
  w: number
  h: number
}

export default function CropEditor({ imageData, imageId, onClose }: CropEditorProps) {
  const { updateImage } = useImageStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const [crop, setCrop] = useState<CropBox>({ x: 0, y: 0, w: 0, h: 0 })
  const [dragging, setDragging] = useState<{ type: string; startX: number; startY: number; origCrop: CropBox } | null>(null)
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const img = imgRef.current
    if (!img) return
    const onLoad = () => {
      const rect = img.getBoundingClientRect()
      setImgSize({ w: rect.width, h: rect.height })
      const margin = 0.1
      setCrop({
        x: rect.width * margin,
        y: rect.height * margin,
        w: rect.width * (1 - 2 * margin),
        h: rect.height * (1 - 2 * margin),
      })
    }
    if (img.complete) onLoad()
    else img.onload = onLoad
  }, [imageData])

  const clamp = useCallback((val: number, min: number, max: number) => Math.max(min, Math.min(max, val)), [])

  const handleMouseDown = useCallback((e: React.MouseEvent, type: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging({ type, startX: e.clientX, startY: e.clientY, origCrop: { ...crop } })
  }, [crop])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return
    const dx = e.clientX - dragging.startX
    const dy = e.clientY - dragging.startY
    const { origCrop } = dragging
    const MIN = 30

    if (dragging.type === 'move') {
      setCrop({
        ...origCrop,
        x: clamp(origCrop.x + dx, 0, imgSize.w - origCrop.w),
        y: clamp(origCrop.y + dy, 0, imgSize.h - origCrop.h),
      })
    } else if (dragging.type === 'se') {
      setCrop({
        ...origCrop,
        w: clamp(origCrop.w + dx, MIN, imgSize.w - origCrop.x),
        h: clamp(origCrop.h + dy, MIN, imgSize.h - origCrop.y),
      })
    } else if (dragging.type === 'sw') {
      const newW = clamp(origCrop.w - dx, MIN, origCrop.x + origCrop.w)
      setCrop({
        ...origCrop,
        x: origCrop.x + origCrop.w - newW,
        w: newW,
        h: clamp(origCrop.h + dy, MIN, imgSize.h - origCrop.y),
      })
    } else if (dragging.type === 'ne') {
      const newH = clamp(origCrop.h - dy, MIN, origCrop.y + origCrop.h)
      setCrop({
        ...origCrop,
        y: origCrop.y + origCrop.h - newH,
        w: clamp(origCrop.w + dx, MIN, imgSize.w - origCrop.x),
        h: newH,
      })
    } else if (dragging.type === 'nw') {
      const newW = clamp(origCrop.w - dx, MIN, origCrop.x + origCrop.w)
      const newH = clamp(origCrop.h - dy, MIN, origCrop.y + origCrop.h)
      setCrop({
        x: origCrop.x + origCrop.w - newW,
        y: origCrop.y + origCrop.h - newH,
        w: newW,
        h: newH,
      })
    }
  }, [dragging, imgSize, clamp])

  const handleMouseUp = useCallback(() => {
    setDragging(null)
  }, [])

  const applyCrop = () => {
    const img = imgRef.current
    if (!img) return

    const scaleX = img.naturalWidth / imgSize.w
    const scaleY = img.naturalHeight / imgSize.h

    const canvas = document.createElement('canvas')
    const sx = crop.x * scaleX
    const sy = crop.y * scaleY
    const sw = crop.w * scaleX
    const sh = crop.h * scaleY
    canvas.width = sw
    canvas.height = sh
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    updateImage(imageId, { dataUrl, bgRemoved: false })
    showToast('이미지가 잘렸습니다')
    onClose()
  }

  const handleSize = 12

  return (
    <div className="select-none">
      {/* 이미지 + 오버레이 영역 — 버튼과 분리해서 overlay가 버튼을 덮지 않도록 */}
      <div
        ref={containerRef}
        className="relative"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          ref={imgRef}
          src={imageData}
          alt="크롭 대상"
          className="w-full rounded-lg block"
          draggable={false}
        />

        {/* Dimming overlay */}
        {imgSize.w > 0 && (
          <>
            <div className="absolute inset-0 bg-black/50 rounded-lg pointer-events-none" style={{ clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${crop.x}px ${crop.y}px, ${crop.x}px ${crop.y + crop.h}px, ${crop.x + crop.w}px ${crop.y + crop.h}px, ${crop.x + crop.w}px ${crop.y}px, ${crop.x}px ${crop.y}px)` }} />

            {/* Crop box border */}
            <div
              className="absolute border-2 border-white/80 cursor-move"
              style={{ left: crop.x, top: crop.y, width: crop.w, height: crop.h }}
              onMouseDown={(e) => handleMouseDown(e, 'move')}
            >
              {/* Corner handles */}
              {(['nw', 'ne', 'sw', 'se'] as const).map((corner) => (
                <div
                  key={corner}
                  className="absolute bg-white border border-border2 z-10"
                  style={{
                    width: handleSize, height: handleSize,
                    cursor: `${corner}-resize`,
                    ...(corner.includes('n') ? { top: -handleSize / 2 } : { bottom: -handleSize / 2 }),
                    ...(corner.includes('w') ? { left: -handleSize / 2 } : { right: -handleSize / 2 }),
                  }}
                  onMouseDown={(e) => handleMouseDown(e, corner)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex gap-2 mt-4 justify-end">
        <Button variant="secondary" onClick={onClose}>취소</Button>
        <Button onClick={applyCrop}>적용</Button>
      </div>
    </div>
  )
}
