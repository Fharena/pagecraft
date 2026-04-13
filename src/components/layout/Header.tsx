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
    <header
      style={{
        height: '48px',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: '16px',
        flexShrink: 0,
        zIndex: 100,
      }}
    >
      {/* macOS traffic lights */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f57' }} />
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#febc2e' }} />
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#28c840' }} />
      </div>

      {/* Centered logo — empty space, Playfair Display serif 15px accent */}
      <div
        style={{
          flex: 1,
          textAlign: 'center',
          fontFamily: 'var(--serif)',
          fontSize: '15px',
          color: 'var(--accent)',
        }}
      >
        {' '}
      </div>

      {/* Theme toggle: label BEFORE knob */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          style={{
            fontFamily: 'var(--mono)',
            fontSize: '10px',
            color: 'var(--text3)',
          }}
        >
          {isDark ? '🌙 다크' : '☀️ 라이트'}
        </span>
        <div
          onClick={toggle}
          style={{
            width: '36px',
            height: '20px',
            background: 'var(--surface3)',
            border: '1px solid var(--border2)',
            borderRadius: '10px',
            position: 'relative',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '2px',
              left: '2px',
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: isDark ? 'var(--text2)' : 'var(--accent)',
              transition: 'transform 0.2s',
              transform: isDark ? 'translateX(0)' : 'translateX(16px)',
            }}
          />
        </div>
      </div>

      {/* Badge */}
      <div
        style={{
          fontFamily: 'var(--mono)',
          fontSize: '10px',
          color: 'var(--text3)',
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          padding: '3px 10px',
          borderRadius: '4px',
        }}
      >
        패션 · 의류 · 잡화
      </div>
    </header>
  )
}
