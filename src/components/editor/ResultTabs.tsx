'use client'

import { useEditorStore } from '@/stores/editorStore'
import CopyPanel from './CopyPanel'
import TitlePanel from './TitlePanel'
import TagPanel from './TagPanel'
import ExportPanel from './ExportPanel'

const TABS = [
  { key: 'copy' as const, label: '카피' },
  { key: 'title' as const, label: '상품명' },
  { key: 'tags' as const, label: '태그' },
  { key: 'export' as const, label: '내보내기' },
]

export default function ResultTabs() {
  const { activeTab, setActiveTab } = useEditorStore()

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`
              flex-1 px-4 py-3 text-sm font-medium transition-colors cursor-pointer
              ${
                activeTab === tab.key
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-muted hover:text-text'
              }
            `}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'copy' && <CopyPanel />}
        {activeTab === 'title' && <TitlePanel />}
        {activeTab === 'tags' && <TagPanel />}
        {activeTab === 'export' && <ExportPanel />}
      </div>
    </div>
  )
}
