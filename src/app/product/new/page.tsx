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
        {/* Left Panel — 450px, 원본 일치 */}
        <aside className="w-[450px] border-r border-border overflow-auto shrink-0 flex flex-col">
          <div className="flex-1 space-y-0">
            {/* 상품 사진 */}
            <section className="pt-5 pb-2 px-[18px]">
              <h2 className="text-[9px] font-bold text-text2 uppercase tracking-[2px] mb-3 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-accent" />
                상품 사진
              </h2>
              <ImageUploader />
              <div className="mt-[6px]">
                <ImageGrid />
              </div>
            </section>

            {/* 배경 제거 + AI 모델 */}
            <section className="px-[18px] space-y-2 pb-2">
              <BgRemovalToggle />
              <AiModelToggle />
            </section>

            {/* 구분선 */}
            <div className="h-px bg-border mx-[18px] my-2" />

            {/* 상품 정보 */}
            <section className="pt-2 pb-2">
              <h2 className="text-[9px] font-bold text-text2 uppercase tracking-[2px] mb-3 px-[18px] flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-accent" />
                상품 정보
              </h2>
              <ProductForm />
            </section>

            {/* 구분선 */}
            <div className="h-px bg-border mx-[18px] my-2" />

            {/* 추가 이미지 */}
            <section className="pt-2 pb-4 px-[18px] space-y-3">
              <h2 className="text-[9px] font-bold text-text2 uppercase tracking-[2px] mb-3 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-accent" />
                추가 이미지
              </h2>

              {/* 스토어 소개 (헤더 위) */}
              <div className="flex flex-col gap-[6px]">
                <p className="text-[11px] font-medium text-text2">스토어 소개 (헤더 위)</p>
                <SingleImageUpload
                  label="스토어 소개 이미지"
                  imageData={storeIntroImage}
                  onImageChange={setStoreIntroImage}
                />
                <p className="text-[11px] text-text3">상세페이지 맨 위(헤더 위)에 표시</p>
              </div>

              {/* 약관 (푸터 아래) */}
              <div className="flex flex-col gap-[6px]">
                <p className="text-[11px] font-medium text-text2">약관 (푸터 아래)</p>
                <SingleImageUpload
                  label="약관 이미지"
                  imageData={termsImage}
                  onImageChange={setTermsImage}
                />
                <p className="text-[11px] text-text3">상세페이지 맨 아래(푸터 아래)에 표시</p>
              </div>
            </section>
          </div>

          {/* 생성 버튼 — 하단 고정 */}
          <div className="px-[18px] py-3 border-t border-border shrink-0">
            <Button
              className="w-full"
              size="lg"
              loading={isLoading}
              disabled={!canGenerate}
              onClick={generateContent}
            >
              {isLoading ? '생성 중...' : '✦ AI 상세페이지 생성'}
            </Button>
          </div>
        </aside>

        {/* Center — 캔버스 */}
        <main className="flex-1 overflow-auto py-7 px-5 flex flex-col items-center bg-bg">
          {/* Canvas toolbar */}
          {generatedContent && (
            <div className="w-full max-w-[660px] flex items-center justify-between mb-[18px]">
              <span className="text-[11px] text-text3 font-mono mr-auto">preview.html</span>
              <div className="flex gap-2">
                <button
                  className="flex items-center gap-1.5 px-[14px] py-[6px] rounded-[6px] text-[12px] font-medium border border-border text-text3 hover:text-text2 hover:border-border2 transition-all duration-150 cursor-pointer"
                  onClick={handleCopyAll}
                >
                  📋 전체 복사
                </button>
                <button
                  className="flex items-center gap-1.5 px-[14px] py-[6px] rounded-[6px] text-[12px] font-bold bg-accent text-[#0c0c10] hover:bg-accent2 transition-all duration-200 cursor-pointer"
                  onClick={handleDownload}
                  disabled={!renderedImageUrl}
                >
                  ⬇ 이미지 저장
                </button>
              </div>
            </div>
          )}

          {/* Preview frame */}
          <div className="max-w-[660px] w-full bg-[var(--surface)] rounded-2xl border border-border flex flex-col overflow-hidden" style={{ maxHeight: 'calc(100vh - 160px)' }}>
            {/* Browser bar — 원본: surface2 배경, 36px 높이 */}
            <div className="h-9 bg-surface2 border-b border-border flex items-center px-[14px] gap-[10px] shrink-0">
              <div className="flex gap-[5px]">
                <div className="w-[10px] h-[10px] rounded-full bg-[rgba(255,95,87,0.4)]" />
                <div className="w-[10px] h-[10px] rounded-full bg-[rgba(254,188,46,0.4)]" />
                <div className="w-[10px] h-[10px] rounded-full bg-[rgba(40,200,64,0.4)]" />
              </div>
              <div className="flex-1 bg-surface3 rounded-[5px] h-5 flex items-center px-[10px]">
                <span className="text-[10px] text-text3 font-mono">pagecraft://preview · 상세페이지 미리보기</span>
              </div>
            </div>

            {/* Content area */}
            <div className="bg-[var(--surface)] min-h-[500px] overflow-auto">
              {/* Loading state — AI 링 애니메이션 */}
              {isLoading && (
                <div className="flex flex-col items-center justify-center py-[80px] px-[30px] space-y-6">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent animate-[spin_1s_linear_infinite]" />
                    <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-green animate-[spin_1.5s_linear_infinite_reverse]" />
                    <div className="absolute inset-[18px] rounded-full bg-accent-dim border border-accent animate-[pulse_2s_ease-in-out_infinite]" />
                  </div>
                  <div className="text-center">
                    <p className="text-[14px] font-medium text-text mb-[5px]">{loadingMessage || '처리 중...'}</p>
                    <p className="text-[11px] text-text2 font-mono">잠시만 기다려주세요</p>
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!isLoading && !renderedImageUrl && (
                <div className="flex flex-col items-center justify-center py-[80px] px-[30px] space-y-4">
                  <div className="w-[72px] h-[72px] rounded-[18px] bg-surface2 border border-border flex items-center justify-center text-[30px] mb-[20px]">
                    🛍
                  </div>
                  <div className="text-center">
                    <h3 className="text-[15px] font-semibold text-text mb-[8px]">상품 정보를 입력해주세요</h3>
                    <p className="text-[13px] text-text2 leading-[1.7]">
                      사진을 업로드하고 상품 정보를 입력한 뒤
                      <br />
                      AI 생성 버튼을 누르면 바로 만들어집니다.
                    </p>
                  </div>
                </div>
              )}

              {/* Result preview */}
              {!isLoading && renderedImageUrl && (
                <div className="p-[20px]">
                  <img
                    src={renderedImageUrl}
                    alt="상세페이지 미리보기"
                    className="w-full rounded-[8px]"
                  />
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Right Panel — 480px, 원본 일치 */}
        <aside className="w-[480px] border-l border-border shrink-0 flex flex-col overflow-hidden">
          <ResultTabs />
        </aside>
      </div>

      <StatusBar />
    </div>
  )
}
