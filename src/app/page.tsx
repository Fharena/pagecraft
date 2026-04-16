'use client'

import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const skipAuth = process.env.NEXT_PUBLIC_SKIP_AUTH === 'true'

  useEffect(() => {
    if (skipAuth || session) router.push('/product/new')
  }, [session, router, skipAuth])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <p className="text-text3">로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg">
      <div className="text-center space-y-6 max-w-md px-6">
        <h1 className="text-4xl font-bold text-accent">PageCraft</h1>
        <p className="text-text3 text-lg">
          쿠팡 셀러를 위한 AI 상품 등록 자동화 도구
        </p>
        <p className="text-sm text-text3">
          상품 사진만 올리면 AI가 카피, 상품명, 태그 20개, 상세페이지까지
          자동으로 만들어줍니다.
        </p>

        <button
          onClick={() => signIn('google', { callbackUrl: '/product/new' })}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            width: '100%',
            padding: '12px 24px',
            borderRadius: 10,
            border: '1px solid var(--border2)',
            background: 'var(--surface)',
            color: 'var(--text)',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)'
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border2)'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google 계정으로 시작하기
        </button>

        <p className="text-[11px] text-text3">
          데모 버전 · 수강생 전용
        </p>
      </div>
    </div>
  )
}
