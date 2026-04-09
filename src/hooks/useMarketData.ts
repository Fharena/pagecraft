'use client'

import { useState, useCallback } from 'react'
import { api } from '@/lib/api'
import type { CoupangSuggestResponse } from '@/types/market'

export function useMarketData() {
  const [suggestions, setSuggestions] = useState<CoupangSuggestResponse | null>(
    null,
  )
  const [isLoading, setIsLoading] = useState(false)

  const fetchSuggestions = useCallback(async (keywords: string) => {
    if (!keywords.trim()) return

    setIsLoading(true)
    try {
      const data = await api.get<CoupangSuggestResponse>(
        `/api/market/suggest?keyword=${encodeURIComponent(keywords)}`,
      )
      setSuggestions(data)
    } catch (err) {
      console.error('쿠팡 키워드 조회 실패:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { suggestions, isLoading, fetchSuggestions }
}
