import { create } from 'zustand'

interface UsageData {
  credits: { used: number; limit: number; remaining: number }
  cost: { generate: number; image: number; 'bg-remove': number }
}

interface UsageState {
  usage: UsageData | null
  fetchUsage: () => Promise<void>
}

export const useUsageStore = create<UsageState>((set) => ({
  usage: null,
  fetchUsage: async () => {
    try {
      const res = await fetch('/api/usage', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        set({ usage: data })
      }
    } catch {
      /* ignore */
    }
  },
}))
