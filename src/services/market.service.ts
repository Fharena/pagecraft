import type { CoupangSuggestResponse } from '@/types/market'

const COUPANG_ENDPOINTS = [
  'https://www.coupang.com/np/search/autocomplete',
  'https://m.coupang.com/nm/search/autoComplete',
]

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const MAX_SEEDS = 5

async function fetchSuggestions(keyword: string): Promise<string[]> {
  for (const endpoint of COUPANG_ENDPOINTS) {
    try {
      const url = `${endpoint}?keyword=${encodeURIComponent(keyword)}`
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(5000),
      })

      if (!res.ok) continue

      const data = await res.json()
      const keywords: string[] = []

      if (Array.isArray(data)) {
        for (const item of data) {
          if (typeof item === 'string') keywords.push(item)
          else if (item?.keyword) keywords.push(item.keyword)
          else if (item?.text) keywords.push(item.text)
        }
      } else if (data?.keywords) {
        keywords.push(
          ...data.keywords.map(
            (k: string | { keyword: string }) =>
              typeof k === 'string' ? k : k.keyword,
          ),
        )
      }

      if (keywords.length > 0) return keywords
    } catch {
      continue
    }
  }
  return []
}

export async function getCoupangSuggestions(
  keywordsStr: string,
): Promise<CoupangSuggestResponse> {
  const seeds = keywordsStr
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_SEEDS)

  if (seeds.length === 0) {
    return { seeds: [], bySeed: [], suggestions: [] }
  }

  const bySeed = await Promise.all(
    seeds.map(async (seed) => ({
      seed,
      suggestions: await fetchSuggestions(seed),
    })),
  )

  const seen = new Set<string>()
  const allSuggestions: string[] = []

  for (const { seed, suggestions } of bySeed) {
    for (const s of suggestions) {
      const normalized = s.replace(/\s/g, '').toLowerCase()
      const seedNorm = seed.replace(/\s/g, '').toLowerCase()
      if (normalized !== seedNorm && !seen.has(normalized)) {
        seen.add(normalized)
        allSuggestions.push(s)
      }
    }
  }

  return {
    seeds,
    bySeed,
    suggestions: allSuggestions.slice(0, 30),
  }
}
