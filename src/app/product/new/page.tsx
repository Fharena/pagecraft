'use client'

import Header from '@/components/layout/Header'
import StatusBar from '@/components/layout/StatusBar'
import ProductForm from '@/components/layout/ProductForm'
import ImageUploader from '@/components/image/ImageUploader'
import ImageGrid from '@/components/image/ImageGrid'
import SingleImageUpload from '@/components/image/SingleImageUpload'
import ResultTabs from '@/components/editor/ResultTabs'
import Button from '@/components/ui/Button'
import { useProductStore } from '@/stores/productStore'
import { useImageStore } from '@/stores/imageStore'
import { useEditorStore } from '@/stores/editorStore'
import { useAIGenerate } from '@/hooks/useAIGenerate'

export default function ProductNewPage() {
  const { product } = useProductStore()
  const { images, storeIntroImage, termsImage, setStoreIntroImage, setTermsImage } =
    useImageStore()
  const { isGenerating, isRenderingPng, renderedImageUrl } = useEditorStore()
  const { generateContent } = useAIGenerate()

  const canGenerate = images.length > 0 && product.name.trim() !== ''
  const isLoading = isGenerating || isRenderingPng

  return (
    <div className="flex flex-col h-screen">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel — 입력 */}
        <aside className="w-80 border-r border-border overflow-auto p-4 space-y-6 shrink-0">
          <section>
            <h2 className="text-sm font-semibold text-text mb-3">
              상품 이미지
            </h2>
            <ImageUploader />
            <div className="mt-3">
              <ImageGrid />
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-text mb-3">
              상품 정보
            </h2>
            <ProductForm />
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-text">추가 이미지</h2>
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
            {isLoading ? '생성 중...' : 'AI 상세페이지 생성'}
          </Button>
        </aside>

        {/* Center — 미리보기 */}
        <main className="flex-1 overflow-auto p-6 flex items-start justify-center bg-bg">
          {renderedImageUrl ? (
            <div className="max-w-[400px] w-full">
              <img
                src={renderedImageUrl}
                alt="상세페이지 미리보기"
                className="w-full rounded-lg border border-border shadow-lg"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted">
              <div className="text-center">
                <p className="text-lg mb-2">상세페이지 미리보기</p>
                <p className="text-sm">
                  왼쪽에서 상품 정보를 입력하고 생성 버튼을 누르면
                  <br />
                  여기에 결과가 표시됩니다
                </p>
              </div>
            </div>
          )}
        </main>

        {/* Right Panel — 결과 탭 */}
        <aside className="w-96 border-l border-border shrink-0 flex flex-col overflow-hidden">
          <ResultTabs />
        </aside>
      </div>

      <StatusBar />
    </div>
  )
}
