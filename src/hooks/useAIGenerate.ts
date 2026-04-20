'use client'

import { useCallback } from 'react'
import { useProductStore } from '@/stores/productStore'
import { useImageStore } from '@/stores/imageStore'
import { useEditorStore } from '@/stores/editorStore'
import { useUsageStore } from '@/stores/usageStore'
import { api } from '@/lib/api'
import { compressForAI } from '@/lib/image'
import type { GeneratedAll, GeneratedTag } from '@/types/ai'
import type { CoupangSuggestResponse } from '@/types/market'

const LOADING_MESSAGES = [
  'AI가 상품을 분석하고 있습니다...',
  '매력적인 카피를 작성하고 있습니다...',
  '셀링포인트를 정리하고 있습니다...',
  '최적화 상품명을 생성하고 있습니다...',
  '검색 태그를 선정하고 있습니다...',
  '거의 완성입니다...',
]

export function useAIGenerate() {
  const { product } = useProductStore()
  const { images } = useImageStore()
  const {
    setGeneratedContent,
    setGeneratedTitles,
    setGeneratedTags,
    setIsGenerating,
    setLoadingMessage,
    setGenerateError,
    setActiveTab,
  } = useEditorStore()

  // 통합 생성 — content + titles + tags 한번에
  const generateContent = useCallback(async () => {
    if (images.length === 0) return

    setIsGenerating(true)
    setGenerateError('')
    setLoadingMessage(LOADING_MESSAGES[0])

    let msgIdx = 0
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % LOADING_MESSAGES.length
      setLoadingMessage(LOADING_MESSAGES[msgIdx])
    }, 3000)

    try {
      // 쿠팡 인기 검색어 가져오기 (실패해도 무시)
      let coupangSuggestions: string[] = []
      try {
        if (product.name) {
          const suggest = await api.get<CoupangSuggestResponse>(
            `/api/market/suggest?keyword=${encodeURIComponent(product.name)}`,
          )
          coupangSuggestions = suggest.suggestions || []
        }
      } catch {
        // 쿠팡 API 실패해도 계속 진행
      }

      const aiImages = await Promise.all(
        images.slice(0, 5).map((img) => compressForAI(img.dataUrl))
      )

      // 한번의 API 호출로 content + titles + tags 모두 생성
      const result = await api.post<GeneratedAll>('/api/ai/copy', {
        images: aiImages,
        brand: product.brand,
        productName: product.name,
        price: product.price,
        category: product.category,
        platform: product.platform,
        memo: product.memo,
        features: product.features,
        coupangSuggestions,
      })

      // content 설정
      setGeneratedContent(result.content)
      // 크레딧 소비 후 UI 즉시 반영
      useUsageStore.getState().fetchUsage()

      // titles 설정
      if (result.titles?.length > 0) {
        setGeneratedTitles(result.titles)
      }

      // tags 설정
      if (result.tags?.length > 0) {
        const trendingSet = new Set(
          coupangSuggestions.map((s) => s.replace(/\s/g, '').toLowerCase()),
        )
        const tags: GeneratedTag[] = result.tags.map((text) => ({
          text,
          isTrending: trendingSet.has(text.replace(/\s/g, '').toLowerCase()),
        }))
        setGeneratedTags(tags)
      }

      setActiveTab('copy')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'AI 생성에 실패했습니다.'
      setGenerateError(msg)
      console.error('AI 생성 실패:', err)
    } finally {
      clearInterval(interval)
      setIsGenerating(false)
      setLoadingMessage('')
    }
  }, [
    images,
    product,
    setGeneratedContent,
    setGeneratedTitles,
    setGeneratedTags,
    setIsGenerating,
    setLoadingMessage,
    setGenerateError,
    setActiveTab,
  ])

  return { generateContent }
}
