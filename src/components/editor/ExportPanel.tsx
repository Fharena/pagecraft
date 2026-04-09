'use client'

import { useEditorStore } from '@/stores/editorStore'
import { showToast } from '@/components/ui/Toast'

export default function ExportPanel() {
  const { generatedContent, renderedImageUrl, generatedTitles, generatedTags } =
    useEditorStore()

  const downloadPng = () => {
    if (!renderedImageUrl) return
    const a = document.createElement('a')
    a.href = renderedImageUrl
    const safeName = (generatedContent?.product_name || '상품')
      .replace(/[/\\?%*:|"<>]/g, '')
    a.download = `상세페이지_${safeName}.png`
    a.click()
    showToast('PNG 다운로드 시작')
  }

  const copyAll = () => {
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
    if (generatedTitles.length > 0) {
      parts.push('')
      parts.push('[최적화 상품명]')
      generatedTitles.forEach((t) => parts.push(`#${t.rank} (${t.strategy}) ${t.title}`))
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
      <h3 className="text-sm font-medium text-text">내보내기 옵션</h3>

      <button
        className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-accent/30 transition-colors cursor-pointer text-left"
        onClick={downloadPng}
        disabled={!renderedImageUrl}
      >
        <span className="text-2xl">🖼</span>
        <div>
          <p className="text-sm font-medium text-text">이미지 저장 (PNG)</p>
          <p className="text-xs text-muted">상세페이지 이미지 다운로드</p>
        </div>
      </button>

      <button
        className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-accent/30 transition-colors cursor-pointer text-left"
        onClick={copyAll}
        disabled={!generatedContent}
      >
        <span className="text-2xl">📋</span>
        <div>
          <p className="text-sm font-medium text-text">전체 텍스트 복사</p>
          <p className="text-xs text-muted">모든 내용 클립보드 복사</p>
        </div>
      </button>
    </div>
  )
}
