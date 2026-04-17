'use client'

import * as Sentry from '@sentry/nextjs'

export default function SentryTest() {
  const triggerClientError = () => {
    throw new Error('[Sentry Test] 클라이언트 에러 — ' + new Date().toISOString())
  }

  const captureException = () => {
    Sentry.captureException(
      new Error('[Sentry Test] captureException — ' + new Date().toISOString())
    )
    alert('Sentry로 전송됨. Issues 대시보드 확인')
  }

  const triggerServerError = async () => {
    const res = await fetch('/api/sentry-test-error')
    alert('서버 응답: ' + res.status)
  }

  return (
    <div style={{ padding: 40, maxWidth: 500, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>Sentry 동작 테스트</h1>
      <p style={{ fontSize: 12, color: 'var(--text3)' }}>
        DSN 설정 확인용. 버튼 누른 후 Sentry Issues 대시보드에서 수신 여부 확인.
      </p>

      <button onClick={triggerClientError} style={{ padding: 12, background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
        1. 클라이언트 에러 (throw)
      </button>

      <button onClick={captureException} style={{ padding: 12, background: 'var(--accent)', color: '#0c0c10', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
        2. Sentry.captureException 직접 호출
      </button>

      <button onClick={triggerServerError} style={{ padding: 12, background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer' }}>
        3. 서버 API 에러
      </button>
    </div>
  )
}
