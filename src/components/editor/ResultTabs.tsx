'use client'

import { useEditorStore } from '@/stores/editorStore'
import CopyPanel from './CopyPanel'
import TitlePanel from './TitlePanel'
import TagPanel from './TagPanel'
import ExportPanel from './ExportPanel'

const TABS = [
  { key: 'copy' as const, label: '📄 텍스트' },
  { key: 'title' as const, label: '✨ 상품명' },
  { key: 'tags' as const, label: '🏷 태그' },
  { key: 'export' as const, label: '🖼 썸네일' },
]

export default function ResultTabs() {
  const { activeTab, setActiveTab } = useEditorStore()

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-border shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`
              flex-1 py-[13px] text-center text-[12px] font-medium cursor-pointer
              border-b-2 transition-all duration-150
              ${
                activeTab === tab.key
                  ? 'text-accent border-accent'
                  : 'text-text3 border-transparent hover:text-text2'
              }
            `}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-[14px] panel-body-scroll">
        {activeTab === 'copy' && <CopyPanel />}
        {activeTab === 'title' && <TitlePanel />}
        {activeTab === 'tags' && <TagPanel />}
        {activeTab === 'export' && <ExportPanel />}
      </div>
    </div>
  )
}
