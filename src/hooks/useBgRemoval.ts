'use client'

import { useState, useCallback } from 'react'
import { useImageStore } from '@/stores/imageStore'
import { useUsageStore } from '@/stores/usageStore'
import { api } from '@/lib/api'
import { compressForImageGen, whitenNearWhite } from '@/lib/image'
import { showToast } from '@/components/ui/Toast'

export function useBgRemoval() {
  const { images, updateImage } = useImageStore()
  const [isModelLoading] = useState(false) // Gemini 사용 — 모델 로드 없음
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState('')

  const removeBackground = useCallback(async (dataUrl: string): Promise<string | null> => {
    setIsProcessing(true)
    setProgress('배경 제거 중...')
    try {
      // 이미지 생성용 — 1024px/0.9로 Gemini 출력 품질 보존
      const compressed = await compressForImageGen(dataUrl)
      const res = await api.post<{ image: string }>('/api/image/bg-remove', {
        image: compressed,
      })
      // 후처리 — Gemini가 회색빛 배경 만드는 문제 해결
      const whitened = await whitenNearWhite(res.image, 245)
      // 크레딧 소비 후 UI 즉시 반영
      useUsageStore.getState().fetchUsage()
      return whitened
    } catch (err) {
      console.error('배경 제거 실패:', err)
      return null
    } finally {
      setIsProcessing(false)
      setProgress('')
    }
  }, [])

  const processAllImages = useCallback(async () => {
    const unprocessed = images.filter((img) => !img.bgRemoved)
    if (unprocessed.length === 0) return

    setIsProcessing(true)

    let successCount = 0
    for (let i = 0; i < unprocessed.length; i++) {
      const img = unprocessed[i]
      setProgress(`배경 제거 중... (${i + 1}/${unprocessed.length})`)

      const result = await removeBackground(img.dataUrl)
      if (result) {
        updateImage(img.id, { dataUrl: result, bgRemoved: true })
        successCount++
      }
    }

    setIsProcessing(false)
    setProgress('')
    if (successCount === unprocessed.length) {
      showToast(`배경 제거 완료 (${successCount}장)`)
    } else {
      showToast(`${successCount}/${unprocessed.length}장 처리 · 일부 실패`, 'error')
    }
  }, [images, removeBackground, updateImage])

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
    processAllImages,
    restoreAll,
    removeBackground,
  }
}
