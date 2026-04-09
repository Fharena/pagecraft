import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Product } from '@/types/product'

interface ProductState {
  product: Product
  setProduct: (product: Partial<Product>) => void
  resetProduct: () => void
}

const defaultProduct: Product = {
  brand: '',
  name: '',
  price: '',
  category: '',
  platform: '쿠팡',
  memo: '',
  features: [],
}

export const useProductStore = create<ProductState>()(
  persist(
    (set) => ({
      product: { ...defaultProduct },
      setProduct: (partial) =>
        set((state) => ({
          product: { ...state.product, ...partial },
        })),
      resetProduct: () => set({ product: { ...defaultProduct } }),
    }),
    {
      name: 'pagecraft-product',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)
