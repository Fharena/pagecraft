'use client'

import { useCallback } from 'react'
import { useImageStore } from '@/stores/imageStore'
import { useBgRemoval } from '@/hooks/useBgRemoval'
import { showToast } from '@/components/ui/Toast'

export default function BgRemovalToggle() {
  const {
    bgRemoveEnabled, setBgRemoveEnabled,
    images, updateImage,
    bgSelectedIds, selectAllForBg, deselectAllForBg,
  } = useImageStore()
  const { isProcessing, progress, removeBackground } = useBgRemoval()

  const toggle = () => setBgRemoveEnabled(!bgRemoveEnabled)

  const unprocessed = images.filter((img) => !img.bgRemoved)
  const selectedCount = bgSelectedIds.length
  const unprocessedCount = unprocessed.length
  const allSelected = unprocessedCount > 0 && selectedCount === unprocessedCount

  const toggleAll = () => {
    if (allSelected) deselectAllForBg()
    else selectAllForBg()
  }

  // 선택된 이미지만 처리
  const processSelected = useCallback(async () => {
    if (bgSelectedIds.length === 0) return
    const targets = images.filter((img) => bgSelectedIds.includes(img.id) && !img.bgRemoved)
    if (targets.length === 0) return

    let successCount = 0
    for (const img of targets) {
      const result = await removeBackground(img.dataUrl)
      if (result) {
        updateImage(img.id, { dataUrl: result, bgRemoved: true })
        successCount++
      }
    }

    deselectAllForBg()
    if (successCount === targets.length) {
      showToast(`배경 제거 완료 (${successCount}장)`)
    } else {
      showToast(`${successCount}/${targets.length}장 처리 · 일부 실패`, 'error')
    }
  }, [bgSelectedIds, images, removeBackground, updateImage, deselectAllForBg])

  const canRun = selectedCount > 0 && !isProcessing

  return (
    <div>
      {/* Row 1: [toggle] [label] [badge] */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 18px 4px' }}>
        <button
          onClick={toggle}
          style={{
            width: '34px', height: '18px', borderRadius: '9px',
            background: bgRemoveEnabled ? 'var(--accent)' : 'var(--surface3)',
            border: `1px solid ${bgRemoveEnabled ? 'var(--accent)' : 'var(--border2)'}`,
            cursor: 'pointer', position: 'relative', transition: 'all 0.2s',
            flexShrink: 0, padding: 0,
          }}
        >
          <div
            style={{
              position: 'absolute', top: '2px', left: '2px',
              width: '12px', height: '12px', borderRadius: '50%',
              background: bgRemoveEnabled ? '#0c0c10' : 'var(--text2)',
              transition: 'all 0.2s',
              transform: bgRemoveEnabled ? 'translateX(16px)' : 'translateX(0)',
            }}
          />
        </button>

        <span style={{ fontSize: '11px', color: 'var(--text2)', flex: 1 }}>
          배경 자동 제거
        </span>

        <span
          style={{
            fontSize: '9px', padding: '2px 6px', borderRadius: '4px',
            background: 'var(--accent-dim)', color: 'var(--accent)', fontWeight: 600,
          }}
        >
          AI
        </span>
      </div>

      {bgRemoveEnabled && (
        <>
          {/* Row 2: 전체 선택 + 카운트 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '2px 18px 6px' }}>
            <button
              onClick={toggleAll}
              disabled={unprocessedCount === 0}
              style={{
                fontSize: '10px', padding: '3px 8px', borderRadius: '4px',
                background: allSelected ? 'var(--accent-dim)' : 'var(--surface2)',
                border: `1px solid ${allSelected ? 'var(--accent)' : 'var(--border)'}`,
                color: allSelected ? 'var(--accent)' : 'var(--text2)',
                cursor: unprocessedCount === 0 ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font)',
              }}
            >
              {allSelected ? '☑ 전체 해제' : '☐ 전체 선택'}
            </button>
            <span style={{ fontSize: '10px', color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
              선택 {selectedCount} / 대기 {unprocessedCount}
            </span>
          </div>

          {/* Row 3: 실행 버튼 */}
          <div style={{ padding: '4px 18px 8px' }}>
            <button
              onClick={processSelected}
              disabled={!canRun}
              style={{
                width: '100%', padding: '8px', borderRadius: '7px',
                fontSize: '11px', fontWeight: 700,
                background: canRun ? 'var(--accent)' : 'var(--surface3)',
                color: canRun ? '#0c0c10' : 'var(--text3)',
                border: 'none',
                cursor: canRun ? 'pointer' : 'not-allowed',
                fontFamily: 'var(--font)',
                transition: 'all 0.2s',
              }}
            >
              {isProcessing
                ? progress || '처리 중...'
                : selectedCount === 0
                  ? '이미지를 선택하세요'
                  : `🎨 배경 제거 (${selectedCount}장)`}
            </button>
          </div>

          {/* Progress bar */}
          {isProcessing && (
            <div style={{ padding: '0 18px 6px' }}>
              <div style={{ height: '3px', background: 'var(--surface3)', borderRadius: '2px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%', background: 'var(--accent)', borderRadius: '2px',
                    width: typeof progress === 'number' ? `${progress}%` : '60%',
                    transition: 'width 0.3s',
                  }}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
