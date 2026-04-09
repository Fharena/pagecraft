'use client'

import { useState, useEffect } from 'react'

export default function Header() {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    document.documentElement.classList.toggle('light', !isDark)
  }, [isDark])

  return (
    <header className="h-12 bg-surface border-b border-border flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <span className="text-accent font-bold text-lg tracking-tight">
          PageCraft
        </span>
        <span className="text-xs text-muted bg-accent/10 px-2 py-0.5 rounded">
          v1.0
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          className="text-muted hover:text-text text-sm cursor-pointer transition-colors"
          onClick={() => setIsDark(!isDark)}
        >
          {isDark ? '☀️ 라이트' : '🌙 다크'}
        </button>
      </div>
    </header>
  )
}
