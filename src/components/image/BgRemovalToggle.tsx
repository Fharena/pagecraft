'use client'

import { useImageStore } from '@/stores/imageStore'
import { useBgRemoval } from '@/hooks/useBgRemoval'

export default function BgRemovalToggle() {
  const { bgRemoveEnabled, setBgRemoveEnabled } = useImageStore()
  const { isModelLoading, isProcessing, progress, processAllImages, restoreAll } = useBgRemoval()

  const toggle = () => {
    const next = !bgRemoveEnabled
    setBgRemoveEnabled(next)
    if (next) {
      processAllImages()
    } else {
      restoreAll()
    }
  }

  const isWorking = isModelLoading || isProcessing

  return (
    <div className="border border-border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm text-text">배경 자동 제거</label>
          <span className="text-[10px] bg-green/20 text-green px-1.5 py-0.5 rounded font-medium">AI</span>
        </div>
        <button
          className={`w-8 h-[18px] rounded-full relative transition-colors cursor-pointer ${bgRemoveEnabled ? 'bg-accent' : 'bg-border'}`}
          onClick={toggle}
          disabled={isWorking}
        >
          <div className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow transition-all ${bgRemoveEnabled ? 'left-[14px]' : 'left-[2px]'}`} />
        </button>
      </div>

      {isWorking && (
        <div className="space-y-1">
          <div className="h-1 bg-border rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
          <p className="text-[11px] text-muted">{progress}</p>
        </div>
      )}
    </div>
  )
}
