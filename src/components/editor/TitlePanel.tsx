'use client'

import { useEditorStore } from '@/stores/editorStore'
import { useAIGenerate } from '@/hooks/useAIGenerate'
import { showToast } from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

export default function TitlePanel() {
  const { generatedTitles, isGeneratingTitles } = useEditorStore()
  const { generateTitles } = useAIGenerate()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text">
          상품명 최적화 (5개)
        </h3>
        <Button
          size="sm"
          loading={isGeneratingTitles}
          onClick={generateTitles}
        >
          {generatedTitles.length > 0 ? '다시 생성' : '생성하기'}
        </Button>
      </div>

      {generatedTitles.length === 0 && !isGeneratingTitles && (
        <p className="text-center text-muted text-sm py-8">
          쿠팡 검색 최적화된 상품명 5개를 AI가 생성합니다
        </p>
      )}

      {generatedTitles.map((title) => (
        <Card key={title.rank}>
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="bg-accent/20 text-accent text-xs font-bold px-2 py-0.5 rounded">
                #{title.rank}
              </span>
              <span className="text-xs text-muted">{title.strategy}</span>
            </div>
            <button
              className="text-xs text-accent hover:underline cursor-pointer"
              onClick={() => {
                navigator.clipboard.writeText(title.title)
                showToast('상품명 복사됨')
              }}
            >
              복사
            </button>
          </div>
          <p className="text-sm text-text font-medium mb-2">{title.title}</p>
          <div className="flex items-center justify-between text-xs text-muted">
            <div className="flex flex-wrap gap-1">
              {title.used_keywords.map((kw, i) => (
                <span key={i} className="bg-surface px-1.5 py-0.5 rounded">
                  {kw}
                </span>
              ))}
            </div>
            <span>{title.char_count}자</span>
          </div>
        </Card>
      ))}
    </div>
  )
}
