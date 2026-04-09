'use client'

import { useEditorStore } from '@/stores/editorStore'
import { showToast } from '@/components/ui/Toast'
import Button from '@/components/ui/Button'

export default function ExportPanel() {
  const { generatedContent, renderedImageUrl, generatedTitles, generatedTags } =
    useEditorStore()

  const downloadPng = () => {
    if (!renderedImageUrl) return
    const a = document.createElement('a')
    a.href = renderedImageUrl
    a.download = `상세페이지_${generatedContent?.product_name || '상품'}.png`
    a.click()
    showToast('PNG 다운로드 시작')
  }

  const copyAll = () => {
    if (!generatedContent) return

    const parts: string[] = []

    parts.push(`[상품명] ${generatedContent.product_name}`)
    parts.push(`[부제] ${generatedContent.subtitle}`)
    parts.push(`[메인카피] ${generatedContent.main_copy}`)
    parts.push('')
    parts.push('[셀링포인트]')
    generatedContent.selling_points.forEach((sp, i) =>
      parts.push(`${i + 1}. ${sp}`),
    )
    parts.push('')
    parts.push('[상품설명]')
    parts.push(generatedContent.description)
    parts.push('')
    parts.push('[스펙]')
    generatedContent.specs.forEach((s) =>
      parts.push(`${s.key}: ${s.value}`),
    )
    parts.push('')
    parts.push(`[키워드] ${generatedContent.keywords.join(', ')}`)
    parts.push(`[주의사항] ${generatedContent.caution}`)

    if (generatedTitles.length > 0) {
      parts.push('')
      parts.push('[최적화 상품명]')
      generatedTitles.forEach((t) =>
        parts.push(`#${t.rank} (${t.strategy}) ${t.title}`),
      )
    }

    if (generatedTags.length > 0) {
      parts.push('')
      parts.push(`[태그] ${generatedTags.map((t) => t.text).join(', ')}`)
    }

    navigator.clipboard.writeText(parts.join('\n'))
    showToast('전체 텍스트 복사됨')
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-text">내보내기</h3>

      <div className="space-y-3">
        <Button
          className="w-full"
          onClick={downloadPng}
          disabled={!renderedImageUrl}
        >
          상세페이지 PNG 다운로드
        </Button>

        <Button
          className="w-full"
          variant="secondary"
          onClick={copyAll}
          disabled={!generatedContent}
        >
          전체 텍스트 복사
        </Button>
      </div>

      {renderedImageUrl && (
        <div className="mt-4">
          <p className="text-xs text-muted mb-2">미리보기</p>
          <img
            src={renderedImageUrl}
            alt="상세페이지 미리보기"
            className="w-full rounded-lg border border-border"
          />
        </div>
      )}
    </div>
  )
}
