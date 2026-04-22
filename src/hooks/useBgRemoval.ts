'use client'

import { useState, useCallback } from 'react'
import { useImageStore } from '@/stores/imageStore'
import { useUsageStore } from '@/stores/usageStore'
import { api } from '@/lib/api'
import { compressForBgRemoval } from '@/lib/image'
import { showToast } from '@/components/ui/Toast'

/**
 * 내부 배경 제거 로직 — 상태 관리 없음 (순수 API 호출)
 * 단일/배치 공용. 호출자가 isProcessing/progress 관리.
 */
async function bgRemoveOne(dataUrl: string): Promise<string | null> {
  try {
    // Recraft는 해상도 보존형 — 2048px/0.92로 고품질 입력
    const compressed = await compressForBgRemoval(dataUrl)
    const res = await api.post<{ image: string }>('/api/image/bg-remove', {
      image: compressed,
    })
    // Recraft는 진짜 픽셀 마스크 기반 투명 PNG 반환 → whitenNearWhite 불필요
    // (반투명 엣지 픽셀을 순수 흰색으로 바꾸면 헤일로 생김)
    return res.image
  } catch (err) {
    console.error('배경 제거 실패:', err)
    return null
  }
}

export function useBgRemoval() {
  const { images, updateImage } = useImageStore()
  const [isModelLoading] = useState(false) // Recraft 사용 — 모델 로드 없음
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState('')

  // 단일 이미지 처리 — UI에서 개별 버튼용
  const removeBackground = useCallback(async (dataUrl: string): Promise<string | null> => {
    setIsProcessing(true)
    setProgress('배경 제거 중...')
    try {
      const result = await bgRemoveOne(dataUrl)
      // 크레딧 소비 후 UI 즉시 반영
      useUsageStore.getState().fetchUsage()
      return result
    } finally {
      setIsProcessing(false)
      setProgress('')
    }
  }, [])

  /**
   * 배치 배경 제거 — 동시성 3 병렬 처리
   * @param targetIds 처리할 이미지 ID 배열 (없으면 미처리 전체)
   * - Replicate 정상 한도(600/min) 안에서 안전
   * - 신규 계정 throttle(6/min, burst=1) 걸려도 서버 쪽 429 재시도가 흡수
   * - 기존 순차 처리 대비 이론상 3배 속도 향상
   */
  const processImages = useCallback(async (targetIds?: string[]): Promise<number> => {
    const targets = targetIds
      ? images.filter((img) => targetIds.includes(img.id) && !img.bgRemoved)
      : images.filter((img) => !img.bgRemoved)
    if (targets.length === 0) return 0

    setIsProcessing(true)

    const CONCURRENCY = 3
    let successCount = 0
    let completed = 0

    const queue = [...targets]
    setProgress(`배경 제거 중... (0/${targets.length})`)

    async function worker() {
      while (queue.length > 0) {
        const img = queue.shift()
        if (!img) break
        const result = await bgRemoveOne(img.dataUrl)
        if (result) {
          updateImage(img.id, { dataUrl: result, bgRemoved: true })
          successCount++
        }
        completed++
        setProgress(`배경 제거 중... (${completed}/${targets.length})`)
      }
    }

    const workerCount = Math.min(CONCURRENCY, targets.length)
    await Promise.all(Array.from({ length: workerCount }, () => worker()))

    // 배치 완료 후 크레딧 한 번만 재조회 (중간에 여러번 fetchUsage 불필요)
    useUsageStore.getState().fetchUsage()

    setIsProcessing(false)
    setProgress('')

    if (successCount === targets.length) {
      showToast(`배경 제거 완료 (${successCount}장)`)
    } else {
      showToast(`${successCount}/${targets.length}장 처리 · 일부 실패`, 'error')
    }
    return successCount
  }, [images, updateImage])

  // 기존 API 호환 — 미처리 이미지 전체 처리
  const processAllImages = useCallback(() => processImages(), [processImages])

  const restoreAll = useCallback(() => {
    images.forEach((img) => {
      if (img.bgRemoved) {
        updateImage(img.id, { bgRemoved: false })
      }
    })
  }, [images, updateImage])

  return {
    isModelLoading,
    isProcessing,
    progress,
    processImages,
    processAllImages,
    restoreAll,
    removeBackground,
  }
}
