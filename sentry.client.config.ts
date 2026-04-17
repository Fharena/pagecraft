import * as Sentry from '@sentry/nextjs'

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1, // 10% 샘플링 (무료 티어 아껴쓰기)
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  })
}
