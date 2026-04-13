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
          : 'bg-surface3 border-border text-text3 hover:border-border2 hover:text-text2'
      }`}
      onClick={copy}
      title={`${label} 복사`}
    >
      {copied ? '✓ 복사됨' : '📋 복사'}
    </button>
  )
}

function CopyBlock({ title, text, multiline = false }: { title: string; text: string; multiline?: boolean }) {
  return (
    <div className="bg-surface2 border border-border rounded-[10px] mb-2 overflow-hidden">
      <div className="flex items-center justify-between px-[13px] py-[9px] border-b border-border">
        <span className="text-[11px] font-semibold text-text2">{title}</span>
        <CopyButton text={text} label={title} />
      </div>
      <div className={`px-[13px] py-[11px] text-[12px] text-text2 leading-[1.7] ${multiline ? 'whitespace-pre-line' : ''}`}>
        {text}
      </div>
    </div>
  )
}

export default function CopyPanel() {
  const { generatedContent } = useEditorStore()

  if (!generatedContent) {
    return (
      <div className="text-center text-text3" style={{ padding: '60px 16px', fontSize: 13, lineHeight: 1.8 }}>
        생성 후 각 항목을<br />바로 복사할 수 있습니다
      </div>
    )
  }

  const { product_name, subtitle, main_copy, selling_points, description, specs, keywords, caution } =
    generatedContent

  return (
    <div className="space-y-0">
      <CopyBlock title="상품명" text={product_name} />
      <CopyBlock title="서브타이틀" text={subtitle} />
      <CopyBlock title="메인 카피" text={main_copy} />
      <CopyBlock title="판매포인트" text={selling_points.map((sp, i) => `${i + 1}. ${sp}`).join('\n')} multiline />
      <CopyBlock title="상세설명" text={description} multiline />
      <CopyBlock title="스펙" text={specs.map((s) => `${s.key}: ${s.value}`).join('\n')} multiline />
      <CopyBlock title="키워드" text={keywords.join(', ')} />
      <CopyBlock title="주의사항" text={caution} />
    </div>
  )
}
