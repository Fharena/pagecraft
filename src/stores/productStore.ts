import { create } from 'zustand'
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

export const useProductStore = create<ProductState>((set) => ({
  product: { ...defaultProduct },
  setProduct: (partial) =>
    set((state) => ({
      product: { ...state.product, ...partial },
    })),
  resetProduct: () => set({ product: { ...defaultProduct } }),
}))
