'use client'

import { useState, useEffect } from 'react'

export default function Header() {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('pagecraft-theme')
    if (saved === 'light') {
      setIsDark(false)
      document.documentElement.classList.add('light')
    }
  }, [])

  const toggle = () => {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('light', !next)
    localStorage.setItem('pagecraft-theme', next ? 'dark' : 'light')
  }

  return (
    <header className="h-12 bg-surface border-b border-border flex items-center justify-between px-4 shrink-0 z-50">
      <div className="flex items-center gap-3">
        <span className="text-accent font-bold text-lg tracking-tight">
          PageCraft
        </span>
        <span className="text-[10px] text-accent/70 bg-accent/10 px-2 py-0.5 rounded">
          Pro v2.0
        </span>
        <span className="text-[10px] text-muted border border-border px-2 py-0.5 rounded">
          패션 · 의류 · 잡화
        </span>
      </div>

      <div className="flex items-center gap-4">
        <button
          className="flex items-center gap-2 text-xs text-muted hover:text-text cursor-pointer transition-colors"
          onClick={toggle}
        >
          <div className={`w-8 h-[18px] rounded-full relative transition-colors ${isDark ? 'bg-border' : 'bg-accent'}`}>
            <div className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow transition-all ${isDark ? 'left-[2px]' : 'left-[14px]'}`} />
          </div>
          {isDark ? '🌙 다크' : '☀️ 라이트'}
        </button>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green animate-pulse" />
          <span className="text-[10px] text-muted">Ready</span>
        </div>
      </div>
    </header>
  )
}
