import type { Metadata } from 'next'
import Script from 'next/script'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import ToastContainer from '@/components/ui/Toast'
import AuthProvider from '@/components/auth/AuthProvider'

export const metadata: Metadata = {
  title: 'PageCraft — AI 상세페이지 자동 생성',
  description: '쿠팡 셀러를 위한 AI 상품 등록 자동화 도구',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&family=DM+Mono:wght@400;500&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-bg text-text antialiased">
        <Script id="theme-init" strategy="beforeInteractive">{`
          (function() {
            var saved = localStorage.getItem('pagecraft-theme');
            if (saved === 'light' || (!saved && !window.matchMedia('(prefers-color-scheme: dark)').matches)) {
              document.documentElement.classList.add('light');
            }
          })();
        `}</Script>
        <AuthProvider>
          {children}
          <ToastContainer />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
