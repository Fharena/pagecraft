'use client'

import { useState } from 'react'
import { useEditorStore } from '@/stores/editorStore'

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(text.replace(/\\n/g, '\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      className={`px-[10px] py-[3px] rounded-[5px] text-[11px] cursor-pointer transition-all duration-150 border ${
        copied
          ? 'border-green text-green'
          : 'bg-surface3 border-border text-text2 hover:border-border2 hover:text-text'
      }`}
      onClick={copy}
      title={`${label} 복사`}
    >
      {copied ? '✓ 복사됨' : '📋 복사'}
    </button>
  )
}

function EditableBlock({
  title,
  text,
  multiline = false,
  onSave,
}: {
  title: string
  text: string
  multiline?: boolean
  onSave: (value: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(text)

  const startEdit = () => {
    setDraft(text)
    setEditing(true)
  }

  const save = () => {
    onSave(draft)
    setEditing(false)
  }

  const cancel = () => {
    setDraft(text)
    setEditing(false)
  }

  return (
    <div className="bg-surface2 border border-border rounded-[10px] mb-2 overflow-hidden">
      <div className="flex items-center justify-between px-[13px] py-[9px] border-b border-border">
        <span className="text-[11px] font-semibold text-text2">{title}</span>
        <div className="flex items-center gap-1">
          {editing ? (
            <>
              <button
                className="px-[8px] py-[2px] rounded-[4px] text-[10px] cursor-pointer border border-green text-green hover:bg-green/10"
                onClick={save}
              >
                ✓ 저장
              </button>
              <button
                className="px-[8px] py-[2px] rounded-[4px] text-[10px] cursor-pointer border border-border text-text3 hover:text-text2"
                onClick={cancel}
              >
                취소
              </button>
            </>
          ) : (
            <>
              <button
                className="px-[8px] py-[2px] rounded-[4px] text-[10px] cursor-pointer border border-border text-text3 hover:border-border2 hover:text-text2"
                onClick={startEdit}
                title="수정"
              >
                ✎ 수정
              </button>
              <CopyButton text={text} label={title} />
            </>
          )}
        </div>
      </div>
      {editing ? (
        <textarea
          className="w-full px-[13px] py-[11px] text-[12px] text-text leading-[1.7] bg-transparent border-none outline-none resize-y"
          style={{ minHeight: multiline ? 100 : 40 }}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoFocus
        />
      ) : (
        <div className={`px-[13px] py-[11px] text-[12px] text-text2 leading-[1.7] ${multiline ? 'whitespace-pre-line' : ''}`}>
          {text}
        </div>
      )}
    </div>
  )
}

export default function CopyPanel() {
  const { generatedContent, setGeneratedContent } = useEditorStore()

  if (!generatedContent) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 16px', color: 'var(--text3)', fontSize: 13, lineHeight: 1.8 }}>
        생성 후 각 항목을<br />바로 복사할 수 있습니다
      </div>
    )
  }

  const update = (field: string, value: string) => {
    const updated = { ...generatedContent }
    switch (field) {
      case 'product_name': updated.product_name = value; break
      case 'subtitle': updated.subtitle = value; break
      case 'main_copy': updated.main_copy = value; break
      case 'selling_points': updated.selling_points = value.split('\n').map(s => s.replace(/^\d+\.\s*/, '')); break
      case 'description': updated.description = value; break
      case 'specs': updated.specs = value.split('\n').map(line => {
        const [key, ...rest] = line.split(':')
        return { key: key.trim(), value: rest.join(':').trim() }
      }); break
      case 'keywords': updated.keywords = value.split(',').map(k => k.trim()).filter(Boolean); break
      case 'caution': updated.caution = value; break
    }
    setGeneratedContent(updated)
  }

  const { product_name, subtitle, main_copy, selling_points, description, specs, keywords, caution } =
    generatedContent

  return (
    <div className="space-y-0">
      <EditableBlock title="상품명" text={product_name} onSave={(v) => update('product_name', v)} />
      <EditableBlock title="서브타이틀" text={subtitle} onSave={(v) => update('subtitle', v)} />
      <EditableBlock title="메인 카피" text={main_copy} onSave={(v) => update('main_copy', v)} />
      <EditableBlock title="판매포인트" text={selling_points.map((sp, i) => `${i + 1}. ${sp}`).join('\n')} multiline onSave={(v) => update('selling_points', v)} />
      <EditableBlock title="상세설명" text={description} multiline onSave={(v) => update('description', v)} />
      <EditableBlock title="스펙" text={specs.map((s) => `${s.key}: ${s.value}`).join('\n')} multiline onSave={(v) => update('specs', v)} />
      <EditableBlock title="키워드" text={keywords.join(', ')} onSave={(v) => update('keywords', v)} />
      <EditableBlock title="주의사항" text={caution} onSave={(v) => update('caution', v)} />

      {/* 수정 후 재렌더링 버튼 */}
      <button
        className="w-full mt-3 py-[9px] rounded-[8px] text-[12px] font-bold border border-accent text-accent hover:bg-accent-dim transition-all duration-150 cursor-pointer"
        onClick={() => {
          // 재렌더링은 generateContent를 다시 호출하지 않고
          // 수정된 content로 render API만 재호출
          import('@/lib/api').then(({ api }) =>
            import('@/stores/imageStore').then(({ useImageStore }) =>
              import('@/lib/image').then(({ compressForRender }) => {
                const { setIsRenderingPng, setRenderedImageUrl, setLoadingMessage } = useEditorStore.getState()
                const { images, storeIntroImage, termsImage } = useImageStore.getState()
                setIsRenderingPng(true)
                setLoadingMessage('상세페이지를 다시 렌더링합니다...')
                Promise.all(images.map(img => compressForRender(img.dataUrl)))
                  .then(renderImages =>
                    Promise.all([
                      storeIntroImage ? compressForRender(storeIntroImage) : undefined,
                      termsImage ? compressForRender(termsImage) : undefined,
                    ]).then(([storeImg, termsImg]) =>
                      api.post<Blob>('/api/render', {
                        data: generatedContent,
                        price: '',
                        images: renderImages,
                        storeIntroImage: storeImg,
                        termsImage: termsImg,
                      })
                    )
                  )
                  .then(blob => {
                    if (blob instanceof Blob) setRenderedImageUrl(URL.createObjectURL(blob))
                  })
                  .finally(() => {
                    setIsRenderingPng(false)
                    setLoadingMessage('')
                  })
              })
            )
          )
        }}
      >
        🔄 수정사항 반영 (재렌더링)
      </button>
    </div>
  )
}
