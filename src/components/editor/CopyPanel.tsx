'use client'

import { useEditorStore } from '@/stores/editorStore'
import { showToast } from '@/components/ui/Toast'
import Card from '@/components/ui/Card'

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text).then(() => {
    showToast(`${label} 복사됨`)
  })
}

export default function CopyPanel() {
  const { generatedContent } = useEditorStore()

  if (!generatedContent) {
    return (
      <div className="text-center text-muted py-12">
        <p>생성된 콘텐츠가 없습니다</p>
        <p className="text-sm mt-1">
          좌측에서 상품 정보를 입력하고 생성 버튼을 누르세요
        </p>
      </div>
    )
  }

  const { product_name, subtitle, main_copy, selling_points, description, specs, keywords, caution } =
    generatedContent

  return (
    <div className="space-y-4">
      <CopyBlock label="상품명" value={product_name} />
      <CopyBlock label="부제" value={subtitle} />
      <CopyBlock label="메인 카피" value={main_copy} />

      <Card>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted">셀링포인트</span>
          <button
            className="text-xs text-accent hover:underline cursor-pointer"
            onClick={() =>
              copyToClipboard(selling_points.join('\n'), '셀링포인트')
            }
          >
            복사
          </button>
        </div>
        <ul className="space-y-1">
          {selling_points.map((sp, i) => (
            <li key={i} className="text-sm text-text">
              {i + 1}. {sp}
            </li>
          ))}
        </ul>
      </Card>

      <CopyBlock label="상품 설명" value={description} multiline />

      {specs.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted">스펙</span>
            <button
              className="text-xs text-accent hover:underline cursor-pointer"
              onClick={() =>
                copyToClipboard(
                  specs.map((s) => `${s.key}: ${s.value}`).join('\n'),
                  '스펙',
                )
              }
            >
              복사
            </button>
          </div>
          <div className="space-y-1">
            {specs.map((s, i) => (
              <div key={i} className="flex text-sm">
                <span className="text-muted w-24 shrink-0">{s.key}</span>
                <span className="text-text">{s.value}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {keywords.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted">키워드</span>
            <button
              className="text-xs text-accent hover:underline cursor-pointer"
              onClick={() =>
                copyToClipboard(keywords.join(', '), '키워드')
              }
            >
              복사
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {keywords.map((kw, i) => (
              <span
                key={i}
                className="bg-accent/10 text-accent text-xs px-2 py-1 rounded"
              >
                #{kw}
              </span>
            ))}
          </div>
        </Card>
      )}

      {caution && <CopyBlock label="주의사항" value={caution} />}
    </div>
  )
}

function CopyBlock({
  label,
  value,
  multiline = false,
}: {
  label: string
  value: string
  multiline?: boolean
}) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted">{label}</span>
        <button
          className="text-xs text-accent hover:underline cursor-pointer"
          onClick={() => copyToClipboard(value, label)}
        >
          복사
        </button>
      </div>
      {multiline ? (
        <p className="text-sm text-text whitespace-pre-line">{value}</p>
      ) : (
        <p className="text-text font-medium">{value}</p>
      )}
    </Card>
  )
}
