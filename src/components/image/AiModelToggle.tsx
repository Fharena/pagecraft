'use client'

import { useState, useCallback } from 'react'
import { useProductStore } from '@/stores/productStore'
import { useImageStore } from '@/stores/imageStore'
import { api, ApiError } from '@/lib/api'
import { showToast } from '@/components/ui/Toast'

export default function AiModelToggle() {
  const { product } = useProductStore()
  const {
    images, aiModelEnabled, aiModelGender,
    setAiModelEnabled, setAiModelGender, addImages,
  } = useImageStore()

  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const generate = useCallback(async () => {
    if (generated) {
      showToast('이번 세션에서 이미 생성했습니다', 'info')
      return
    }
    if (!product.name && images.length === 0) {
      setErrorMsg('상품명을 입력하거나 이미지를 먼저 업로드해주세요.')
      return
    }

    setGenerating(true)
    setErrorMsg('')
    try {
      const result = await api.post<{ image: string }>('/api/image/generate', {
        productName: product.name,
        category: product.category,
        gender: aiModelGender,
        images: images.map((img) => img.dataUrl),
      })
      if (result.image) {
        addImages([result.image])
        setGenerated(true)
        showToast('AI 모델 이미지가 생성되었습니다')
      }
    } catch (err) {
      console.error('AI 모델 이미지 생성 실패:', err)
      if (err instanceof ApiError) {
        try {
          const body = JSON.parse(err.message)
          setErrorMsg(body.error || '이미지 생성에 실패했습니다.')
        } catch {
          setErrorMsg(err.message || '이미지 생성에 실패했습니다.')
        }
      } else {
        setErrorMsg('이미지 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      }
    } finally {
      setGenerating(false)
    }
  }, [product, images, aiModelGender, generated, addImages])

  return (
    <div className="border border-border rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm text-text">AI 모델 이미지 생성</label>
          <span className="text-[10px] bg-green/20 text-green px-1.5 py-0.5 rounded font-medium">AI</span>
        </div>
        <button
          className={`w-8 h-[18px] rounded-full relative transition-colors cursor-pointer ${aiModelEnabled ? 'bg-accent' : 'bg-border'}`}
          onClick={() => setAiModelEnabled(!aiModelEnabled)}
        >
          <div className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow transition-all ${aiModelEnabled ? 'left-[14px]' : 'left-[2px]'}`} />
        </button>
      </div>

      {aiModelEnabled && (
        <>
          <div className="flex gap-2">
            <button
              className={`flex-1 px-3 py-1.5 rounded text-xs cursor-pointer transition-colors ${aiModelGender === 'female' ? 'bg-accent text-black' : 'bg-surface border border-border text-muted'}`}
              onClick={() => setAiModelGender('female')}
            >
              여성
            </button>
            <button
              className={`flex-1 px-3 py-1.5 rounded text-xs cursor-pointer transition-colors ${aiModelGender === 'male' ? 'bg-accent text-black' : 'bg-surface border border-border text-muted'}`}
              onClick={() => setAiModelGender('male')}
            >
              남성
            </button>
          </div>

          <button
            className={`w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-2 ${
              generated
                ? 'bg-green/20 text-green border border-green/30'
                : 'bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20'
            }`}
            onClick={generate}
            disabled={generating || generated}
          >
            {generating ? (
              <>
                <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                생성 중...
              </>
            ) : generated ? (
              '생성됨 ✓'
            ) : (
              '🧑 이미지 생성'
            )}
          </button>

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-400">
              {errorMsg}
            </div>
          )}
        </>
      )}
    </div>
  )
}
