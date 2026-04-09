'use client'

import { useEditorStore } from '@/stores/editorStore'
import { useAIGenerate } from '@/hooks/useAIGenerate'
import { showToast } from '@/components/ui/Toast'
import Button from '@/components/ui/Button'

export default function TagPanel() {
  const { generatedTags, isGeneratingTags } = useEditorStore()
  const { generateTags } = useAIGenerate()

  const copyAllTags = () => {
    const text = generatedTags.map((t) => t.text).join(', ')
    navigator.clipboard.writeText(text)
    showToast('전체 태그 복사됨')
  }

  const copyTag = (text: string) => {
    navigator.clipboard.writeText(text)
    showToast(`"${text}" 복사됨`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text">쿠팡 태그 (20개)</h3>
        <div className="flex gap-2">
          {generatedTags.length > 0 && (
            <Button size="sm" variant="secondary" onClick={copyAllTags}>
              전체 복사
            </Button>
          )}
          <Button
            size="sm"
            loading={isGeneratingTags}
            onClick={generateTags}
          >
            {generatedTags.length > 0 ? '다시 생성' : '생성하기'}
          </Button>
        </div>
      </div>

      {generatedTags.length === 0 && !isGeneratingTags && (
        <p className="text-center text-muted text-sm py-8">
          쿠팡 검색 트렌드를 분석하여 태그 20개를 AI가 생성합니다
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {generatedTags.map((tag, i) => (
          <button
            key={i}
            className={`
              px-3 py-1.5 rounded-full text-sm cursor-pointer transition-colors
              ${
                tag.isTrending
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                  : 'bg-surface border border-border text-text hover:border-accent/50'
              }
            `}
            onClick={() => copyTag(tag.text)}
            title={tag.isTrending ? '쿠팡 인기 검색어' : ''}
          >
            {tag.text}
            {tag.isTrending && ' *'}
          </button>
        ))}
      </div>

      {generatedTags.some((t) => t.isTrending) && (
        <p className="text-xs text-muted">
          * 표시된 태그는 쿠팡 인기 검색어와 일치합니다
        </p>
      )}
    </div>
  )
}
