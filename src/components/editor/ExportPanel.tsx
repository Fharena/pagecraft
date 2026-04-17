'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useEditorStore } from '@/stores/editorStore'
import { useImageStore } from '@/stores/imageStore'
import { useProductStore } from '@/stores/productStore'
import { showToast } from '@/components/ui/Toast'

/** 1000x1000 썸네일 크롭 편집기 */
function ThumbnailEditor() {
  const { images, thumbnailImageId, thumbnailDataUrl, setThumbnailDataUrl } = useImageStore()
  const sourceImage = images.find((img) => img.id === thumbnailImageId)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // 이미지 로드
  useEffect(() => {
    if (!sourceImage) return
    const img = new Image()
    img.onload = () => {
      setImgEl(img)
      // 초기 오프셋: 중앙 맞춤
      const scale = Math.max(1000 / img.width, 1000 / img.height)
      const sw = img.width * scale
      const sh = img.height * scale
      setOffset({ x: (1000 - sw) / 2, y: (1000 - sh) / 2 })
    }
    img.src = sourceImage.dataUrl
  }, [sourceImage])

  // 캔버스 그리기
  const draw = useCallback(() => {
    if (!canvasRef.current || !imgEl) return
    const ctx = canvasRef.current.getContext('2d')!
    const scale = Math.max(1000 / imgEl.width, 1000 / imgEl.height)
    const sw = imgEl.width * scale
    const sh = imgEl.height * scale
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 1000, 1000)
    ctx.drawImage(imgEl, offset.x, offset.y, sw, sh)
  }, [imgEl, offset])

  useEffect(() => { draw() }, [draw])

  // 드래그로 위치 조절
  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true)
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
  }
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }
  const handleMouseUp = () => setDragging(false)

  // 썸네일 저장 (dataUrl로)
  const saveThumbnail = () => {
    if (!canvasRef.current) return
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.92)
    setThumbnailDataUrl(dataUrl)
    showToast('썸네일이 생성되었습니다')
  }

  // 다운로드
  const downloadThumbnail = () => {
    const src = thumbnailDataUrl
    if (!src) return
    const { generatedContent } = useEditorStore.getState()
    const { product } = useProductStore.getState()
    const name = (generatedContent?.product_name || product.name || '상품')
      .replace(/[/\\?%*:|"<>]/g, '')
    const a = document.createElement('a')
    a.href = src
    a.download = `${name}_1000x1000.jpg`
    a.click()
    showToast('썸네일 다운로드 시작')
  }

  if (!sourceImage) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text3)', fontSize: 12 }}>
        이미지 그리드에서 📌 버튼으로<br />썸네일 이미지를 선택하세요
      </div>
    )
  }

  return (
    <div>
      {/* 크롭 미리보기 */}
      <div
        style={{ width: '100%', aspectRatio: '1', overflow: 'hidden', borderRadius: 8, border: '1px solid var(--border)', cursor: 'grab', position: 'relative', background: '#fff' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <canvas
          ref={canvasRef}
          width={1000}
          height={1000}
          style={{ width: '100%', height: '100%' }}
        />
        {/* 가이드 */}
        <div style={{ position: 'absolute', inset: 0, border: '2px dashed var(--accent)', borderRadius: 8, pointerEvents: 'none', opacity: 0.4 }} />
      </div>
      <p style={{ fontSize: 10, color: 'var(--text3)', textAlign: 'center', marginTop: 6 }}>
        드래그하여 위치 조절 · 1000×1000px
      </p>

      {/* 버튼 */}
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <button
          onClick={saveThumbnail}
          style={{ flex: 1, padding: '8px', borderRadius: 7, fontSize: 11, fontWeight: 700, background: 'var(--accent)', border: 'none', color: '#0c0c10', cursor: 'pointer' }}
        >
          ✓ 썸네일 확정
        </button>
        {thumbnailDataUrl && (
          <button
            onClick={downloadThumbnail}
            style={{ flex: 1, padding: '8px', borderRadius: 7, fontSize: 11, fontWeight: 700, background: 'var(--green)', border: 'none', color: '#fff', cursor: 'pointer' }}
          >
            ⬇ 다운로드
          </button>
        )}
      </div>

      {/* 확정된 썸네일 미리보기 */}
      {thumbnailDataUrl && (
        <div style={{ marginTop: 10 }}>
          <p style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>확정된 썸네일</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumbnailDataUrl} alt="썸네일" style={{ width: '100%', borderRadius: 6, border: '1px solid var(--border)' }} />
        </div>
      )}
    </div>
  )
}

export default function ExportPanel() {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold text-text3 uppercase tracking-[2px] mb-[14px]">썸네일 (1000×1000)</p>
      <ThumbnailEditor />
    </div>
  )
}
