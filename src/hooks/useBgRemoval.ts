'use client'

import { useState, useCallback, useRef } from 'react'
import { useImageStore } from '@/stores/imageStore'
import { showToast } from '@/components/ui/Toast'

type BgRemovalModule = {
  removeBackground: (blob: Blob) => Promise<Blob>
}

export function useBgRemoval() {
  const { images, updateImage } = useImageStore()
  const [isModelLoading, setIsModelLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState('')
  const modelRef = useRef<BgRemovalModule | null>(null)

  const loadModel = useCallback(async () => {
    if (modelRef.current) return modelRef.current
    setIsModelLoading(true)
    setProgress('AI 모델 다운로드 중...')
    try {
      const { removeBackground } = await import('@imgly/background-removal')
      modelRef.current = { removeBackground }
      setProgress('')
      return modelRef.current
    } catch (err) {
      console.error('배경 제거 모델 로드 실패:', err)
      showToast('배경 제거 모델 로드 실패', 'error')
      setProgress('')
      return null
    } finally {
      setIsModelLoading(false)
    }
  }, [])

  const removeBackground = useCallback(async (imageId: string, dataUrl: string): Promise<string | null> => {
    const model = await loadModel()
    if (!model) return null

    try {
      const res = await fetch(dataUrl)
      const blob = await res.blob()
      const resultBlob = await model.removeBackground(blob)

      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => resolve(null)
        reader.readAsDataURL(resultBlob)
      })
    } catch (err) {
      console.error('배경 제거 실패:', err)
      return null
    }
  }, [loadModel])

  const processAllImages = useCallback(async () => {
    const unprocessed = images.filter((img) => !img.bgRemoved)
    if (unprocessed.length === 0) return

    setIsProcessing(true)

    for (let i = 0; i < unprocessed.length; i++) {
      const img = unprocessed[i]
      setProgress(`배경 제거 중... (${i + 1}/${unprocessed.length})`)

      const result = await removeBackground(img.id, img.dataUrl)
      if (result) {
        updateImage(img.id, { dataUrl: result, bgRemoved: true })
      }
    }

    setIsProcessing(false)
    setProgress('')
    showToast(`배경 제거 완료 (${unprocessed.length}장)`)
  }, [images, removeBackground, updateImage])

  const restoreAll = useCallback(() => {
    // bgRemoved 상태만 리셋 — 원본 이미지 복구는 별도 저장 필요
    // 현재는 플래그만 초기화
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
