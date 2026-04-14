import { create } from 'zustand'
import type { ProductImage } from '@/types/product'
import { generateId } from '@/lib/image'
import { saveImagesToDB, loadImagesFromDB, clearImagesFromDB } from '@/lib/imageDB'

// localStorage 키 — 스토어 소개/약관 이미지는 세션과 무관하게 영구 보존
const LS_STORE_INTRO = 'pagecraft-store-intro'
const LS_TERMS = 'pagecraft-terms'

function saveToLocal(key: string, value: string | null) {
  if (typeof window === 'undefined') return
  if (value) localStorage.setItem(key, value)
  else localStorage.removeItem(key)
}

function loadFromLocal(key: string): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(key)
}

interface ImageState {
  images: ProductImage[]
  storeIntroImage: string | null
  termsImage: string | null
  bgRemoveEnabled: boolean
  aiModelEnabled: boolean
  aiModelGender: 'male' | 'female'
  _hydrated: boolean

  addImages: (dataUrls: string[], prepend?: boolean) => void
  removeImage: (id: string) => void
  reorderImages: (fromIndex: number, toIndex: number) => void
  updateImage: (id: string, partial: Partial<ProductImage>) => void
  setStoreIntroImage: (dataUrl: string | null) => void
  setTermsImage: (dataUrl: string | null) => void
  setBgRemoveEnabled: (enabled: boolean) => void
  setAiModelEnabled: (enabled: boolean) => void
  setAiModelGender: (gender: 'male' | 'female') => void
  clearImages: () => void
  resetAll: () => void
  _hydrate: () => Promise<void>
}

// IndexedDB에 이미지 동기 저장 (fire-and-forget)
function persistImages(images: ProductImage[]) {
  saveImagesToDB(images).catch(() => {})
}

export const useImageStore = create<ImageState>()((set, get) => ({
  images: [],
  storeIntroImage: null,
  termsImage: null,
  bgRemoveEnabled: false,
  aiModelEnabled: false,
  aiModelGender: 'female',
  _hydrated: false,

  addImages: (dataUrls, prepend) => {
    set((state) => {
      const incoming = dataUrls.map((dataUrl) => ({
        id: generateId(),
        dataUrl,
        bgRemoved: false,
        order: 0,
      }))
      const merged = prepend
        ? [...incoming, ...state.images]
        : [...state.images, ...incoming]
      const newImages = merged.map((img, i) => ({ ...img, order: i }))
      persistImages(newImages)
      return { images: newImages }
    })
  },

  removeImage: (id) => {
    set((state) => {
      const newImages = state.images
        .filter((img) => img.id !== id)
        .map((img, i) => ({ ...img, order: i }))
      persistImages(newImages)
      return { images: newImages }
    })
  },

  reorderImages: (fromIndex, toIndex) => {
    set((state) => {
      const newImages = [...state.images]
      const [moved] = newImages.splice(fromIndex, 1)
      newImages.splice(toIndex, 0, moved)
      const reordered = newImages.map((img, i) => ({ ...img, order: i }))
      persistImages(reordered)
      return { images: reordered }
    })
  },

  updateImage: (id, partial) => {
    set((state) => {
      const newImages = state.images.map((img) =>
        img.id === id ? { ...img, ...partial } : img,
      )
      persistImages(newImages)
      return { images: newImages }
    })
  },

  setStoreIntroImage: (dataUrl) => {
    set({ storeIntroImage: dataUrl })
    saveToLocal(LS_STORE_INTRO, dataUrl)
  },
  setTermsImage: (dataUrl) => {
    set({ termsImage: dataUrl })
    saveToLocal(LS_TERMS, dataUrl)
  },

  setBgRemoveEnabled: (enabled) => set({ bgRemoveEnabled: enabled }),
  setAiModelEnabled: (enabled) => set({ aiModelEnabled: enabled }),
  setAiModelGender: (gender) => set({ aiModelGender: gender }),

  clearImages: () => {
    set({ images: [], storeIntroImage: null, termsImage: null })
    clearImagesFromDB().catch(() => {})
  },

  // 새 작업: 상품 이미지 초기화, 스토어 소개/약관은 localStorage에서 복원
  resetAll: () => {
    set({
      images: [],
      storeIntroImage: loadFromLocal(LS_STORE_INTRO),
      termsImage: loadFromLocal(LS_TERMS),
      bgRemoveEnabled: false,
      aiModelEnabled: false,
      aiModelGender: 'female',
    })
    clearImagesFromDB().catch(() => {})
  },

  // IndexedDB + localStorage에서 복원
  _hydrate: async () => {
    if (get()._hydrated) return
    try {
      const images = await loadImagesFromDB()
      const storeIntro = loadFromLocal(LS_STORE_INTRO)
      const terms = loadFromLocal(LS_TERMS)
      set({
        images: images.length > 0 ? images : [],
        storeIntroImage: storeIntro,
        termsImage: terms,
        _hydrated: true,
      })
    } catch {
      set({ _hydrated: true })
    }
  },
}))

// 클라이언트에서 자동 hydration
if (typeof window !== 'undefined') {
  useImageStore.getState()._hydrate()
}
