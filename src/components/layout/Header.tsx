'use client'

import { useState, useEffect } from 'react'

export default function Header() {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('pagecraft-theme') || 'dark'
    if (saved === 'light') {
      setIsDark(false)
      document.documentElement.classList.add('light')
    }
  }, [])

  const toggle = () => {
    const next = !isDark
    setIsDark(next)
    if (next) {
      document.documentElement.classList.remove('light')
      localStorage.setItem('pagecraft-theme', 'dark')
    } else {
      document.documentElement.classList.add('light')
      localStorage.setItem('pagecraft-theme', 'light')
    }
  }

  return (
    <header
      className="shrink-0"
      style={{
        height: 48,
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: 16,
        zIndex: 100,
      }}
    >
      {/* 로고 이미지 — 원본 그대로 */}
      <img src="/logo.png" alt="PageCraft" style={{ height: 50, objectFit: 'contain', flexShrink: 0 }} />

      {/* 가운데 로고 텍스트 — 원본: tb-logo, flex:1, centered, serif 15px accent */}
      <div style={{ flex: 1, textAlign: 'center', fontFamily: 'var(--font-serif)', fontSize: 15, letterSpacing: 0.5, color: 'var(--color-accent)' }}>
        {' '}
      </div>

      {/* 테마 전환 — 원본: theme-label + theme-toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text3)', whiteSpace: 'nowrap' }}>
          {isDark ? '🌙 다크' : '☀️ 라이트'}
        </span>
        <div
          onClick={toggle}
          style={{
            width: 36, height: 20, borderRadius: 10,
            background: 'var(--color-surface3)',
            border: '1px solid var(--color-border2)',
            cursor: 'pointer', position: 'relative', flexShrink: 0,
            transition: 'background 0.2s, border-color 0.2s',
          }}
        >
          <div
            style={{
              position: 'absolute', top: 2, left: 2,
              width: 14, height: 14, borderRadius: '50%',
              background: isDark ? 'var(--color-text2)' : 'var(--color-accent)',
              transition: 'transform 0.2s, background 0.2s',
              transform: isDark ? 'translateX(0)' : 'translateX(16px)',
            }}
          />
        </div>
      </div>

      {/* 뱃지 — 원본: tb-badge */}
      <div
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text3)',
          background: 'var(--color-surface2)',
          padding: '3px 10px', borderRadius: 4,
          border: '1px solid var(--color-border)',
        }}
      >
        패션 · 의류 · 잡화
      </div>
    </header>
  )
}
