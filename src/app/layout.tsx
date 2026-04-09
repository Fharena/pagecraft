import type { Metadata } from 'next'
import './globals.css'
import ToastContainer from '@/components/ui/Toast'

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
    <html lang="ko">
      <body className="bg-bg text-text antialiased">
        {children}
        <ToastContainer />
      </body>
    </html>
  )
}
