'use client'

import Header from '@/components/layout/Header'
import StatusBar from '@/components/layout/StatusBar'
import ProductForm from '@/components/layout/ProductForm'
import ImageUploader from '@/components/image/ImageUploader'
import ImageGrid from '@/components/image/ImageGrid'
import SingleImageUpload from '@/components/image/SingleImageUpload'
import BgRemovalToggle from '@/components/image/BgRemovalToggle'
import AiModelToggle from '@/components/image/AiModelToggle'
import ResultTabs from '@/components/editor/ResultTabs'
import Button from '@/components/ui/Button'
import { useProductStore } from '@/stores/productStore'
import { useImageStore } from '@/stores/imageStore'
import { useEditorStore } from '@/stores/editorStore'
import { useAIGenerate } from '@/hooks/useAIGenerate'
import { showToast } from '@/components/ui/Toast'

export default function ProductNewPage() {
  const { product } = useProductStore()
  const { images, storeIntroImage, termsImage, setStoreIntroImage, setTermsImage } =
    useImageStore()
  const {
    isGenerating,
    isRenderingPng,
    renderedImageUrl,
    generatedContent,
    loadingMessage,
  } = useEditorStore()
  const { generateContent } = useAIGenerate()

  const canGenerate = images.length > 0 && product.name.trim() !== ''
  const isLoading = isGenerating || isRenderingPng

  const handleDownload = () => {
    if (!renderedImageUrl) return
    const a = document.createElement('a')
    a.href = renderedImageUrl
    const safeName = (generatedContent?.product_name || product.name || '상품')
      .replace(/[/\\?%*:|"<>]/g, '')
    a.download = `상세페이지_${safeName}.png`
    a.click()
    showToast('이미지 다운로드 시작')
  }

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
    <div className="flex flex-col h-screen">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <aside className="w-[450px] border-r border-border overflow-auto p-4 space-y-5 shrink-0">
          <section>
            <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              상품 사진
            </h2>
            <ImageUploader />
            <div className="mt-3">
              <ImageGrid />
            </div>
            <div className="mt-3">
              <BgRemovalToggle />
            </div>
            <div className="mt-3">
              <AiModelToggle />
            </div>
          </section>

          <section>
            <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              상품 정보
            </h2>
            <ProductForm />
          </section>

          <section className="space-y-3">
            <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              추가 이미지
            </h2>
            <SingleImageUpload
              label="매장 소개 이미지"
              imageData={storeIntroImage}
              onImageChange={setStoreIntroImage}
            />
            <SingleImageUpload
              label="교환/반품 안내 이미지"
              imageData={termsImage}
              onImageChange={setTermsImage}
            />
          </section>

          <Button
            className="w-full"
            size="lg"
            loading={isLoading}
            disabled={!canGenerate}
            onClick={generateContent}
          >
            {isLoading ? '생성 중...' : '✦ AI 상세페이지 생성'}
          </Button>
        </aside>

        {/* Center — 미리보기 */}
        <main className="flex-1 overflow-auto p-6 flex flex-col items-center bg-bg">
          {/* Canvas toolbar */}
          {generatedContent && (
            <div className="w-full max-w-[660px] flex items-center justify-between mb-3">
              <span className="text-xs text-muted font-mono">preview.html</span>
              <div className="flex gap-2">
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border text-muted hover:text-text hover:border-accent/50 transition-colors cursor-pointer"
                  onClick={handleCopyAll}
                >
                  📋 전체 복사
                </button>
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-accent text-black font-medium hover:bg-accent/90 transition-colors cursor-pointer"
                  onClick={handleDownload}
                  disabled={!renderedImageUrl}
                >
                  ⬇ 이미지 저장
                </button>
              </div>
            </div>
          )}

          {/* Preview frame */}
          <div className="max-w-[660px] w-full bg-surface rounded-2xl border border-border flex flex-col overflow-hidden" style={{ maxHeight: 'calc(100vh - 160px)' }}>
            {/* Browser bar */}
            <div className="h-9 bg-[#1a1a22] flex items-center px-4 gap-2 shrink-0">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
              </div>
              <div className="flex-1 text-center text-[11px] text-muted/60 font-mono">
                pagecraft://preview · 상세페이지 미리보기
              </div>
            </div>

            {/* Content area — 스크롤 가능 */}
            <div className="bg-white min-h-[400px] overflow-auto">
              {/* Loading state */}
              {isLoading && (
                <div className="flex flex-col items-center justify-center py-20 space-y-6">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-2 border-accent/30 animate-spin" style={{ animationDuration: '3s' }} />
                    <div className="absolute inset-1 rounded-full border-2 border-transparent border-t-accent animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
                    <div className="absolute inset-3 rounded-full bg-accent/20 animate-pulse" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700">{loadingMessage || '처리 중...'}</p>
                    <p className="text-xs text-gray-400 mt-1">잠시만 기다려주세요</p>
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!isLoading && !renderedImageUrl && (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-3xl">
                    🛍
                  </div>
                  <div className="text-center">
                    <p className="text-base font-semibold text-gray-700">상품 정보를 입력해주세요</p>
                    <p className="text-sm text-gray-400 mt-1">
                      사진을 업로드하고 상품 정보를 입력한 뒤
                      <br />
                      AI 생성 버튼을 누르면 바로 만들어집니다.
                    </p>
                  </div>
                </div>
              )}

              {/* Result preview */}
              {!isLoading && renderedImageUrl && (
                <img
                  src={renderedImageUrl}
                  alt="상세페이지 미리보기"
                  className="w-full"
                />
              )}
            </div>
          </div>
        </main>

        {/* Right Panel */}
        <aside className="w-[480px] border-l border-border shrink-0 flex flex-col overflow-hidden">
          <ResultTabs />
        </aside>
      </div>

      <StatusBar />
    </div>
  )
}
