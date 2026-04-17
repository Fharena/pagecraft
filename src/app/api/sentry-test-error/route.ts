export async function GET() {
  throw new Error('[Sentry Test] 서버 API 에러 — ' + new Date().toISOString())
}
