export interface CoupangSuggestion {
  seed: string
  suggestions: string[]
}

export interface CoupangSuggestResponse {
  seeds: string[]
  bySeed: CoupangSuggestion[]
  suggestions: string[]
}
