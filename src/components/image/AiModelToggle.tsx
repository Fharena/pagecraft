'use client'

import { useState, useCallback } from 'react'
import { useProductStore } from '@/stores/productStore'
import { useImageStore } from '@/stores/imageStore'
import { api, ApiError } from '@/lib/api'
import { compressForAI } from '@/lib/image'

export default function AiModelToggle() {
  const { product } = useProductStore()
  const {
    images, aiModelEnabled, aiModelGender,
    setAiModelEnabled, setAiModelGender, addImages,
  } = useImageStore()

  const [generating, setGenerating] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const generate = useCallback(async () => {
    if (!product.name && images.length === 0) {
      setErrorMsg('상품명을 입력하거나 이미지를 먼저 업로드해주세요.')
      return
    }

    setGenerating(true)
    setErrorMsg('')
    try {
      // AI에는 최대 5장, 400px/0.5 품질로 압축해서 전송 (payload 절약)
      const smallImages = await Promise.all(
        images.slice(0, 5).map((img) => compressForAI(img.dataUrl))
      )
      const result = await api.post<{ image: string }>('/api/image/generate', {
        productName: product.name,
        category: product.category,
        gender: aiModelGender,
        images: smallImages,
      })
      if (result.image) {
        addImages([result.image], true)
      }
    } catch (err) {
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
  }, [product, images, aiModelGender, addImages])

  return (
    <div>
      {/* Row 1: [toggle] [label] [badge] */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 18px 4px' }}>
        {/* Toggle */}
        <button
          onClick={() => setAiModelEnabled(!aiModelEnabled)}
          style={{
            width: '34px',
            height: '18px',
            borderRadius: '9px',
            background: aiModelEnabled ? 'var(--accent)' : 'var(--surface3)',
            border: `1px solid ${aiModelEnabled ? 'var(--accent)' : 'var(--border2)'}`,
            cursor: 'pointer',
            position: 'relative',
            transition: 'all 0.2s',
            flexShrink: 0,
            padding: 0,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '2px',
              left: '2px',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: aiModelEnabled ? '#0c0c10' : 'var(--text2)',
              transition: 'all 0.2s',
              transform: aiModelEnabled ? 'translateX(16px)' : 'translateX(0)',
            }}
          />
        </button>

        {/* Label */}
        <span style={{ fontSize: '11px', color: 'var(--text2)', flex: 1 }}>
          AI 모델 이미지 생성
        </span>

        {/* Badge — green, NOT accent */}
        <span
          style={{
            fontSize: '9px',
            padding: '2px 6px',
            borderRadius: '4px',
            background: 'rgba(62,207,142,0.12)',
            color: 'var(--green)',
            fontWeight: 600,
          }}
        >
          AI
        </span>
      </div>

      {aiModelEnabled && (
        <>
          {/* Row 2: gender row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '2px 18px 6px' }}>
            <div
              style={{
                display: 'flex',
                border: '1px solid var(--border2)',
                borderRadius: '6px',
                overflow: 'hidden',
              }}
            >
              <button
                onClick={() => setAiModelGender('female')}
                style={{
                  padding: '4px 12px',
                  fontSize: '10px',
                  fontWeight: 600,
                  background: aiModelGender === 'female' ? 'var(--accent)' : 'var(--surface2)',
                  color: aiModelGender === 'female' ? '#0c0c10' : 'var(--text3)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                여성
              </button>
              <button
                onClick={() => setAiModelGender('male')}
                style={{
                  padding: '4px 12px',
                  fontSize: '10px',
                  fontWeight: 600,
                  background: aiModelGender === 'male' ? 'var(--accent)' : 'var(--surface2)',
                  color: aiModelGender === 'male' ? '#0c0c10' : 'var(--text3)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                남성
              </button>
            </div>
          </div>

          {/* Row 3: generate button — GREEN */}
          <div style={{ padding: '4px 18px 8px' }}>
            <button
              onClick={generate}
              disabled={generating}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '7px',
                fontSize: '11px',
                fontWeight: 700,
                background: generating ? 'var(--surface3)' : 'var(--green)',
                border: 'none',
                color: generating ? 'var(--text3)' : '#fff',
                cursor: generating ? 'not-allowed' : 'pointer',
              }}
            >
              {generating ? '생성 중...' : '🧑 이미지 생성'}
            </button>

            {/* Error message */}
            {errorMsg && (
              <div
                style={{
                  marginTop: '6px',
                  background: 'rgba(248,113,113,0.08)',
                  border: '1px solid rgba(248,113,113,0.2)',
                  borderRadius: '8px',
                  padding: '8px 13px',
                  fontSize: '12px',
                  color: 'var(--red)',
                }}
              >
                {errorMsg}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
