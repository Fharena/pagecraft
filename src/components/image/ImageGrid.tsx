'use client'

import { useState, useCallback, useEffect } from 'react'
import { useImageStore } from '@/stores/imageStore'
import Modal from '@/components/ui/Modal'
import CropEditor from '@/components/image/CropEditor'

export default function ImageGrid() {
  const {
    images, removeImage, reorderImages,
    thumbnailImageId, setThumbnailSource,
    bgRemoveEnabled, bgSelectedIds, toggleBgSelect,
  } = useImageStore()
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [previewIdx, setPreviewIdx] = useState<number | null>(null)
  const [cropIdx, setCropIdx] = useState<number | null>(null)

  // 뷰어 열려있을 때 키보드 방향키로 이동
  useEffect(() => {
    if (previewIdx === null) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setPreviewIdx((i) => (i !== null ? Math.max(0, i - 1) : null))
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        setPreviewIdx((i) => (i !== null ? Math.min(images.length - 1, i + 1) : null))
      } else if (e.key === 'Escape') {
        setPreviewIdx(null)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [previewIdx, images.length])

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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '6px', padding: '6px 18px 0' }}>
        {images.map((img, idx) => (
          <div
            key={img.id}
            style={{ position: 'relative', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', border: `1px solid ${dragIdx === idx ? 'var(--accent)' : 'var(--border)'}`, cursor: 'pointer', transition: 'border-color 0.15s', opacity: dragIdx === idx ? 0.4 : 1 }}
            className="group"
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragEnd={() => setDragIdx(null)}
            onClick={() => setPreviewIdx(idx)}
          >
            <img
              src={img.dataUrl}
              alt={`상품 이미지 ${idx + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />

            {/* 좌상단: 배경제거 체크박스 (토글 ON일 때) / 완료 뱃지 */}
            {bgRemoveEnabled && img.bgRemoved && (
              <div style={{ position: 'absolute', top: '3px', left: '3px', width: '18px', height: '18px', borderRadius: '4px', background: 'var(--green)', color: '#fff', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }} title="배경 제거 완료">
                ✓
              </div>
            )}
            {bgRemoveEnabled && !img.bgRemoved && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleBgSelect(img.id)
                }}
                title={bgSelectedIds.includes(img.id) ? '선택 해제' : '배경 제거 대상 선택'}
                style={{
                  position: 'absolute', top: '3px', left: '3px', width: '18px', height: '18px',
                  borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3,
                  background: bgSelectedIds.includes(img.id) ? 'var(--accent)' : 'rgba(255,255,255,0.9)',
                  color: bgSelectedIds.includes(img.id) ? '#0c0c10' : 'var(--text3)',
                  border: `1px solid ${bgSelectedIds.includes(img.id) ? 'var(--accent)' : 'var(--border2)'}`,
                  padding: 0,
                }}
              >
                {bgSelectedIds.includes(img.id) ? '✓' : ''}
              </button>
            )}

            {/* Thumbnail badge */}
            {thumbnailImageId === img.id && (
              <div style={{ position: 'absolute', bottom: '3px', left: '3px', padding: '1px 5px', borderRadius: '4px', background: 'var(--accent)', color: '#0c0c10', fontSize: '8px', fontWeight: 700, zIndex: 2 }}>
                썸네일
              </div>
            )}

            {/* Thumbnail set button */}
            <button
              style={{ position: 'absolute', bottom: '3px', left: thumbnailImageId === img.id ? '45px' : '3px', width: '18px', height: '18px', borderRadius: '4px', background: thumbnailImageId === img.id ? 'var(--accent)' : 'rgba(0,0,0,0.7)', border: 'none', color: thumbnailImageId === img.id ? '#0c0c10' : '#fff', fontSize: '10px', cursor: 'pointer', zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.15s' }}
              className={thumbnailImageId === img.id ? '' : 'opacity-0 group-hover:!opacity-100'}
              onClick={(e) => {
                e.stopPropagation()
                setThumbnailSource(thumbnailImageId === img.id ? null : img.id)
              }}
              title={thumbnailImageId === img.id ? '썸네일 해제' : '썸네일 지정'}
            >
              📌
            </button>

            {/* Crop button */}
            <button
              style={{ position: 'absolute', bottom: '3px', right: '3px', width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', fontSize: '10px', cursor: 'pointer', zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.15s' }}
              className="opacity-0 group-hover:!opacity-100"
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
              style={{ position: 'absolute', top: '3px', right: '3px', width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(0,0,0,0.75)', border: 'none', color: '#fff', fontSize: '10px', cursor: 'pointer', transition: 'opacity 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              className="opacity-0 group-hover:!opacity-100"
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
          style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          onClick={() => setPreviewIdx(null)}
        >
          {/* 상단: 카운터 + 다운로드 + 닫기 */}
          <div style={{ position: 'fixed', top: '20px', left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001, pointerEvents: 'none' }}>
            <span style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '20px', padding: '4px 14px', fontSize: '12px', color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--mono)' }}>
              {previewIdx + 1} / {images.length}
            </span>
          </div>

          <button
            style={{ position: 'fixed', top: '20px', right: '72px', height: '36px', padding: '0 16px', borderRadius: '18px', background: 'var(--accent)', border: 'none', color: '#0c0c10', fontSize: '13px', fontWeight: 700, cursor: 'pointer', zIndex: 10001, display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={(e) => {
              e.stopPropagation()
              const img = images[previewIdx]
              if (!img) return
              const a = document.createElement('a')
              a.href = img.dataUrl
              const mime = img.dataUrl.match(/^data:image\/(\w+);/)?.[1] || 'png'
              a.download = `상품이미지_${previewIdx + 1}.${mime === 'jpeg' ? 'jpg' : mime}`
              a.click()
            }}
          >
            ⬇ 다운로드
          </button>

          <button
            style={{ position: 'fixed', top: '20px', right: '24px', width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer', zIndex: 10001 }}
            onClick={() => setPreviewIdx(null)}
          >
            ✕
          </button>

          {/* 이전 버튼 */}
          {previewIdx > 0 && (
            <button
              style={{ position: 'fixed', left: '20px', top: '50%', transform: 'translateY(-50%)', width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: '22px', cursor: 'pointer', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s', backdropFilter: 'blur(4px)' }}
              onClick={(e) => { e.stopPropagation(); setPreviewIdx(previewIdx - 1) }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.28)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
              title="이전 이미지 (←)"
            >
              ‹
            </button>
          )}

          {/* 다음 버튼 */}
          {previewIdx < images.length - 1 && (
            <button
              style={{ position: 'fixed', right: '20px', top: '50%', transform: 'translateY(-50%)', width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: '22px', cursor: 'pointer', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s', backdropFilter: 'blur(4px)' }}
              onClick={(e) => { e.stopPropagation(); setPreviewIdx(previewIdx + 1) }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.28)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
              title="다음 이미지 (→)"
            >
              ›
            </button>
          )}

          <img
            src={images[previewIdx].dataUrl}
            alt="미리보기"
            style={{ maxWidth: '80vw', maxHeight: '90vh', borderRadius: '12px', boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }}
            onClick={(e) => e.stopPropagation()}
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
