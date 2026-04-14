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

function InlineCopy({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }
  return (
    <button
      onClick={copy}
      title="복사"
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: 11, padding: '0 4px', color: copied ? 'var(--green)' : 'var(--text3)',
        transition: 'color 0.15s', flexShrink: 0,
      }}
    >
      {copied ? '✓' : '📋'}
    </button>
  )
}

function SpecBlock({ specs, onUpdate }: { specs: { key: string; value: string }[]; onUpdate: (specs: { key: string; value: string }[]) => void }) {
  const [editIdx, setEditIdx] = useState<number | null>(null)
  const [draft, setDraft] = useState('')

  const startEdit = (idx: number) => {
    setDraft(specs[idx].value)
    setEditIdx(idx)
  }

  const save = () => {
    if (editIdx === null) return
    const updated = specs.map((s, i) => i === editIdx ? { ...s, value: draft } : s)
    onUpdate(updated)
    setEditIdx(null)
  }

  return (
    <div className="bg-surface2 border border-border rounded-[10px] mb-2 overflow-hidden">
      <div className="flex items-center justify-between px-[13px] py-[9px] border-b border-border">
        <span className="text-[11px] font-semibold text-text2">고시정보</span>
        <CopyButton text={specs.map(s => `${s.key}: ${s.value}`).join('\n')} label="고시정보 전체" />
      </div>
      <div className="px-[13px] py-[8px]">
        {specs.map((spec, i) => (
          <div key={i} className="flex items-start gap-2 py-[5px] border-b border-border last:border-b-0" style={{ minHeight: 28 }}>
            <span style={{ fontSize: 11, color: 'var(--text3)', width: 100, flexShrink: 0, paddingTop: 2 }}>{spec.key}</span>
            {editIdx === i ? (
              <div className="flex-1 flex items-center gap-1">
                <input
                  className="flex-1 bg-transparent border-b border-accent text-[12px] text-text outline-none py-0.5"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && save()}
                  autoFocus
                />
                <button onClick={save} style={{ fontSize: 10, color: 'var(--green)', cursor: 'pointer', background: 'none', border: 'none' }}>✓</button>
                <button onClick={() => setEditIdx(null)} style={{ fontSize: 10, color: 'var(--text3)', cursor: 'pointer', background: 'none', border: 'none' }}>✕</button>
              </div>
            ) : (
              <div className="flex-1 flex items-start">
                <span style={{ fontSize: 12, color: 'var(--text2)', flex: 1, paddingTop: 1 }}>
                  {spec.value}
                </span>
                <button
                  onClick={() => startEdit(i)}
                  title="수정"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, padding: '0 4px', color: 'var(--text3)', flexShrink: 0 }}
                >
                  ✎
                </button>
                <InlineCopy text={spec.value} />
              </div>
            )}
          </div>
        ))}
      </div>
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
      {/* 고시정보 — 항목별 인라인 복사 */}
      <SpecBlock specs={specs} onUpdate={(newSpecs) => {
        const updated = { ...generatedContent, specs: newSpecs }
        setGeneratedContent(updated)
      }} />
      <EditableBlock title="키워드" text={keywords.join(', ')} onSave={(v) => update('keywords', v)} />
      <EditableBlock title="주의사항" text={caution} onSave={(v) => update('caution', v)} />

      <p className="text-[10px] text-text3 text-center mt-3 py-2">
        수정 내용은 미리보기에 실시간 반영됩니다
      </p>
    </div>
  )
}
