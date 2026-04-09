import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-accent">PageCraft</h1>
        <p className="text-muted text-lg">
          쿠팡 셀러를 위한 AI 상품 등록 자동화 도구
        </p>
        <p className="text-sm text-muted max-w-md">
          상품 사진만 올리면 AI가 카피, 상품명, 태그 20개, 상세페이지까지
          자동으로 만들어줍니다.
        </p>
        <Link
          href="/product/new"
          className="inline-block bg-accent text-black px-8 py-3 rounded-lg font-semibold hover:bg-accent/90 transition-colors"
        >
          상품 등록 시작
        </Link>
      </div>
    </div>
  )
}
