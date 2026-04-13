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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="data:image/png;base64,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" alt="MagicOne" style={{ height: 50, objectFit: 'contain', flexShrink: 0 }} />

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
