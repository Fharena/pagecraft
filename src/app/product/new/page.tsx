'use client'

import { useRef, useCallback } from 'react'
import Header from '@/components/layout/Header'
import StatusBar from '@/components/layout/StatusBar'
import ProductForm from '@/components/layout/ProductForm'
import ImageUploader from '@/components/image/ImageUploader'
import ImageGrid from '@/components/image/ImageGrid'
import SingleImageUpload from '@/components/image/SingleImageUpload'
import BgRemovalToggle from '@/components/image/BgRemovalToggle'
import AiModelToggle from '@/components/image/AiModelToggle'
import ResultTabs from '@/components/editor/ResultTabs'
import DetailPagePreview from '@/components/editor/DetailPagePreview'
import Button from '@/components/ui/Button'
import { useProductStore } from '@/stores/productStore'
import { useImageStore } from '@/stores/imageStore'
import { useEditorStore } from '@/stores/editorStore'
import { useAIGenerate } from '@/hooks/useAIGenerate'
import { showToast } from '@/components/ui/Toast'

const FEATURES = [
  '방수', '방풍', '보온', '경량', '신축성', 'UV차단', '친환경', '남녀공용',
  '캠핑', '일상착용', '선물용', '커플',
]

export default function ProductNewPage() {
  const { product, setProduct } = useProductStore()
  const { images, storeIntroImage, termsImage, setStoreIntroImage, setTermsImage } =
    useImageStore()
  const {
    isGenerating,
    generatedContent,
    loadingMessage,
    generateError,
  } = useEditorStore()
  const { generateContent } = useAIGenerate()
  const previewRef = useRef<HTMLDivElement>(null)

  const canGenerate = images.length > 0 && product.name.trim() !== ''

  const toggleFeature = (feature: string) => {
    const features = product.features.includes(feature)
      ? product.features.filter((f) => f !== feature)
      : [...product.features, feature]
    setProduct({ features })
  }

  // html2canvas로 PNG 다운로드 — 서버 API 호출 없음
  const handleDownload = useCallback(async () => {
    if (!previewRef.current || !generatedContent) return
    showToast('이미지 생성 중...')
    const html2canvas = (await import('html2canvas')).default
    const canvas = await html2canvas(previewRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      width: 800,
      windowWidth: 800,
    })
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const safeName = (generatedContent.product_name || product.name || '상품')
        .replace(/[/\\?%*:|"<>]/g, '')
      a.download = `상세페이지_${safeName}.png`
      a.click()
      URL.revokeObjectURL(url)
      showToast('이미지 다운로드 완료')
    }, 'image/png')
  }, [generatedContent, product.name])

  const handleCopyAll = () => {
    if (!generatedContent) return
    const parts: string[] = []
    parts.push(`[상품명] ${generatedContent.product_name}`)
    parts.push(`[서브타이틀] ${generatedContent.subtitle}`)
    parts.push(`[메인카피] ${generatedContent.main_copy}`)
    parts.push('')
    parts.push('[판매포인트]')
    generatedContent.selling_points.forEach((sp, i) => parts.push(`${i + 1}. ${sp}`))
    parts.push('')
    parts.push('[상세설명]')
    parts.push(generatedContent.description)
    parts.push('')
    parts.push('[스펙]')
    generatedContent.specs.forEach((s) => parts.push(`${s.key}: ${s.value}`))
    parts.push('')
    parts.push(`[키워드] ${generatedContent.keywords.join(', ')}`)
    parts.push(`[주의사항] ${generatedContent.caution}`)
    navigator.clipboard.writeText(parts.join('\n'))
    showToast('전체 텍스트 복사됨')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header />

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '450px 1fr 480px', overflow: 'hidden' }}>

        {/* ── LEFT PANEL ── */}
        <aside style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }} className="left-panel-scroll">

          {/* 상품 사진 */}
          <div className="panel-section">
            <div className="panel-section-title">상품 사진</div>
            <ImageUploader />
          </div>

          {/* 배경 제거 토글 */}
          <BgRemovalToggle />

          {/* AI 모델 토글 */}
          <AiModelToggle />

          {/* 썸네일 그리드 — 토글 아래 */}
          <ImageGrid />

          <div className="divider" />

          {/* 상품 정보 */}
          <div className="panel-section">
            <div className="panel-section-title">상품 정보</div>
          </div>
          <ProductForm />

          <div className="divider" />

          {/* 스토어 소개 */}
          <div className="panel-section">
            <div className="panel-section-title">스토어 소개 (헤더 위)</div>
          </div>
          <div style={{ padding: '0 18px 8px' }}>
            <SingleImageUpload
              label="스토어 소개 이미지"
              icon="🏪"
              description={'상세페이지 맨 위(헤더 위)에 표시\n이미지 파일 1장'}
              imageData={storeIntroImage}
              onImageChange={setStoreIntroImage}
            />
          </div>

          <div className="divider" />

          {/* 약관 */}
          <div className="panel-section">
            <div className="panel-section-title">약관 (푸터 아래)</div>
          </div>
          <div style={{ padding: '0 18px 8px' }}>
            <SingleImageUpload
              label="약관 이미지"
              icon="📜"
              description={'상세페이지 맨 아래(푸터 아래)에 표시\n이미지 파일 1장'}
              imageData={termsImage}
              onImageChange={setTermsImage}
            />
          </div>

          <div className="divider" />

          {/* 강조 특징 */}
          <div className="panel-section">
            <div className="panel-section-title">강조 특징</div>
          </div>
          <div className="chip-row">
            {FEATURES.map((feat) => (
              <button
                key={feat}
                className={`chip${product.features.includes(feat) ? ' on' : ''}`}
                onClick={() => toggleFeature(feat)}
              >
                {feat}
              </button>
            ))}
          </div>

          <div className="divider" />

          {/* 생성 버튼 */}
          <div className="gen-wrap">
            <Button
              className="w-full"
              size="lg"
              loading={isGenerating}
              disabled={!canGenerate}
              onClick={generateContent}
            >
              {isGenerating ? '생성 중...' : '✦ AI 상세페이지 생성'}
            </Button>
          </div>
        </aside>

        {/* ── CENTER CANVAS ── */}
        <main style={{ background: 'var(--bg)', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 20px' }}>
          {/* Canvas toolbar — preview.html always visible */}
          <div style={{ width: '100%', maxWidth: 660, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)', marginRight: 'auto' }}>preview.html</span>
            {generatedContent && (
              <>
                <button
                  style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 500, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text2)', cursor: 'pointer', fontFamily: 'var(--font)', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border2)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text2)' }}
                  onClick={handleCopyAll}
                >
                  📋 전체 복사
                </button>
                <button
                  style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: 'var(--accent)', border: '1px solid var(--accent)', color: '#0c0c10', cursor: 'pointer', fontFamily: 'var(--font)', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.2s' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent2)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)' }}
                  onClick={handleDownload}
                >
                  ⬇ 이미지 저장
                </button>
              </>
            )}
          </div>

          {/* Preview frame */}
          <div style={{ width: '100%', maxWidth: 660, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', overflowY: 'auto', minHeight: 500 }}>
            {/* Browser bar */}
            <div style={{ height: 36, background: 'var(--surface2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 10 }}>
              <div style={{ display: 'flex', gap: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,95,87,0.4)' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(254,188,46,0.4)' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(40,200,64,0.4)' }} />
              </div>
              <div style={{ flex: 1, background: 'var(--surface3)', borderRadius: 5, height: 20, display: 'flex', alignItems: 'center', padding: '0 10px' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)' }}>pagecraft://preview · 상세페이지 미리보기</span>
              </div>
            </div>

            {/* Loading state */}
            {isGenerating && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 30px', textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, position: 'relative', marginBottom: 24 }}>
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent animate-[spin_1s_linear_infinite]" />
                  <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-green animate-[spin_1.5s_linear_infinite_reverse]" />
                  <div className="absolute inset-[18px] rounded-full bg-accent-dim border border-accent animate-[pulse_2s_ease-in-out_infinite]" />
                </div>
                <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 5 }}>{loadingMessage || '처리 중...'}</p>
                <p style={{ fontSize: 11, color: 'var(--text2)', fontFamily: 'var(--mono)' }}>잠시만 기다려주세요</p>
              </div>
            )}

            {/* Error state */}
            {!isGenerating && generateError && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 30px', textAlign: 'center' }}>
                <div style={{ width: 72, height: 72, background: 'rgba(248,113,113,0.08)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, marginBottom: 20, border: '1px solid rgba(248,113,113,0.2)' }}>
                  ⚠
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>생성에 실패했습니다</h3>
                <p style={{ fontSize: 12, color: 'var(--red)', lineHeight: 1.6, marginBottom: 16, maxWidth: 400, wordBreak: 'break-word' }}>
                  {generateError}
                </p>
                <button
                  onClick={generateContent}
                  disabled={!canGenerate}
                  style={{ padding: '10px 24px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: 'var(--accent)', border: 'none', color: '#0c0c10', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  ↺ 다시 시도
                </button>
              </div>
            )}

            {/* Empty state */}
            {!isGenerating && !generateError && !generatedContent && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 30px', textAlign: 'center' }}>
                <div style={{ width: 72, height: 72, background: 'var(--surface2)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, marginBottom: 20, border: '1px solid var(--border)' }}>
                  🛍
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>상품 정보를 입력해주세요</h3>
                <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>
                  사진을 업로드하고 상품 정보를 입력한 뒤<br />AI 생성 버튼을 누르면 바로 만들어집니다.
                </p>
              </div>
            )}

            {/* 실시간 HTML 미리보기 — generatedContent 변경 시 자동 리렌더링 */}
            {!isGenerating && generatedContent && (
              <div style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ transform: 'scale(0.825)', transformOrigin: 'top left', width: 800 }}>
                  <DetailPagePreview
                    ref={previewRef}
                    content={generatedContent}
                    price={product.price}
                    images={images.map((img) => img.dataUrl)}
                    storeIntroImage={storeIntroImage}
                    termsImage={termsImage}
                  />
                </div>
              </div>
            )}
          </div>
        </main>

        {/* ── RIGHT PANEL ── */}
        <aside style={{ background: 'var(--surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <ResultTabs />
        </aside>
      </div>

      <StatusBar />
    </div>
  )
}
