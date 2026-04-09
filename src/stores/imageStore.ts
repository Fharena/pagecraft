import { create } from 'zustand'
import type { ProductImage } from '@/types/product'
import { generateId } from '@/lib/image'

interface ImageState {
  images: ProductImage[]
  storeIntroImage: string | null
  termsImage: string | null
  bgRemoveEnabled: boolean
  aiModelEnabled: boolean
  aiModelGender: 'male' | 'female'

  addImages: (dataUrls: string[]) => void
  removeImage: (id: string) => void
  reorderImages: (fromIndex: number, toIndex: number) => void
  updateImage: (id: string, partial: Partial<ProductImage>) => void
  setStoreIntroImage: (dataUrl: string | null) => void
  setTermsImage: (dataUrl: string | null) => void
  setBgRemoveEnabled: (enabled: boolean) => void
  setAiModelEnabled: (enabled: boolean) => void
  setAiModelGender: (gender: 'male' | 'female') => void
  clearImages: () => void
}

export const useImageStore = create<ImageState>((set) => ({
  images: [],
  storeIntroImage: null,
  termsImage: null,
  bgRemoveEnabled: false,
  aiModelEnabled: false,
  aiModelGender: 'female',

  addImages: (dataUrls) =>
    set((state) => ({
      images: [
        ...state.images,
        ...dataUrls.map((dataUrl, i) => ({
          id: generateId(),
          dataUrl,
          bgRemoved: false,
          order: state.images.length + i,
        })),
      ],
    })),

  removeImage: (id) =>
    set((state) => ({
      images: state.images
        .filter((img) => img.id !== id)
        .map((img, i) => ({ ...img, order: i })),
    })),

  reorderImages: (fromIndex, toIndex) =>
    set((state) => {
      const newImages = [...state.images]
      const [moved] = newImages.splice(fromIndex, 1)
      newImages.splice(toIndex, 0, moved)
      return { images: newImages.map((img, i) => ({ ...img, order: i })) }
    }),

  updateImage: (id, partial) =>
    set((state) => ({
      images: state.images.map((img) =>
        img.id === id ? { ...img, ...partial } : img,
      ),
    })),

  setStoreIntroImage: (dataUrl) => set({ storeIntroImage: dataUrl }),
  setTermsImage: (dataUrl) => set({ termsImage: dataUrl }),
  setBgRemoveEnabled: (enabled) => set({ bgRemoveEnabled: enabled }),
  setAiModelEnabled: (enabled) => set({ aiModelEnabled: enabled }),
  setAiModelGender: (gender) => set({ aiModelGender: gender }),
  clearImages: () =>
    set({ images: [], storeIntroImage: null, termsImage: null }),
}))
