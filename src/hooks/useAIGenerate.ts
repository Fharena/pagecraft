'use client'

import { useCallback } from 'react'
import { useProductStore } from '@/stores/productStore'
import { useImageStore } from '@/stores/imageStore'
import { useEditorStore } from '@/stores/editorStore'
import { api } from '@/lib/api'
import { compressForAI, compressForRender } from '@/lib/image'
import type {
  GeneratedContent,
  GeneratedTitle,
  GeneratedTag,
} from '@/types/ai'
import type { CoupangSuggestResponse } from '@/types/market'

const LOADING_MESSAGES = [
  'AI가 상품을 분석하고 있습니다...',
  '매력적인 카피를 작성하고 있습니다...',
  '셀링포인트를 정리하고 있습니다...',
  '상세 스펙을 구성하고 있습니다...',
  '거의 완성입니다...',
]

export function useAIGenerate() {
  const { product } = useProductStore()
  const { images } = useImageStore()
  const {
    setGeneratedContent,
    setRenderedImageUrl,
    setIsGenerating,
    setIsRenderingPng,
    setIsGeneratingTitles,
    setIsGeneratingTags,
    setGeneratedTitles,
    setGeneratedTags,
    setLoadingMessage,
    setActiveTab,
  } = useEditorStore()

  const generateContent = useCallback(async () => {
    if (images.length === 0) return

    setIsGenerating(true)
    setLoadingMessage(LOADING_MESSAGES[0])

    let msgIdx = 0
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % LOADING_MESSAGES.length
      setLoadingMessage(LOADING_MESSAGES[msgIdx])
    }, 3000)

    try {
      // AI 분석용 — 400px, 0.5 품질로 압축 (Vercel 4.5MB 제한 대응)
      const aiImages = await Promise.all(
        images.slice(0, 5).map((img) => compressForAI(img.dataUrl))
      )
      const result = await api.post<GeneratedContent>('/api/ai/copy', {
        images: aiImages,
        brand: product.brand,
        productName: product.name,
        price: product.price,
        category: product.category,
        platform: product.platform,
        memo: product.memo,
        features: product.features,
      })

      setGeneratedContent(result)
      setActiveTab('copy')

      // Render PNG — useImageStore에서 최신 이미지 목록 가져오기
      // AI 모델 이미지는 AiModelToggle에서 독립 생성 (중복 방지)
      setIsRenderingPng(true)
      setLoadingMessage('상세페이지 이미지를 생성하고 있습니다...')

      // 렌더용 — 600px, 0.7 품질로 압축 (화질 유지 + Vercel 제한 대응)
      const latestImages = useImageStore.getState().images
      const renderImages = await Promise.all(
        latestImages.map((img) => compressForRender(img.dataUrl))
      )
      const storeIntroRaw = useImageStore.getState().storeIntroImage
      const termsRaw = useImageStore.getState().termsImage
      const [storeIntroCompressed, termsCompressed] = await Promise.all([
        storeIntroRaw ? compressForRender(storeIntroRaw) : Promise.resolve(undefined),
        termsRaw ? compressForRender(termsRaw) : Promise.resolve(undefined),
      ])
      const pngBlob = await api.post<Blob>('/api/render', {
        data: result,
        price: product.price,
        images: renderImages,
        storeIntroImage: storeIntroCompressed,
        termsImage: termsCompressed,
      })

      if (pngBlob instanceof Blob) {
        const url = URL.createObjectURL(pngBlob)
        setRenderedImageUrl(url)
      }
    } catch (err) {
      console.error('AI 생성 실패:', err)
    } finally {
      clearInterval(interval)
      setIsGenerating(false)
      setIsRenderingPng(false)
      setLoadingMessage('')
    }
  }, [
    images,
    product,
    setGeneratedContent,
    setRenderedImageUrl,
    setIsGenerating,
    setIsRenderingPng,
    setLoadingMessage,
    setActiveTab,
  ])

  const generateTitles = useCallback(async () => {
    setIsGeneratingTitles(true)

    try {
      const suggestions = await api.get<CoupangSuggestResponse>(
        `/api/market/suggest?keyword=${encodeURIComponent(product.name)}`,
      )

      const result = await api.post<GeneratedTitle[]>('/api/ai/titles', {
        productName: product.name,
        category: product.category,
        brand: product.brand,
        keywords: product.features,
        coupangSuggestions: suggestions.suggestions,
      })

      setGeneratedTitles(result)
      setActiveTab('title')
    } catch (err) {
      console.error('타이틀 생성 실패:', err)
    } finally {
      setIsGeneratingTitles(false)
    }
  }, [product, setGeneratedTitles, setIsGeneratingTitles, setActiveTab])

  const generateTags = useCallback(async () => {
    setIsGeneratingTags(true)

    try {
      const suggestions = await api.get<CoupangSuggestResponse>(
        `/api/market/suggest?keyword=${encodeURIComponent(product.name)}`,
      )

      const result = await api.post<string[]>('/api/ai/tags', {
        productName: product.name,
        category: product.category,
        brand: product.brand,
        generatedContent: useEditorStore.getState().generatedContent,
        coupangSuggestions: suggestions.suggestions,
      })

      const trendingSet = new Set(
        suggestions.suggestions.map((s) =>
          s.replace(/\s/g, '').toLowerCase(),
        ),
      )

      const tags: GeneratedTag[] = result.map((text) => ({
        text,
        isTrending: trendingSet.has(text.replace(/\s/g, '').toLowerCase()),
      }))

      setGeneratedTags(tags)
      setActiveTab('tags')
    } catch (err) {
      console.error('태그 생성 실패:', err)
    } finally {
      setIsGeneratingTags(false)
    }
  }, [product, setGeneratedTags, setIsGeneratingTags, setActiveTab])

  return { generateContent, generateTitles, generateTags }
}
