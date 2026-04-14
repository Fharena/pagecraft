'use client'

import { forwardRef } from 'react'
import type { GeneratedContent } from '@/types/ai'

interface DetailPagePreviewProps {
  content: GeneratedContent
  price: string
  images: string[]
  storeIntroImage?: string | null
  termsImage?: string | null
}

/**
 * 상세페이지 HTML 미리보기 — render.service.ts 레이아웃 1:1 복제
 * 800px 고정 폭, 서버 canvas 렌더링과 동일한 결과
 */
const DetailPagePreview = forwardRef<HTMLDivElement, DetailPagePreviewProps>(
  ({ content, price, images, storeIntroImage, termsImage }, ref) => {
    const descLines = content.description ? content.description.split('\n').filter(Boolean) : []

    return (
      <div
        ref={ref}
        style={{
          width: 800,
          fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif",
          lineHeight: 1.4,
          overflow: 'hidden',
          background: '#ffffff',
        }}
      >
        {/* 스토어 소개 이미지 (선택) */}
        {storeIntroImage && (
          <img src={storeIntroImage} alt="" style={{ width: '100%', display: 'block' }} />
        )}

        {/* 헤더 — 110px, #161616 */}
        <div
          style={{
            height: 110,
            background: '#161616',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <p
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: '#c8a050',
              textAlign: 'center',
              margin: 0,
              padding: '0 40px',
            }}
          >
            {content.product_name}
          </p>
          <p
            style={{
              fontSize: 16,
              color: '#9998a8',
              textAlign: 'center',
              margin: '8px 0 0',
            }}
          >
            {content.subtitle}
          </p>
        </div>

        {/* 메인 이미지 — 800x800 cover */}
        {images[0] && (
          <div style={{ width: 800, height: 800, overflow: 'hidden' }}>
            <img
              src={images[0]}
              alt="메인 상품 이미지"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}

        {/* 메인 카피 — 190px, #f8f7f4 */}
        <div
          style={{
            height: 190,
            background: '#f8f7f4',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 40px',
          }}
        >
          {/* 금색 구분선 */}
          <div style={{ width: 60, height: 2, background: '#c8a050', marginBottom: 20 }} />
          <p
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: '#0f0f0f',
              textAlign: 'center',
              lineHeight: '30px',
              margin: 0,
              maxWidth: 720,
              wordBreak: 'keep-all',
            }}
          >
            {content.main_copy}
          </p>
        </div>

        {/* 셀링포인트 — 270px, 3컬럼 */}
        <div
          style={{
            height: 270,
            background: '#ffffff',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
          }}
        >
          {content.selling_points.slice(0, 3).map((sp, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 20px',
              }}
            >
              <p
                style={{
                  fontSize: 36,
                  fontWeight: 900,
                  color: '#c8a050',
                  margin: '0 0 12px',
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </p>
              <p
                style={{
                  fontSize: 14,
                  color: '#0f0f0f',
                  textAlign: 'center',
                  lineHeight: '22px',
                  margin: 0,
                  wordBreak: 'keep-all',
                }}
              >
                {sp}
              </p>
            </div>
          ))}
        </div>

        {/* 설명 첫 문단 — 180px, #f8f7f4 */}
        {descLines[0] && (
          <div
            style={{
              height: 180,
              background: '#f8f7f4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 40px',
            }}
          >
            <p
              style={{
                fontSize: 15,
                color: '#0f0f0f',
                textAlign: 'center',
                lineHeight: '24px',
                margin: 0,
                maxWidth: 720,
                wordBreak: 'keep-all',
              }}
            >
              {descLines[0]}
            </p>
          </div>
        )}

        {/* 추가 이미지 + 설명 반복 */}
        {images.slice(1).map((imgSrc, i) => (
          <div key={`img-${i + 1}`}>
            <img
              src={imgSrc}
              alt={`상품 이미지 ${i + 2}`}
              style={{ width: '100%', display: 'block' }}
            />
            {descLines[i + 1] && (
              <div
                style={{
                  height: 140,
                  background: '#f8f7f4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 40px',
                }}
              >
                <p
                  style={{
                    fontSize: 15,
                    color: '#0f0f0f',
                    textAlign: 'center',
                    lineHeight: '24px',
                    margin: 0,
                    maxWidth: 720,
                    wordBreak: 'keep-all',
                  }}
                >
                  {descLines[i + 1]}
                </p>
              </div>
            )}
          </div>
        ))}

        {/* 스펙 테이블 */}
        {content.specs.length > 0 && (
          <div
            style={{
              background: '#ffffff',
              padding: '40px 0',
            }}
          >
            {/* 제목 */}
            <p
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: '#c8a050',
                textAlign: 'center',
                margin: '0 0 8px',
              }}
            >
              SPECIFICATION
            </p>
            <div style={{ width: 60, height: 2, background: '#c8a050', margin: '0 auto 24px' }} />

            {/* 스펙 행 */}
            {content.specs.map((spec, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 40,
                  height: 36,
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    color: '#9998a8',
                    textAlign: 'right',
                    width: 340,
                  }}
                >
                  {spec.key}
                </span>
                <span
                  style={{
                    fontSize: 14,
                    color: '#0f0f0f',
                    textAlign: 'left',
                    width: 340,
                  }}
                >
                  {spec.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 키워드 — 120px, #f8f7f4 */}
        {content.keywords.length > 0 && (
          <div
            style={{
              height: 120,
              background: '#f8f7f4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 30px',
            }}
          >
            <p
              style={{
                fontSize: 13,
                color: '#555568',
                textAlign: 'center',
                lineHeight: '22px',
                margin: 0,
                maxWidth: 740,
                wordBreak: 'keep-all',
              }}
            >
              {content.keywords.map((k) => `#${k}`).join('  ')}
            </p>
          </div>
        )}

        {/* 가격 푸터 — 90px, #161616 */}
        <div
          style={{
            height: 90,
            background: '#161616',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {price && (
            <p
              style={{
                fontSize: 24,
                fontWeight: 900,
                color: '#c8a050',
                margin: '0 0 6px',
              }}
            >
              ₩{Number(price.replace(/[^\d]/g, '') || 0).toLocaleString()}
            </p>
          )}
          {content.caution && (
            <p
              style={{
                fontSize: 12,
                color: '#555568',
                textAlign: 'center',
                margin: 0,
              }}
            >
              {content.caution}
            </p>
          )}
        </div>

        {/* 약관 이미지 (선택) */}
        {termsImage && (
          <img src={termsImage} alt="" style={{ width: '100%', display: 'block' }} />
        )}
      </div>
    )
  }
)

DetailPagePreview.displayName = 'DetailPagePreview'

export default DetailPagePreview
